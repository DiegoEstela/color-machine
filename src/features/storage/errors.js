export const OFFLINE_MESSAGE = 'Sin conexión. Revisá tu internet y volvé a intentar.'

const NETWORK_PATTERN = /failed to fetch|networkerror|network request failed|load failed|fetch failed|internet_disconnected/i

/** ¿El error vino de no poder llegar al servidor (y no de la base o de la sesión)? */
export function isNetworkError(error) {
  if (!error) return false
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  return error.name === 'AuthRetryableFetchError' || NETWORK_PATTERN.test(String(error.message ?? ''))
}

export const offlineError = () => ({ code: 'offline', message: OFFLINE_MESSAGE })
