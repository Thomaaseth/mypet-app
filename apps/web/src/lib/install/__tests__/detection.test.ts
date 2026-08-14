import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  detectIOS,
  detectStandalone,
  isSnoozed,
  INSTALL_SNOOZE_MS,
} from '@/lib/install/detection';

// --- helpers to drive the browser globals the detectors read ---

function setNavigatorProp(prop: string, value: unknown): void {
  Object.defineProperty(navigator, prop, { value, configurable: true });
}

function setDisplayModeStandalone(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}


const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IPAD_UA =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const MAC_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';

afterEach(() => {
  // Reset globals so property overrides don't leak between tests.
  setNavigatorProp('userAgent', MAC_UA);
  setNavigatorProp('maxTouchPoints', 0);
  setNavigatorProp('standalone', undefined);
  vi.unstubAllGlobals();
});

describe('detectIOS', () => {
  it('is true for iPhone', () => {
    setNavigatorProp('userAgent', IPHONE_UA);
    expect(detectIOS()).toBe(true);
  });

  it('is true for iPad (native iPad UA)', () => {
    setNavigatorProp('userAgent', IPAD_UA);
    expect(detectIOS()).toBe(true);
  });

  it('is true for iPadOS masquerading as Mac with touch points', () => {
    setNavigatorProp('userAgent', MAC_UA);
    setNavigatorProp('maxTouchPoints', 5);
    expect(detectIOS()).toBe(true);
  });

  it('is false for a real desktop Mac (no touch points)', () => {
    setNavigatorProp('userAgent', MAC_UA);
    setNavigatorProp('maxTouchPoints', 0);
    expect(detectIOS()).toBe(false);
  });

  it('is false for Android', () => {
    setNavigatorProp('userAgent', ANDROID_UA);
    expect(detectIOS()).toBe(false);
  });
});

describe('detectStandalone', () => {
  it('is true when display-mode: standalone matches', () => {
    setDisplayModeStandalone(true);
    setNavigatorProp('standalone', undefined);
    expect(detectStandalone()).toBe(true);
  });

  it('is true when iOS navigator.standalone is true', () => {
    setDisplayModeStandalone(false);
    setNavigatorProp('standalone', true);
    expect(detectStandalone()).toBe(true);
  });

  it('is false in a normal browser tab', () => {
    setDisplayModeStandalone(false);
    setNavigatorProp('standalone', undefined);
    expect(detectStandalone()).toBe(false);
  });
});

describe('isSnoozed', () => {
  const NOW = 1_700_000_000_000;

  it('is false when never dismissed (null)', () => {
    expect(isSnoozed(null, NOW)).toBe(false);
  });

  it('is true immediately after dismissal', () => {
    expect(isSnoozed(NOW, NOW)).toBe(true);
  });

  it('is true just before the snooze window closes', () => {
    const dismissedAt = NOW - (INSTALL_SNOOZE_MS - 1);
    expect(isSnoozed(dismissedAt, NOW)).toBe(true);
  });

  it('is false exactly at the snooze boundary', () => {
    const dismissedAt = NOW - INSTALL_SNOOZE_MS;
    expect(isSnoozed(dismissedAt, NOW)).toBe(false);
  });

  it('is false well past the snooze window', () => {
    const dismissedAt = NOW - INSTALL_SNOOZE_MS * 2;
    expect(isSnoozed(dismissedAt, NOW)).toBe(false);
  });
});