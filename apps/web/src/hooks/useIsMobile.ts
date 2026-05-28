import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 480;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}