/**
 * Session management for anonymous users
 */

// Generate a secure session ID for anonymous users
export const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `session_${timestamp}_${randomPart}`;
};

// Get or create session ID for anonymous users
export const getSessionId = (): string => {
  const existing = localStorage.getItem('user_session_id');
  if (existing) {
    return existing;
  }
  
  const newSessionId = generateSessionId();
  localStorage.setItem('user_session_id', newSessionId);
  return newSessionId;
};

// Clear session ID
export const clearSessionId = (): void => {
  localStorage.removeItem('user_session_id');
};

// Get user identifier (auth user ID or session ID)
export const getUserIdentifier = async (): Promise<string> => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    return user.id;
  }
  
  return getSessionId();
};