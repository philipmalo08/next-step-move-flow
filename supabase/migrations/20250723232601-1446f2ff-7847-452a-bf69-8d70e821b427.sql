-- Create table for company availability settings
CREATE TABLE public.company_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_availability_slot UNIQUE (day_of_week, start_time, end_time)
);

-- Create table for company blackout dates (holidays, maintenance, etc.)
CREATE TABLE public.company_blackout_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_blackout_dates ENABLE ROW LEVEL SECURITY;

-- Create policies for company_availability
CREATE POLICY "Admins can manage all availability" 
ON public.company_availability 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])
));

CREATE POLICY "Public can view availability" 
ON public.company_availability 
FOR SELECT 
USING (true);

-- Create policies for company_blackout_dates
CREATE POLICY "Admins can manage all blackout dates" 
ON public.company_blackout_dates 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])
));

CREATE POLICY "Public can view blackout dates" 
ON public.company_blackout_dates 
FOR SELECT 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_company_availability_updated_at
BEFORE UPDATE ON public.company_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_blackout_dates_updated_at
BEFORE UPDATE ON public.company_blackout_dates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default availability (Monday-Friday 9AM-5PM)
INSERT INTO public.company_availability (day_of_week, start_time, end_time, is_available) VALUES
(1, '09:00:00', '17:00:00', true), -- Monday
(2, '09:00:00', '17:00:00', true), -- Tuesday
(3, '09:00:00', '17:00:00', true), -- Wednesday
(4, '09:00:00', '17:00:00', true), -- Thursday
(5, '09:00:00', '17:00:00', true); -- Friday