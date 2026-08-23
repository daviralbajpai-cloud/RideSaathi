-- ====================================================================
-- RideSaathi Location Metadata Migration
-- Adds nullable latitude, longitude, and place_id columns to public.rides
-- Safe to run on existing database without data loss.
-- ====================================================================

ALTER TABLE public.rides 
  ADD COLUMN IF NOT EXISTS from_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS from_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS to_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS to_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS from_place_id TEXT,
  ADD COLUMN IF NOT EXISTS to_place_id TEXT;
