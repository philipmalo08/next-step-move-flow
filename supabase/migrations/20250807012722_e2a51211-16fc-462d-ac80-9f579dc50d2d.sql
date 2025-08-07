-- Temporarily modify timestamp for testing marketing emails
UPDATE chatbot_emails 
SET created_at = NOW() - INTERVAL '25 hours'
WHERE email = 'philipmalogrosz@gmail.com' 
AND marketing_email_sent = false
LIMIT 1;

UPDATE quote_emails 
SET created_at = NOW() - INTERVAL '25 hours'
WHERE email = 'philipmalogrosz@gmail.com' 
AND marketing_email_sent = false
LIMIT 1;