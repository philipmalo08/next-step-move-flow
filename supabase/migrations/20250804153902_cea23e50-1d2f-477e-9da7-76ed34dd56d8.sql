-- Enable leaked password protection for better security
ALTER DATABASE postgres SET "app.settings.auth_password_leaked_password_protection" = 'true';