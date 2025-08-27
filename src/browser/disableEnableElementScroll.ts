import { getScrollbarWidth } from "./getScrollbarWidth";

type Options = Partial<{
  element: HTMLElement,
  scrollbarElement?: HTMLElement | Document
}>

const disableAttribute = 'data-mustib-scroll-disabled'
const marginRightVar = `--${disableAttribute}-margin-right-end`;
const scrollbarWidthVar = `--${disableAttribute}-scrollbar-width`;

const style = document.createElement('style')

style.dataset.id = (`${disableAttribute}-style`)

style.innerHTML = `
  [${disableAttribute}] {
    overflow: hidden !important;
    overscroll-behavior: contain !important;
    margin-right: calc(var(${marginRightVar}) + var(${scrollbarWidthVar})) !important;
  }
`

export function disableElementScroll(options?: Options) {
  const { element = document.body, scrollbarElement = document } = options ?? {}

  if (!style.isConnected) document.head.appendChild(style)
  if (element.hasAttribute(disableAttribute)) return;

  const baseMarginRight = getComputedStyle(element).marginRight;
  const baseMarginRightWithoutPixels = +baseMarginRight.slice(0, -2);
  const scrollbarWidth = getScrollbarWidth({ element: scrollbarElement });

  element.setAttribute(disableAttribute, '');
  element.style.setProperty(marginRightVar, `${baseMarginRightWithoutPixels}px`);
  element.style.setProperty(scrollbarWidthVar, `${scrollbarWidth}px`);
}

export function enableElementScroll(options?: Pick<Options, 'element'>) {
  const element = options?.element ?? document.body

  if (!element.hasAttribute(disableAttribute)) return;

  element.removeAttribute(disableAttribute);
  element.style.removeProperty(marginRightVar);
  element.style.removeProperty(scrollbarWidthVar);
}
