-- Add notification_time column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN notification_time TIME DEFAULT '08:00:00';