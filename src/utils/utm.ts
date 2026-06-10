"use client";

// Captura e salva todas as UTMs do UTMify na sessão para evitar que se percam nas rotas do React
export const captureUtms = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'xcod'];
  const utms: Record<string, string> = {};
  let hasUtms = false;

  utmKeys.forEach(key => {
    const val = urlParams.get(key);
    if (val) {
      utms[key] = val;
      sessionStorage.setItem(`utm_${key}`, val);
      hasUtms = true;
    }
  });

  // Se não encontrou na URL, tenta recuperar as UTMs anteriormente salvas na sessão
  if (!hasUtms) {
    utmKeys.forEach(key => {
      const val = sessionStorage.getItem(`utm_${key}`);
      if (val) {
        utms[key] = val;
      }
    });
  }

  return utms;
};

// Adiciona as UTMs salvas a qualquer link de checkout externo
export const addUtmsToUrl = (url: string): string => {
  if (typeof window === 'undefined') return url;
  const utms = captureUtms();
  
  try {
    const urlObj = new URL(url);
    Object.entries(utms).forEach(([key, val]) => {
      if (val) {
        urlObj.searchParams.set(key, val);
      }
    });
    return urlObj.toString();
  } catch (e) {
    // Caso seja um link relativo
    const separator = url.includes('?') ? '&' : '?';
    const queryStr = Object.entries(utms)
      .filter(([_, val]) => !!val)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&');
    return queryStr ? `${url}${separator}${queryStr}` : url;
  }
};