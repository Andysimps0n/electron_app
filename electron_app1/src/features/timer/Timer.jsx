import { useCallback, useEffect, useRef, useState } from 'react'
import { PanelIcon } from '../../shared/icons'
import TimerSidebar from './TimerSidebar'
import '../../shared/sidebar.css'
import './timer.css'

const POMODORO_PRESETS = [
  { id: '25-5', label: '25 / 5', focusSeconds: 25 * 60, breakSeconds: 5 * 60 },
  { id: '45-5', label: '45 / 5', focusSeconds: 45 * 60, breakSeconds: 5 * 60 },
  { id: '50-10', label: '50 / 10', focusSeconds: 50 * 60, breakSeconds: 10 * 60 },
]

const DEFAULT_PRESET = POMODORO_PRESETS[0]
const CLOCK_LOCALE = 'en-US'

function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatClockTime(date) {
  return date.toLocaleTimeString(CLOCK_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

function formatClockDate(date) {
  return date.toLocaleDateString(CLOCK_LOCALE, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function FocusDisplay({
  phase,
  secondsRemaining,
  totalSeconds,
  completedSessions,
  statusMessage,
  isRunning,
  onStart,
  onPause,
  onReset,
  onSkipPhase,
}) {
  const progress =
    totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0
  const phaseLabel = phase === 'focus' ? 'Focus' : 'Break'
  const nextSessionNumber = phase === 'focus' ? completedSessions + 1 : completedSessions

  return (
    <div className={`focus-display focus-display--${phase}`}>
      <div className="focus-display-header">
        <span className="focus-display-phase">{phaseLabel}</span>
        <span className="focus-display-session">
          {phase === 'focus' ? `Session ${nextSessionNumber}` : `After session ${completedSessions}`}
        </span>
      </div>

      <div className="focus-display-ring">
        <svg className="focus-display-progress" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="focus-display-track" cx="60" cy="60" r="54" />
          <circle
            className="focus-display-fill"
            cx="60"
            cy="60"
            r="54"
            style={{
              strokeDasharray: `${2 * Math.PI * 54}`,
              strokeDashoffset: `${2 * Math.PI * 54 * (1 - progress / 100)}`,
            }}
          />
        </svg>
        <div className="focus-display-time">{formatCountdown(secondsRemaining)}</div>
      </div>

      {statusMessage && (
        <p className="focus-display-status">{statusMessage}</p>
      )}

      <p className="focus-display-hint">
        {phase === 'focus'
          ? 'One block at a time. Pause if you need to step away.'
          : 'Rest your eyes and stretch before the next block.'}
      </p>

      <div className="focus-display-controls">
        {!isRunning ? (
          <button
            type="button"
            className="focus-display-btn focus-display-btn-primary"
            onClick={onStart}
            disabled={secondsRemaining === 0}
          >
            {phase === 'focus' ? 'Start focus' : 'Start break'}
          </button>
        ) : (
          <button
            type="button"
            className="focus-display-btn focus-display-btn-primary"
            onClick={onPause}
          >
            Pause
          </button>
        )}
        <button type="button" className="focus-display-btn" onClick={onReset}>
          Reset block
        </button>
        <button type="button" className="focus-display-btn focus-display-btn-ghost" onClick={onSkipPhase}>
          {phase === 'focus' ? 'Skip to break' : 'Skip to focus'}
        </button>
      </div>
    </div>
  )
}

function AnalogClockFace({ date }) {
  const hours = date.getHours() % 12
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  const secondAngle = seconds * 6
  const minuteAngle = minutes * 6 + seconds * 0.1
  const hourAngle = hours * 30 + minutes * 0.5

  const ticks = Array.from({ length: 12 }, (_, index) => {
    const angle = index * 30 - 90
    const radians = (angle * Math.PI) / 180
    const outerX = 60 + Math.cos(radians) * 52
    const outerY = 60 + Math.sin(radians) * 52
    const innerX = 60 + Math.cos(radians) * 46
    const innerY = 60 + Math.sin(radians) * 46

    return (
      <line
        key={index}
        x1={innerX}
        y1={innerY}
        x2={outerX}
        y2={outerY}
        className="desk-clock-tick"
      />
    )
  })

  return (
    <div className="desk-clock-analog">
      <svg className="desk-clock-face" viewBox="0 0 120 120" aria-hidden="true">
        <circle className="desk-clock-dial" cx="60" cy="60" r="54" />
        {ticks}
        <line
          className="desk-clock-hand desk-clock-hand-hour"
          x1="60"
          y1="60"
          x2="60"
          y2="34"
          transform={`rotate(${hourAngle} 60 60)`}
        />
        <line
          className="desk-clock-hand desk-clock-hand-minute"
          x1="60"
          y1="60"
          x2="60"
          y2="24"
          transform={`rotate(${minuteAngle} 60 60)`}
        />
        <line
          className="desk-clock-hand desk-clock-hand-second"
          x1="60"
          y1="66"
          x2="60"
          y2="20"
          transform={`rotate(${secondAngle} 60 60)`}
        />
        <circle className="desk-clock-center" cx="60" cy="60" r="3" />
      </svg>
      <p className="desk-clock-date">{formatClockDate(date)}</p>
    </div>
  )
}

function DigitalClockDisplay({ date }) {
  return (
    <div className="desk-clock-digital">
      <time className="desk-clock-time" dateTime={date.toISOString()}>
        {formatClockTime(date)}
      </time>
      <p className="desk-clock-date">{formatClockDate(date)}</p>
    </div>
  )
}

function DeskClock({ displayMode, now }) {
  return (
    <div className="desk-clock">
      {displayMode === 'analog' ? (
        <AnalogClockFace date={now} />
      ) : (
        <DigitalClockDisplay date={now} />
      )}
    </div>
  )
}

export default function Timer({ defaultSidebarOpen = true }) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen)
  const [activeMode, setActiveMode] = useState('focus')
  const [activePresetId, setActivePresetId] = useState(DEFAULT_PRESET.id)
  const [phase, setPhase] = useState('focus')
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_PRESET.focusSeconds)
  const [secondsRemaining, setSecondsRemaining] = useState(DEFAULT_PRESET.focusSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [clockDisplayMode, setClockDisplayMode] = useState('digital')
  const [now, setNow] = useState(() => new Date())

  const intervalRef = useRef(null)
  const onPhaseCompleteRef = useRef(() => {})

  const activePreset =
    POMODORO_PRESETS.find((preset) => preset.id === activePresetId) ?? DEFAULT_PRESET

  const resetFocusBlock = useCallback(
    (nextPhase, preset = activePreset) => {
      const duration =
        nextPhase === 'focus' ? preset.focusSeconds : preset.breakSeconds

      setPhase(nextPhase)
      setTotalSeconds(duration)
      setSecondsRemaining(duration)
      setStatusMessage('')
    },
    [activePreset],
  )

  const handlePhaseComplete = useCallback(() => {
    if (phase === 'focus') {
      setCompletedSessions((count) => count + 1)
      resetFocusBlock('break', activePreset)
      setStatusMessage('Focus block complete — enjoy your break.')
      setIsRunning(true)
      return
    }

    resetFocusBlock('focus', activePreset)
    setStatusMessage('Break finished — start when you\'re ready.')
  }, [phase, activePreset, resetFocusBlock])

  onPhaseCompleteRef.current = handlePhaseComplete

  useEffect(() => {
    if (activeMode !== 'focus' || !isRunning) {
      return undefined
    }

    intervalRef.current = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(intervalRef.current)
          setIsRunning(false)
          onPhaseCompleteRef.current()
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(intervalRef.current)
    }
  }, [activeMode, isRunning])

  useEffect(() => {
    if (activeMode !== 'clock') {
      return undefined
    }

    const tick = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(tick)
    }
  }, [activeMode])

  function handleSelectFocus(preset) {
    setActiveMode('focus')
    setActivePresetId(preset.id)
    setIsRunning(false)
    setCompletedSessions(0)
    resetFocusBlock('focus', preset)
  }

  function handleSelectClock() {
    setActiveMode('clock')
    setIsRunning(false)
    setStatusMessage('')
    setNow(new Date())
  }

  function handleStart() {
    if (secondsRemaining > 0) {
      setIsRunning(true)
      setStatusMessage('')
    }
  }

  function handlePause() {
    setIsRunning(false)
  }

  function handleReset() {
    setIsRunning(false)
    resetFocusBlock(phase, activePreset)
  }

  function handleSkipPhase() {
    setIsRunning(false)
    if (phase === 'focus') {
      setCompletedSessions((count) => count + 1)
      resetFocusBlock('break', activePreset)
      setStatusMessage('Skipped to break.')
      return
    }

    resetFocusBlock('focus', activePreset)
    setStatusMessage('Skipped to next focus block.')
  }

  return (
    <div className="timer">
      <aside
        className={`month-sidebar${sidebarOpen ? ' month-sidebar-open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <TimerSidebar
          activeMode={activeMode}
          activePresetId={activePresetId}
          onSelectFocus={handleSelectFocus}
          onSelectClock={handleSelectClock}
        />
      </aside>

      <div className="timer-main">
        <header className="timer-toolbar">
          <button
            type="button"
            className={`timer-sidebar-toggle${sidebarOpen ? ' timer-sidebar-toggle-active' : ''}`}
            aria-label={sidebarOpen ? 'Hide timer sidebar' : 'Show timer sidebar'}
            aria-pressed={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <PanelIcon />
          </button>

          {activeMode === 'clock' && (
            <div className="timer-display-toggle" role="group" aria-label="Clock display mode">
              <button
                type="button"
                className={`timer-display-toggle-btn${
                  clockDisplayMode === 'digital' ? ' timer-display-toggle-btn-active' : ''
                }`}
                aria-pressed={clockDisplayMode === 'digital'}
                onClick={() => setClockDisplayMode('digital')}
              >
                Digital
              </button>
              <button
                type="button"
                className={`timer-display-toggle-btn${
                  clockDisplayMode === 'analog' ? ' timer-display-toggle-btn-active' : ''
                }`}
                aria-pressed={clockDisplayMode === 'analog'}
                onClick={() => setClockDisplayMode('analog')}
              >
                Analog
              </button>
            </div>
          )}
        </header>

        {activeMode === 'focus' ? (
          <FocusDisplay
            phase={phase}
            secondsRemaining={secondsRemaining}
            totalSeconds={totalSeconds}
            completedSessions={completedSessions}
            statusMessage={statusMessage}
            isRunning={isRunning}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
            onSkipPhase={handleSkipPhase}
          />
        ) : (
          <DeskClock displayMode={clockDisplayMode} now={now} />
        )}
      </div>
    </div>
  )
}
