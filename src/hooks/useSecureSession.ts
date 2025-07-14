import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateSecureToken, generateDeviceId, validateDeviceId, isSessionExpired, logSecurityEvent } from '@/lib/security';

interface SessionData {
  id: string;
  device_id: string;
  session_data: any;
  created_at: string;
  expires_at: string;
}

export const useSecureSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSecureSession = async () => {
      try {
        setIsInitializing(true);
        setSessionError(null);

        // Get or generate device ID
        let deviceId = localStorage.getItem('secure_device_id');
        if (!deviceId || !validateDeviceId(deviceId)) {
          deviceId = generateDeviceId();
          localStorage.setItem('secure_device_id', deviceId);
          logSecurityEvent('new_device_id_generated', { deviceId: deviceId.substring(0, 8) + '...' });
        }

        // Generate session token
        const sessionToken = generateSecureToken();
        
        // Check for existing session
        const { data: existingSessions, error: fetchError } = await supabase
          .from('device_sessions')
          .select('*')
          .eq('device_id', deviceId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) {
          throw new Error(`Failed to fetch existing session: ${fetchError.message}`);
        }

        // Validate existing session
        let shouldCreateNew = true;
        if (existingSessions && existingSessions.length > 0) {
          const session = existingSessions[0];
          
          // Check if session is expired
          if (!isSessionExpired(session.created_at)) {
            // Update last activity
            const currentSessionData = typeof session.session_data === 'object' && session.session_data !== null 
              ? session.session_data as Record<string, any>
              : {};
            
            const { error: updateError } = await supabase
              .from('device_sessions')
              .update({
                session_data: {
                  ...currentSessionData,
                  last_activity: new Date().toISOString()
                }
              })
              .eq('id', session.id);

            if (!updateError) {
              setSessionId(session.id);
              shouldCreateNew = false;
              logSecurityEvent('session_reused', { sessionId: session.id });
            }
          } else {
            logSecurityEvent('session_expired', { sessionId: session.id });
          }
        }

        // Create new session if needed
        if (shouldCreateNew) {
          const { data, error } = await supabase
            .from('device_sessions')
            .upsert({
              device_id: deviceId,
              session_data: {
                created_at: new Date().toISOString(),
                user_agent: navigator.userAgent,
                session_token: sessionToken,
                last_activity: new Date().toISOString()
              }
            }, { 
              onConflict: 'device_id' 
            })
            .select()
            .single();

          if (error) {
            throw new Error(`Failed to create session: ${error.message}`);
          } else {
            setSessionId(data.id);
            logSecurityEvent('new_session_created', { 
              sessionId: data.id,
              deviceId: deviceId.substring(0, 8) + '...' 
            });
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSessionError(errorMessage);
        logSecurityEvent('session_initialization_failed', { error: errorMessage });
        console.error('Error initializing secure session:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSecureSession();
  }, []);

  // Update session activity
  const updateActivity = async () => {
    if (!sessionId) return;

    try {
      const deviceId = localStorage.getItem('secure_device_id');
      if (!deviceId) return;

      await supabase
        .from('device_sessions')
        .update({
          session_data: {
            last_activity: new Date().toISOString()
          }
        })
        .eq('id', sessionId);
        
    } catch (error) {
      logSecurityEvent('activity_update_failed', { sessionId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Cleanup session
  const clearSession = () => {
    localStorage.removeItem('secure_device_id');
    setSessionId(null);
    logSecurityEvent('session_cleared', { sessionId });
  };

  return {
    sessionId,
    isInitializing,
    sessionError,
    updateActivity,
    clearSession
  };
};