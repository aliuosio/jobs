/**
 * Timeout signal helper with fallback for older browsers
 * Provides AbortSignal.timeout() with graceful degradation
 */

/**
 * Create an AbortSignal with timeout fallback for older browsers
 * @param {number} ms - Timeout in milliseconds
 * @returns {AbortSignal}
 */
export function timeoutSignal(ms) {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  // Fallback for older browsers (Firefox < 115, Safari < 15.4)
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}