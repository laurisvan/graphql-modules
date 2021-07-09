export const ERROR_TYPE = 'diType';
export const ERROR_ORIGINAL_ERROR = 'diOriginalError';
export const ERROR_LOGGER = 'diErrorLogger';
export function getType(error) {
  return error[ERROR_TYPE];
}
export function getOriginalError(error) {
  return error[ERROR_ORIGINAL_ERROR];
}
function defaultErrorLogger(console, ...values) {
  // eslint-disable-next-line no-console
  console.error(...values);
}
export function getErrorLogger(error) {
  return error[ERROR_LOGGER] || defaultErrorLogger;
}
export function wrappedError(message, originalError) {
  const msg = `${message} caused by: ${
    originalError instanceof Error ? originalError.message : originalError
  }`;
  const error = Error(msg);
  error[ERROR_ORIGINAL_ERROR] = originalError;
  return error;
}
export function stringify(token) {
  if (typeof token === 'string') {
    return token;
  }
  if (token == null) {
    return '' + token;
  }
  if (token.name) {
    return `${token.name}`;
  }
  const res = token.toString();
  const newLineIndex = res.indexOf('\n');
  return newLineIndex === -1 ? res : res.substring(0, newLineIndex);
}
//# sourceMappingURL=utils.js.map
