export const calculateTimeLeft = (session, originalDuration, currentTime = Date.now()) => {
  if (!session) {
    return originalDuration || 0
  }

  if (session.is_running && session.updated_at) {
    const now = new Date(currentTime)
    const lastUpdate = new Date(session.updated_at)
    const elapsedSinceUpdate = Math.floor((now - lastUpdate) / 1000)
    return session.time_left - elapsedSinceUpdate
  }

  return session.time_left !== undefined ? session.time_left : (originalDuration || 0)
}

export const formatTime = (seconds) => {
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return '00:00'
  }
  const isNegative = seconds < 0
  const absSeconds = Math.abs(seconds)
  const mins = Math.floor(absSeconds / 60)
  const secs = absSeconds % 60
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  return isNegative ? `-${timeString}` : timeString
}

export const getProgressPercentage = (session, originalDuration, currentTime = Date.now()) => {
  if (!session || !originalDuration) return 0

  const currentTimeLeft = calculateTimeLeft(session, originalDuration, currentTime)
  return Math.min(100, Math.max(0, ((originalDuration - currentTimeLeft) / originalDuration) * 100))
}
