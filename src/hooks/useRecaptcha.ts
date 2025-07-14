import { useCallback, useEffect } from 'react';
import { SECURITY_CONFIG, logSecurityEvent } from '@/lib/security';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export const useRecaptcha = () => {
  // Execute reCAPTCHA on page load for general protection
  useEffect(() => {
    const executePageLoad = async () => {
      if (typeof window.grecaptcha !== 'undefined') {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(SECURITY_CONFIG.RECAPTCHA_SITE_KEY, { action: 'page_load' });
            console.log('Page load reCAPTCHA token:', token);
          } catch (error) {
            console.error('reCAPTCHA page load error:', error);
            logSecurityEvent('recaptcha_page_load_failed', { error: error instanceof Error ? error.message : 'Unknown error' });
          }
        });
      }
    };

    executePageLoad();
  }, []);

  const executeRecaptcha = useCallback(async (action: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (typeof window.grecaptcha === 'undefined') {
        reject(new Error('reCAPTCHA not loaded'));
        return;
      }

      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(SECURITY_CONFIG.RECAPTCHA_SITE_KEY, { action });
          resolve(token);
        } catch (error) {
          logSecurityEvent('recaptcha_execution_failed', { action, error: error instanceof Error ? error.message : 'Unknown error' });
          reject(error);
        }
      });
    });
  }, []);

  return { executeRecaptcha };
};