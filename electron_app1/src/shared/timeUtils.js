export function formatDigitalClock(date) {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? '오후' : '오전'
  const displayHour = hours % 12 === 0 ? 12 : hours % 12

  return {
    hours: String(displayHour).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    period,
  }
}

export function formatClockDate(date, locale = 'ko-KR') {
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
