type Options = {
  /**
   * Whether to capitalize only the first word.
   * @default false
   */
  onlyFirstWord?: boolean;
  /**
   * The delimiter to split the string into words.
   * @default ' '
   */
  splitter?: string;
  /**
   * The delimiter to join the capitalized words.
   * @default splitter
   */
  joiner?: string;
};

const capitalizeFirst = (str: string) =>
  str[0]!.toUpperCase().concat(str.slice(1).toLowerCase());

/**
 * Capitalizes the first letter of a string or each word in a string.
 *
 * @param {string} str - The string to capitalize.
 * @param {object} [options] - Optional parameters.
 * @param {boolean} [options.onlyFirstWord=false] - Whether to capitalize only the first word (default: false).
 * @param {string} [options.splitter=' '] - The delimiter to split the string into words (default: ' ').
 * @param {string} [options.joiner=options.splitter] - The delimiter to join the capitalized words (default: options.splitter).
 * @returns {string} The capitalized string.
 */
export function capitalize(str: string, options?: Options) {
  const {
    onlyFirstWord: onlyFirst = false,
    splitter = ' ',
    joiner = splitter,
  } = options || {};

  if (typeof str !== 'string' || str === '') return str;

  return (onlyFirst ? [str] : str.split(splitter))
    .map(capitalizeFirst)
    .join(joiner);
}
