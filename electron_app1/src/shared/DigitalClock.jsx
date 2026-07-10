import { useEffect, useState } from 'react'
import { formatClockDate, formatDigitalClock } from './timeUtils'
import './digitalClock.css'

export default function DigitalClock({ className = '' }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(tick)
    }
  }, [])

  const clock = formatDigitalClock(now)
  const dateLabel = formatClockDate(now)
  const classNames = className ? `digital-clock ${className}` : 'digital-clock'

  return (
    <div className={classNames}>
      <time
        className="digital-clock-time"
        dateTime={now.toISOString()}
        aria-label={`현재 시각 ${clock.hours}:${clock.minutes} ${clock.period}, ${dateLabel}`}
      >
        <span className="digital-clock-digit">{clock.hours}</span>
        <span className="digital-clock-separator" aria-hidden="true">
          :
        </span>
        <span className="digital-clock-digit">{clock.minutes}</span>
        <span className="digital-clock-period">{clock.period}</span>
      </time>
      <span className="digital-clock-date">{dateLabel}</span>
    </div>
  )
}
