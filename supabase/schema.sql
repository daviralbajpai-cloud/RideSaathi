-- ====================================================================
-- RIDE-SAATHI SUPABASE POSTGRESQL SCHEMA & SECURITY POLICIES
-- ====================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. PROFILES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin lookup
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Public Profiles View (Exposes only id, name, photo_url to protect phone numbers before ride acceptance)
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, name, photo_url
  FROM public.profiles;

-- --------------------------------------------------------------------
-- 2. RIDES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offered_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  from_latitude DOUBLE PRECISION,
  from_longitude DOUBLE PRECISION,
  to_latitude DOUBLE PRECISION,
  to_longitude DOUBLE PRECISION,
  from_place_id TEXT,
  to_place_id TEXT,
  ride_date DATE NOT NULL,
  departure_time TEXT NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats >= 1 AND available_seats <= 6),
  note TEXT,
  preferences TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rides_offered_by ON public.rides(offered_by);
CREATE INDEX IF NOT EXISTS idx_rides_status_date ON public.rides(status, ride_date);

-- --------------------------------------------------------------------
-- 3. RIDE_REQUESTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seats_requested INTEGER NOT NULL CHECK (seats_requested >= 1 AND seats_requested <= 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_requests_ride_id ON public.ride_requests(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_requested_by ON public.ride_requests(requested_by);

-- --------------------------------------------------------------------
-- 4. NOTIFICATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'info', 'reminder', 'request', 'warning')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- --------------------------------------------------------------------
-- 5. RECURRING_RIDES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offered_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats >= 1 AND available_seats <= 6),
  repeat_days TEXT[] NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_rides_offered_by ON public.recurring_rides(offered_by);


-- ====================================================================
-- TRIGGERS & AUTOMATION
-- ====================================================================

-- Automatic profile creation upon Supabase auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, photo_url, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Prevent users from modifying `is_admin` column on UPDATE
CREATE OR REPLACE FUNCTION public.prevent_is_admin_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- Only allow if called by superuser or service role
    IF (SELECT current_setting('role', true)) NOT IN ('postgres', 'service_role') THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify their own admin status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_is_admin_protection ON public.profiles;
CREATE TRIGGER enforce_profile_is_admin_protection
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_is_admin_update();


