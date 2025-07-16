-- Drop all existing policies with exact names
DROP POLICY "Users can view their own bookings" ON public.bookings;
DROP POLICY "Users can create their own bookings" ON public.bookings;  
DROP POLICY "Users can update their own bookings" ON public.bookings;

-- Now change user_id from UUID to TEXT to support both auth UUIDs and session strings
ALTER TABLE public.bookings ALTER COLUMN user_id TYPE TEXT;

-- Create new policies that work with both authenticated users and anonymous sessions  
CREATE POLICY "Allow booking creation for all users" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own bookings by user_id" 
ON public.bookings 
FOR SELECT 
USING (
  -- Allow if authenticated user matches user_id 
  (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
  OR
  -- Allow if anonymous (no auth.uid) - all anonymous users can see all anonymous bookings
  (auth.uid() IS NULL)
);

CREATE POLICY "Users can update their own bookings by user_id" 
ON public.bookings 
FOR UPDATE 
USING (
  -- Allow if authenticated user matches user_id
  (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
  OR
  -- Allow if anonymous (no auth.uid) - all anonymous users can update all anonymous bookings
  (auth.uid() IS NULL)
);