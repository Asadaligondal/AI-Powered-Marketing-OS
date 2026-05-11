import { flushSync } from 'react-dom';

export function startThemeCircleTransition(
  setTheme: (theme: string) => void,
  next: string,
  clientX: number,
  clientY: number,
) {
  document.documentElement.style.setProperty('--vt-x', `${clientX}px`);
  document.documentElement.style.setProperty('--vt-y', `${clientY}px`);

  const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
  if (typeof doc.startViewTransition !== 'function') {
    setTheme(next);
    return;
  }

  doc.startViewTransition(() => {
    flushSync(() => setTheme(next));
  });
}
