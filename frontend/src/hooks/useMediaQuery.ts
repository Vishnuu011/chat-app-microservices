import { useState, useEffect } from 'react';

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 * Used to drive responsive layout decisions in inline-styled components.
 */
export const useMediaQuery = (query: string): boolean => {
  const getMatch = () =>
    typeof window !== 'undefined' && 'matchMedia' in window
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState<boolean>(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', handler);
    else mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler);
      else mql.removeListener(handler);
    };
  }, [query]);

  return matches;
};

/** True for phone-sized viewports (<= 768px). */
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');

/** True for small phones (<= 380px), used for tightening spacing further. */
export const useIsSmallPhone = () => useMediaQuery('(max-width: 380px)');
