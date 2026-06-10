"use client";

const UTM_KEYS = [
  'utm_source', 
  'utm_medium', 
  'utm_campaign', 
  'utm_content', 
  'utm_term', 
  'src', 
  'sck', 
  'xcod', 
  'subid', 
  'subid2', 
  'subid3', 
  'subid4', 
  'subid5'
];

// Helper para ler cookies gerados pelo script do UTMify
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  }
  return null;
};

// Captura e salva todas as UTMs das 4 fontes com máxima prioridade e redundância
export const captureUtms = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  const utms: Record<string, string> = {};
  
  UTM_KEYS.forEach(key => {
    // Prioridade 1: Query Param na URL ativa
    let val = urlParams.get(key);
    
    // Prioridade 2: Cookie nativo persistido pelo UTMify
    if (!val) {
      val = getCookie(key);
    }
    
    // Prioridade 3: Session Storage da sessão atual
    if (!val) {
      val = sessionStorage.getItem(`utm_${key}`);
    }
    
    // Prioridade 4: Local Storage (Backup)
    if (!val) {
      val = localStorage.getItem(`utm_${key}`);
    }
    
    if (val) {
      const cleanVal = val.trim();
      utms[key] = cleanVal;
      sessionStorage.setItem(`utm_${key}`, cleanVal);
      localStorage.setItem(`utm_${key}`, cleanVal);
    }
  });

  return utms;
};

// Adiciona todas as UTMs identificadas à URL de checkout
export const addUtmsToUrl = (url: string): string => {
  if (!url) return url;
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
    // Fallback para URLs relativas
    const separator = url.includes('?') ? '&' : '?';
    const queryStr = Object.entries(utms)
      .filter(([_, val]) => !!val)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&');
    return queryStr ? `${url}${separator}${queryStr}` : url;
  }
};