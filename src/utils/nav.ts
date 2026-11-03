// Central SPA navigation: updates the URL, notifies App's route listener
// (which reads location.pathname on popstate), and scrolls to top.
export function navigateTo(path: string): void {
  try {
    window.history.pushState({}, '', path);
  } catch {
    return;
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
