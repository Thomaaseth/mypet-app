import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Tracks an element's rendered height via ResizeObserver, so layout code can
 * react to real content size (e.g. text wrapping differently per language)
 * instead of a hardcoded guess.
 */
export function useElementHeight<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setHeight(entry.contentRect.height);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, height];
}