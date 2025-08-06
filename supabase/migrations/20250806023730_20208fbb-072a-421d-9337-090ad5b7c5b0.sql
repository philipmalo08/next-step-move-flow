-- Create storage bucket for assets (logos, images, PDFs)
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);

-- Create policies for public asset access
CREATE POLICY "Assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assets');

CREATE POLICY "Authenticated users can upload assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'assets' AND auth.role() = 'authenticated');