import { useEffect } from 'react';
import { getSecurityHeaders } from '@/lib/security';

export const useSecurityHeaders = () => {
  useEffect(() => {
    // Set security headers via meta tags (for development/client-side)
    const headers = getSecurityHeaders();
    
    // Add Content Security Policy meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = headers['Content-Security-Policy'];
    document.head.appendChild(cspMeta);

    // Add other security meta tags
    const metaTags = [
      { httpEquiv: 'X-Content-Type-Options', content: headers['X-Content-Type-Options'] },
      { httpEquiv: 'X-Frame-Options', content: headers['X-Frame-Options'] },
      { httpEquiv: 'X-XSS-Protection', content: headers['X-XSS-Protection'] },
      { name: 'referrer', content: 'strict-origin-when-cross-origin' }
    ];

    const addedMetas: HTMLMetaElement[] = [];

    metaTags.forEach(({ httpEquiv, name, content }) => {
      const meta = document.createElement('meta');
      if (httpEquiv) meta.httpEquiv = httpEquiv;
      if (name) meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
      addedMetas.push(meta);
    });

    // Cleanup function
    return () => {
      document.head.removeChild(cspMeta);
      addedMetas.forEach(meta => {
        try {
          document.head.removeChild(meta);
        } catch (e) {
          // Meta tag already removed
        }
      });
    };
  }, []);
};