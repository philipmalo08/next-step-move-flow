import { useCallback, useEffect } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = '6LcxIIIrAAAAAH2F07tO0GpMncJPgV1tDgNHwCaj';

export const useRecaptcha = () => {
  // Execute reCAPTCHA on page load for general protection
  useEffect(() => {
    const executePageLoad = async () => {
      if (typeof window.grecaptcha !== 'undefined') {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'page_load' });
            console.log('Page load reCAPTCHA token:', token);
          } catch (error) {
            console.error('reCAPTCHA page load error:', error);
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