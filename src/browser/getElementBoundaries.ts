export function getElementBoundaries(element: HTMLElement) {
  const { innerHeight, innerWidth } = window;

  const {
    top: elementTop,
    bottom,
    left: elementLeft,
    right,
    width,
    height,
  } = element.getBoundingClientRect();

  const elementRight = innerWidth - right;
  const elementBottom = innerHeight - bottom;

  const isTopInPage = elementTop >= 0 && elementTop <= innerHeight;
  const isBottomInPage = elementBottom >= 0 && elementBottom <= innerHeight;
  const isLeftInPage = elementLeft >= 0 && elementLeft <= innerWidth;
  const isRightInPage = elementRight >= 0 && elementRight <= innerWidth;

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
