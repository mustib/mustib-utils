import { AppError } from "../common";
import { LIBRARY_ERROR_SCOPE } from "../constants";

const getScrollbarWidthErrorScope = [Symbol('@mustib/utils/getScrollbarWidth'), LIBRARY_ERROR_SCOPE]

/**
 * Returns the width of the scrollbar for a given HTML element or the document.
 * Handles both horizontal ('x') and vertical ('y') scrollbars, and accounts for element borders.
 *
 * - For the document, calculates the scrollbar width using window and document dimensions.
 * - For an HTMLElement, computes the difference between offset and client dimensions,
 *   subtracting border widths to isolate the scrollbar size.
 *
 * @param options - Configuration object.
 * @param options.element - The target element or document. Defaults to `document`.
 * @param options.direction - Scrollbar direction: `'x'` for horizontal, `'y'` for vertical. Defaults to `'y'`.
 * @returns The scrollbar width in pixels. Returns `0` if no scrollbar is present or calculation is not possible.
 *
 * @throws AppError<'Invalid'> If `element` is provided and is not an HTMLElement or Document.
 */
export function getScrollbarWidth(options?: Partial<{ element: Element | Document | null, direction: 'x' | 'y' }>): number {
  const { element = document, direction = 'y' } = options ?? {}

  if (!element || element === document)
    return direction === 'x' ? window.innerHeight - document.documentElement.clientHeight : window.innerWidth - document.documentElement.clientWidth;

  if (!(element instanceof HTMLElement)) {
    return AppError.throw<'Invalid'>('Invalid', "Invalid argument: 'element' must be an HTMLElement.", {
      pushOptions: {
        scope: getScrollbarWidthErrorScope
      }
    })
  }

  // Get the computed styles of the element to determine border widths.
  const computedStyle = window.getComputedStyle(element);

  // Parse float values for border widths, defaulting to 0 if not a number.
  const borderStartWidth = parseFloat(direction === 'x' ? computedStyle.borderTopWidth : computedStyle.borderLeftWidth) ?? 0;
  const borderEndWidth = parseFloat(direction === 'x' ? computedStyle.borderBottomWidth : computedStyle.borderRightWidth) ?? 0;

  // Calculate the total horizontal border width.
  const totalBorderWidth = borderStartWidth + borderEndWidth;

  // Calculate the raw difference between offsetWidth (includes borders and scrollbar)
  // and clientWidth (includes content and padding, but not borders or scrollbar).
  const rawDiff = direction === 'x' ? element.offsetHeight - element.clientHeight : element.offsetWidth - element.clientWidth;

  // The scrollbar width is this raw difference minus the total border width.
  // We use Math.max to ensure the result is not negative, as overlay scrollbars
  // might result in a 0 or negative difference with their layout behavior.
  const scrollbarWidth = Math.max(0, rawDiff - totalBorderWidth);

  return scrollbarWidth;
}
