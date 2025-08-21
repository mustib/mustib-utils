/**
 * Finds the closest ancestor element (including the starting element) that matches the given selector,
 * traversing through shadow DOM boundaries if necessary.
 *
 * This function behaves like `Element.closest`, but will continue searching across shadow roots
 * by moving up to the host element of each shadow root encountered.
 *
 * @param selector - A string containing a selector to match against.
 * @param startEl - The element from which to start searching.
 * @returns The closest matching ancestor element, or `null` if none is found.
 */
export function closestPierce(
  selector: string,
  startEl: HTMLElement | null
): HTMLElement | null {
  let el: Element | null = startEl;

  while (el && el instanceof HTMLElement) {
    const found = el.closest<HTMLElement>(selector);
    if (found) return found;

    const root = el.getRootNode();
    // only continue if in shadow dom, otherwise we're done
    el = root instanceof ShadowRoot ? root.host : null;
  }

  return null;
}