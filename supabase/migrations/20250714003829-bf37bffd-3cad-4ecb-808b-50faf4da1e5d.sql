-- Create bookings table to replace Firebase storage
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  
  -- Personal information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  
  -- Booking details
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  pickup_addresses TEXT[] NOT NULL,
  dropoff_addresses TEXT[] NOT NULL,
  
  -- Service details
  service_tier TEXT NOT NULL,
  service_price DECIMAL(10,2) NOT NULL,
  
  -- Items
  selected_items JSONB NOT NULL DEFAULT '{}',
  custom_items JSONB NOT NULL DEFAULT '[]',
  
  -- Quote details
  subtotal DECIMAL(10,2) NOT NULL,
  gst DECIMAL(10,2) NOT NULL,
  qst DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  final_quote_amount DECIMAL(10,2) NOT NULL,
  
  -- Distance and calculations
  calculated_distance TEXT,
  estimated_total_weight DECIMAL(10,3),
  estimated_total_volume DECIMAL(10,3),
  
  -- Payment details summary (no sensitive card info)
  payment_details_summary JSONB NOT NULL,
  
  -- Metadata
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings access
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (user_id = auth.uid()::text::uuid OR user_id::text = auth.uid()::text);

CREATE POLICY "Users can create their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text::uuid OR user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (user_id = auth.uid()::text::uuid OR user_id::text = auth.uid()::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_booking_id ON public.bookings(booking_id);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at);

-- Create device sessions table for anonymous authentication
CREATE TABLE public.device_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Enable RLS for device sessions
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public access to device sessions (for anonymous users)
CREATE POLICY "Allow device session access" 
ON public.device_sessions 
FOR ALL 
USING (true);