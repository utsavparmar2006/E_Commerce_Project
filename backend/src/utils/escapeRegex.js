/**
 * Escapes special regex characters in a string to prevent Regular Expression Injection.
 * @param {string} string - The raw string to be escaped.
 * @returns {string} The safely escaped string.
 */
export const escapeRegex = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

export default escapeRegex;
