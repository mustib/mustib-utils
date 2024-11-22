export function getElementBoundaries(element: HTMLElement) {
  const {
    top: elementTop,
    bottom,
    left: elementLeft,
    right,
    width,
    height,
  } = element.getBoundingClientRect();

  const pageWidth = document.documentElement.clientWidth;
  const pageHeight = document.documentElement.clientHeight;

  const elementRight = pageWidth - right;
  const elementBottom = pageHeight - bottom;

  const isTopInPage = elementTop >= 0 && elementTop <= pageHeight;
  const isBottomInPage = elementBottom >= 0 && elementBottom <= pageHeight;
  const isLeftInPage = elementLeft >= 0 && elementLeft <= pageWidth;
  const isRightInPage = elementRight >= 0 && elementRight <= pageWidth;

  const isTopVisible = isTopInPage && (isLeftInPage || isRightInPage);
  const isTopFullyVisible = isTopInPage && isLeftInPage && isRightInPage;

  const isBottomVisible = isBottomInPage && (isLeftInPage || isRightInPage);
  const isBottomFullyVisible = isBottomInPage && isLeftInPage && isRightInPage;

  const isLeftVisible = isLeftInPage && (isTopInPage || isBottomInPage);
  const isLeftFullyVisible = isLeftInPage && isTopInPage && isBottomInPage;

  const isRightVisible = isRightInPage && (isTopInPage || isBottomInPage);
  const isRightFullyVisible = isRightInPage && isTopInPage && isBottomInPage;

  const isFullyVisible =
    isTopFullyVisible &&
    isBottomFullyVisible &&
    isLeftFullyVisible &&
    isRightFullyVisible;

  return {
    elementTop,
    elementBottom,
    elementLeft,
    elementRight,
    width,
    height,
    isTopVisible,
    isTopFullyVisible,
    isBottomVisible,
    isBottomFullyVisible,
    isLeftVisible,
    isLeftFullyVisible,
    isRightVisible,
    isRightFullyVisible,
    isFullyVisible,
  };
}
