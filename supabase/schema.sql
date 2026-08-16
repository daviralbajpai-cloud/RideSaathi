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

-- --------------------------------------------------------------------
-- 2. RIDES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offered_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
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

  -- 2. Fetch request details and verify status = 'pending'
  SELECT ride_id, requested_by, seats_requested
  INTO v_ride_id, v_requester_id, v_seats_requested
  FROM public.ride_requests
  WHERE id = p_request_id AND status = 'pending';

  IF v_ride_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Pending request not found');
  END IF;

  -- 3. Lock active ride row FOR UPDATE and obtain true ride owner
  SELECT offered_by, available_seats, from_location, to_location
  INTO v_offered_by, v_available_seats, v_from_loc, v_to_loc
  FROM public.rides
  WHERE id = v_ride_id AND status = 'active'
  FOR UPDATE;

  IF v_offered_by IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Ride not found or not active');
  END IF;

  -- 4. HARDENED AUTHORIZATION CHECK: Caller must be true ride owner (or platform admin)
  -- Note: Client-supplied p_offered_by is completely ignored for security.
  IF v_caller_id != v_offered_by AND NOT public.is_admin_user() THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized: Only the ride offerer can accept requests');
  END IF;

  -- 5. Check seat availability
  IF v_available_seats < v_seats_requested THEN
    -- Insufficient seats: Decline the request automatically
    UPDATE public.ride_requests
    SET status = 'declined', updated_at = NOW()
    WHERE id = p_request_id;

    RETURN json_build_object('success', false, 'message', 'Not enough available seats left');
  END IF;

  -- 6. Sufficient seats: Update request status and decrement available seats
  UPDATE public.ride_requests
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_request_id;

  UPDATE public.rides
  SET available_seats = available_seats - v_seats_requested
  WHERE id = v_ride_id;

  -- 7. Create notification for the requester
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
  WITH CHECK (auth.uid() = offered_by);

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

CREATE POLICY "Ride offerers can update request status"
  ON public.ride_requests FOR UPDATE
  USING (
    auth.uid() IN (SELECT offered_by FROM public.rides WHERE id = ride_id)
    OR auth.uid() = requested_by
    OR public.is_admin_user()
  );

-- --------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification read status"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System/Users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

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