-- ====================================================================
-- SAFE OVERBOOKING PREVENTION & HARDENED RPC FUNCTION
-- ====================================================================
CREATE OR REPLACE FUNCTION public.accept_ride_request(
  p_request_id UUID,
  p_offered_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_ride_id UUID;
  v_seats_requested INT;
  v_available_seats INT;
  v_requester_id UUID;
  v_offered_by UUID;
  v_from_loc TEXT;
  v_to_loc TEXT;
  v_caller_id UUID;
BEGIN
  -- 1. Derive authenticated caller from Supabase session
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthenticated user session');
  END IF;

  -- 2. Obtain target ride_id for p_request_id WITHOUT FOR UPDATE
  SELECT ride_id INTO v_ride_id
  FROM public.ride_requests
  WHERE id = p_request_id;

  IF v_ride_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Pending request not found');
  END IF;

  -- 3. Lock active ride row FIRST (FOR UPDATE) to maintain consistent RIDE -> RIDE_REQUEST lock hierarchy
  SELECT offered_by, available_seats, from_location, to_location
  INTO v_offered_by, v_available_seats, v_from_loc, v_to_loc
  FROM public.rides
  WHERE id = v_ride_id AND status = 'active'
  FOR UPDATE;

  IF v_offered_by IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Ride not found or not active');
  END IF;

  -- 4. Lock ride_request row SECOND (FOR UPDATE) and verify status = 'pending'
  SELECT requested_by, seats_requested
  INTO v_requester_id, v_seats_requested
  FROM public.ride_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE;

  IF v_requester_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Pending request not found');
  END IF;

  -- 5. HARDENED AUTHORIZATION CHECK: Caller must be true ride owner (or platform admin)
  -- Note: Client-supplied p_offered_by is completely ignored for security.
  IF v_caller_id != v_offered_by AND NOT public.is_admin_user() THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized: Only the ride offerer can accept requests');
  END IF;

  -- 6. Check seat availability
  IF v_available_seats < v_seats_requested THEN
    -- Insufficient seats: Decline the request automatically
    UPDATE public.ride_requests
    SET status = 'declined', updated_at = NOW()
    WHERE id = p_request_id;

    RETURN json_build_object('success', false, 'message', 'Not enough available seats left');
  END IF;

  -- 7. Sufficient seats: Update request status and decrement available seats
  UPDATE public.ride_requests
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_request_id;

  UPDATE public.rides
  SET available_seats = available_seats - v_seats_requested
  WHERE id = v_ride_id;

  -- 8. Create notification for the requester
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    v_requester_id,
    'Ride Request Accepted',
    'Your request to join the ride from ' || v_from_loc || ' to ' || v_to_loc || ' was accepted!',
    'success',
    false
  );

  RETURN json_build_object('success', true, 'message', 'Ride request accepted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ====================================================================
-- SEND RIDE REQUEST RPC FUNCTION
-- ====================================================================
CREATE OR REPLACE FUNCTION public.send_ride_request(
  p_ride_id UUID,
  p_seats_requested INT DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  v_offered_by UUID;
  v_available_seats INT;
  v_from_loc TEXT;
  v_to_loc TEXT;
  v_request_id UUID;
  v_caller_id UUID;
  v_caller_phone TEXT;
  v_existing_pending_id UUID;
BEGIN
  -- 1. Derive authenticated caller from Supabase session (Never trust client UUID)
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthenticated user session');
  END IF;

  -- 2. Validate Caller Phone: Requester must have a valid phone number in public.profiles
  SELECT phone INTO v_caller_phone
  FROM public.profiles
  WHERE id = v_caller_id;

  IF v_caller_phone IS NULL OR trim(v_caller_phone) = '' THEN
    RETURN json_build_object('success', false, 'message', 'Phone number is required before requesting a ride');
  END IF;

  -- 3. Validate p_seats_requested range (1 to 5)
  IF p_seats_requested IS NULL OR p_seats_requested < 1 OR p_seats_requested > 5 THEN
    RETURN json_build_object('success', false, 'message', 'Requested seats must be between 1 and 5');
  END IF;

  -- 4. Lock active ride FOR UPDATE and verify existence & available seats
  SELECT offered_by, available_seats, from_location, to_location
  INTO v_offered_by, v_available_seats, v_from_loc, v_to_loc
  FROM public.rides
  WHERE id = p_ride_id AND status = 'active'
  FOR UPDATE;

  IF v_offered_by IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Target ride not found or not active');
  END IF;

  -- 5. Verify caller is not the ride owner
  IF v_caller_id = v_offered_by THEN
    RETURN json_build_object('success', false, 'message', 'You cannot request to join your own ride');
  END IF;

  -- 6. Prevent duplicate pending requests from same user for same ride
  SELECT id INTO v_existing_pending_id
  FROM public.ride_requests
  WHERE ride_id = p_ride_id AND requested_by = v_caller_id AND status = 'pending'
  LIMIT 1;

  IF v_existing_pending_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'You already have a pending request for this ride');
  END IF;

  -- 7. Check seat availability
  IF v_available_seats < p_seats_requested THEN
    RETURN json_build_object('success', false, 'message', 'Not enough available seats left for this ride');
  END IF;

  -- 8. Insert ride request atomically
  INSERT INTO public.ride_requests (ride_id, requested_by, seats_requested, status)
  VALUES (p_ride_id, v_caller_id, p_seats_requested, 'pending')
  RETURNING id INTO v_request_id;

  -- 9. Create Notification 1 for Requester (v_caller_id)
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    v_caller_id,
    'Ride Request Sent',
    'Your request to join the ride from ' || v_from_loc || ' to ' || v_to_loc || ' was sent.',
    'info',
    false
  );

  -- 10. Create Notification 2 for Ride Owner (v_offered_by)
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    v_offered_by,
    'New Ride Request',
    'A person has requested to join your ride from ' || v_from_loc || ' to ' || v_to_loc || '.',
    'request',
    false
  );

  RETURN json_build_object(
    'success', true,
    'request_id', v_request_id,
    'message', 'Ride request sent successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ====================================================================
-- SECURE CONTACT RETRIEVAL FOR ACCEPTED RIDES
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_accepted_ride_contacts()
RETURNS TABLE (
  request_id UUID,
  ride_id UUID,
  participant_id UUID,
  participant_name TEXT,
  participant_phone TEXT,
  participant_photo TEXT
) AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  -- Derive caller from authenticated session
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    rr.id AS request_id,
    rr.ride_id,
    p.id AS participant_id,
    p.name AS participant_name,
    p.phone AS participant_phone,
    p.photo_url AS participant_photo
  FROM public.ride_requests rr
  JOIN public.rides r ON r.id = rr.ride_id
  JOIN public.profiles p ON (
    (r.offered_by = v_caller_id AND p.id = rr.requested_by)
    OR
    (rr.requested_by = v_caller_id AND p.id = r.offered_by)
  )
  WHERE rr.status = 'accepted'
    AND (r.offered_by = v_caller_id OR rr.requested_by = v_caller_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ====================================================================
-- DECLINE RIDE REQUEST RPC FUNCTION
-- ====================================================================
CREATE OR REPLACE FUNCTION public.decline_ride_request(
  p_request_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_ride_id UUID;
  v_requester_id UUID;
  v_offered_by UUID;
  v_from_loc TEXT;
  v_to_loc TEXT;
  v_caller_id UUID;
BEGIN
  -- 1. Derive authenticated caller from session
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthenticated user session');
  END IF;

  -- 2. Obtain target ride_id for p_request_id WITHOUT FOR UPDATE
  SELECT ride_id INTO v_ride_id
  FROM public.ride_requests
  WHERE id = p_request_id;

  IF v_ride_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Pending request not found');
  END IF;

  -- 3. Lock active ride row FIRST (FOR UPDATE) to maintain consistent RIDE -> RIDE_REQUEST lock hierarchy
  SELECT offered_by, from_location, to_location
  INTO v_offered_by, v_from_loc, v_to_loc
  FROM public.rides
  WHERE id = v_ride_id AND status = 'active'
  FOR UPDATE;

  IF v_offered_by IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Associated ride not found');
  END IF;

  -- 4. Lock pending ride_request SECOND (FOR UPDATE) and verify status = 'pending'
  SELECT requested_by INTO v_requester_id
  FROM public.ride_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE;

  IF v_requester_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Pending request not found');
  END IF;

  -- 5. HARDENED AUTHORIZATION CHECK: Caller must be true ride owner (or platform admin)
  IF v_caller_id != v_offered_by AND NOT public.is_admin_user() THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized: Only the ride offerer can decline requests');
  END IF;

  -- 6. Update request status to declined atomically
  UPDATE public.ride_requests
  SET status = 'declined', updated_at = NOW()
  WHERE id = p_request_id;

  -- 7. Insert decline notification for requester (v_requester_id)
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    v_requester_id,
    'Ride Request Declined',
    'Your request to join the ride from ' || v_from_loc || ' to ' || v_to_loc || ' was declined.',
    'warning',
    false
  );

  RETURN json_build_object('success', true, 'message', 'Ride request declined successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Helper function to check if current user is Admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_rides ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- PROFILES POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Authenticated users can view public profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own non-admin profile fields"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- --------------------------------------------------------------------
-- RIDES POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Authenticated users can view active rides"
  ON public.rides FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own ride offers"
  ON public.rides FOR INSERT
  WITH CHECK (
    auth.uid() = offered_by
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND phone IS NOT NULL AND trim(phone) != ''
    )
  );

CREATE POLICY "Users can update or cancel their own rides"
  ON public.rides FOR UPDATE
  USING (auth.uid() = offered_by OR public.is_admin_user());

-- --------------------------------------------------------------------
-- RIDE_REQUESTS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Users can view relevant ride requests"
  ON public.ride_requests FOR SELECT
  USING (
    auth.uid() = requested_by 
    OR auth.uid() IN (SELECT offered_by FROM public.rides WHERE id = ride_id)
    OR public.is_admin_user()
  );

CREATE POLICY "Users can create ride requests"
  ON public.ride_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

DROP POLICY IF EXISTS "Ride offerers can update request status"
ON public.ride_requests;

CREATE POLICY "Only RPCs and admins can update ride requests"
  ON public.ride_requests FOR UPDATE
  USING (public.is_admin_user());

-- --------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification read status"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System/Users can insert notifications"
ON public.notifications;

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- RECURRING_RIDES POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Users can view their own recurring rides"
  ON public.recurring_rides FOR SELECT
  USING (auth.uid() = offered_by OR public.is_admin_user());

CREATE POLICY "Users can create recurring rides"
  ON public.recurring_rides FOR INSERT
  WITH CHECK (auth.uid() = offered_by);

CREATE POLICY "Users can update their own recurring rides"
  ON public.recurring_rides FOR UPDATE
  USING (auth.uid() = offered_by OR public.is_admin_user());

-- --------------------------------------------------------------------
-- RPC EXECUTION PERMISSIONS
-- --------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.accept_ride_request(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.send_ride_request(UUID, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decline_ride_request(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_accepted_ride_contacts() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.accept_ride_request(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_ride_request(UUID, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decline_ride_request(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_accepted_ride_contacts() TO authenticated, service_role;
