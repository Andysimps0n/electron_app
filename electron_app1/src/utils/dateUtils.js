const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
]

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function startOfWeek(date) {
  const result = new Date(date)
  result.setDate(result.getDate() - result.getDay())
  result.setHours(0, 0, 0, 0)
  return result
}

export function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addMonths(date, months) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const start = startOfWeek(firstDay)
  const cells = []

  for (let i = 0; i < 42; i++) {
    cells.push(addDays(start, i))
  }

  return cells
}

export function getWeekDates(date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function formatMonthYear(date) {
  return `${date.getFullYear()}년 ${MONTH_NAMES[date.getMonth()]}`
}

export function formatMonthYearShort(date) {
  return `${date.getFullYear()}년 ${MONTH_NAMES[date.getMonth()]}`
}

export function formatHour(hour) {
  const period = hour >= 12 ? '오후' : '오전'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${period} ${String(display).padStart(2, '0')}시`
}

export function getWeekNumber(date) {
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  target.setDate(target.getDate() + 4 - (target.getDay() || 7))
  const yearStart = new Date(target.getFullYear(), 0, 1)
  return Math.ceil(((target - yearStart) / 86_400_000 + 1) / 7)
}

export { DAY_LABELS, MONTH_NAMES }
