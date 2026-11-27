// Central SPA navigation: updates the URL, notifies App's route listener
// (which reads location.pathname on popstate), and scrolls to top.
export function navigateTo(path: string): void {
  try {
    window.history.pushState({}, '', path);
  } catch {
    return;
  }
  // Scroll instantly before React re-renders so there's no visible stutter.
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  // Dispatch popstate after scroll so React's route update doesn't clobber it.
  window.dispatchEvent(new PopStateEvent('popstate'));
  // Second shot after React commits its DOM update (catches scroll-restore).
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}
