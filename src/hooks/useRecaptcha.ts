import { useCallback } from 'react';

const RECAPTCHA_SITE_KEY = '6Lek9oErAAAAADbpSLJ0uMlVRCrHLDqwQb_Ze8bB';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export const useRecaptcha = () => {
  const executeRecaptcha = useCallback(async (action: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (typeof window.grecaptcha === 'undefined') {
        reject(new Error('reCAPTCHA not loaded'));
        return;
      }

      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
          resolve(token);
        } catch (error) {
          reject(error);
        }
      });
    });
  }, []);

  return { executeRecaptcha };
};