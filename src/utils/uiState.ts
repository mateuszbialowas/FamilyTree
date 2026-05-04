import { useEffect, useState } from 'react';

/**
 * App-level UI state that needs to be observable by deeply-nested
 * components. Currently just tracks splash-screen visibility so the
 * tab bar's FAB can stay hidden until the splash dismisses (the FAB
 * has a high zIndex that punches through the splash overlay on iOS).
 */
let splashVisible = true;
const splashListeners = new Set<() => void>();

export function setSplashVisible(visible: boolean): void {
  if (splashVisible === visible) return;
  splashVisible = visible;
  splashListeners.forEach((l) => l());
}

export function useSplashVisible(): boolean {
  const [visible, setVisible] = useState(splashVisible);
  useEffect(() => {
    const listener = () => setVisible(splashVisible);
    splashListeners.add(listener);
    return () => {
      splashListeners.delete(listener);
    };
  }, []);
  return visible;
}
