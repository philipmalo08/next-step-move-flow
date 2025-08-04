-- Create table for chatbot email collection
CREATE TABLE public.chatbot_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  user_session_id TEXT,
  questions_asked INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  marketing_email_sent BOOLEAN DEFAULT false,
  marketing_email_sent_at TIMESTAMP WITH TIME ZONE
);

-- Create table for quote email collection
CREATE TABLE public.quote_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  user_session_id TEXT,
  quote_amount NUMERIC,
  quote_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  marketing_email_sent BOOLEAN DEFAULT false,
  marketing_email_sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.chatbot_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for chatbot_emails
CREATE POLICY "Anyone can insert chatbot emails" 
ON public.chatbot_emails 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all chatbot emails" 
ON public.chatbot_emails 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'super_admin')
));

CREATE POLICY "Edge functions can manage chatbot emails" 
ON public.chatbot_emails 
FOR ALL 
USING (true);

-- Create policies for quote_emails
CREATE POLICY "Anyone can insert quote emails" 
ON public.quote_emails 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all quote emails" 
ON public.quote_emails 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'super_admin')
));

CREATE POLICY "Edge functions can manage quote emails" 
ON public.quote_emails 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_chatbot_emails_marketing_pending ON public.chatbot_emails(created_at) WHERE marketing_email_sent = false;
CREATE INDEX idx_quote_emails_marketing_pending ON public.quote_emails(created_at) WHERE marketing_email_sent = false;