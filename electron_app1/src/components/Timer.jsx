import { useCallback, useEffect, useRef, useState } from 'react'
import { PanelIcon } from './icons'
import SidebarTodoList from './SidebarTodoList'
import { useCalendarTodos } from '../hooks/useCalendarTodos'

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

function TimerSidebar({
  activeMode,
  activePresetId,
  onSelectFocus,
  onSelectClock,
  todos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}) {
  return (
    <aside className="sidebar timer-sidebar">
      <div className="timer-sidebar__modes">
        <section className="timer-sidebar__section">
          <h2 className="sidebar__title timer-sidebar__section-title">Focus</h2>
          <ul className="timer-sidebar__list">
            {POMODORO_PRESETS.map((preset) => (
              <li key={preset.id}>
                <button
                  type="button"
                  className={`timer-sidebar__item${
                    activeMode === 'focus' && activePresetId === preset.id
                      ? ' timer-sidebar__item--active'
                      : ''
                  }`}
                  onClick={() => onSelectFocus(preset)}
                >
                  <span className="timer-sidebar__item-label">{preset.label}</span>
                  <span className="timer-sidebar__item-meta">focus / break</span>
                </button>
              </li>
            ))}
              <button
                type="button"
                className={`timer-sidebar__item${
                  activeMode === 'clock' ? ' timer-sidebar__item--active' : ''
                }`}
                onClick={onSelectClock}
              >
                <span className="timer-sidebar__item-label">Desk Clock</span>
                <span className="timer-sidebar__item-meta">digital or analog</span>
              </button>
          </ul>
        </section>

      </div>

      <SidebarTodoList
        todos={todos}
        onAddTodo={onAddTodo}
        onToggleTodo={onToggleTodo}
        onDeleteTodo={onDeleteTodo}
        title="Tasks"
      />
    </aside>
  )
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
      <div className="focus-display__header">
        <span className="focus-display__phase">{phaseLabel}</span>
        <span className="focus-display__session">
          {phase === 'focus' ? `Session ${nextSessionNumber}` : `After session ${completedSessions}`}
        </span>
      </div>

      <div className="focus-display__ring">
        <svg className="focus-display__progress" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="focus-display__track" cx="60" cy="60" r="54" />
          <circle
            className="focus-display__fill"
            cx="60"
            cy="60"
            r="54"
            style={{
              strokeDasharray: `${2 * Math.PI * 54}`,
              strokeDashoffset: `${2 * Math.PI * 54 * (1 - progress / 100)}`,
            }}
          />
        </svg>
        <div className="focus-display__time">{formatCountdown(secondsRemaining)}</div>
      </div>

      {statusMessage && (
        <p className="focus-display__status">{statusMessage}</p>
      )}

      <p className="focus-display__hint">
        {phase === 'focus'
          ? 'One block at a time. Pause if you need to step away.'
          : 'Rest your eyes and stretch before the next block.'}
      </p>

      <div className="focus-display__controls">
        {!isRunning ? (
          <button
            type="button"
            className="focus-display__btn focus-display__btn--primary"
            onClick={onStart}
            disabled={secondsRemaining === 0}
          >
            {phase === 'focus' ? 'Start focus' : 'Start break'}
          </button>
        ) : (
          <button
            type="button"
            className="focus-display__btn focus-display__btn--primary"
            onClick={onPause}
          >
            Pause
          </button>
        )}
        <button type="button" className="focus-display__btn" onClick={onReset}>
          Reset block
        </button>
        <button type="button" className="focus-display__btn focus-display__btn--ghost" onClick={onSkipPhase}>
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
        className="desk-clock__tick"
      />
    )
  })

  return (
    <div className="desk-clock__analog">
      <svg className="desk-clock__face" viewBox="0 0 120 120" aria-hidden="true">
        <circle className="desk-clock__dial" cx="60" cy="60" r="54" />
        {ticks}
        <line
          className="desk-clock__hand desk-clock__hand--hour"
          x1="60"
          y1="60"
          x2="60"
          y2="34"
          transform={`rotate(${hourAngle} 60 60)`}
        />
        <line
          className="desk-clock__hand desk-clock__hand--minute"
          x1="60"
          y1="60"
          x2="60"
          y2="24"
          transform={`rotate(${minuteAngle} 60 60)`}
        />
        <line
          className="desk-clock__hand desk-clock__hand--second"
          x1="60"
          y1="66"
          x2="60"
          y2="20"
          transform={`rotate(${secondAngle} 60 60)`}
        />
        <circle className="desk-clock__center" cx="60" cy="60" r="3" />
      </svg>
      <p className="desk-clock__date">{formatClockDate(date)}</p>
    </div>
  )
}

function DigitalClockDisplay({ date }) {
  return (
    <div className="desk-clock__digital">
      <time className="desk-clock__time" dateTime={date.toISOString()}>
        {formatClockTime(date)}
      </time>
      <p className="desk-clock__date">{formatClockDate(date)}</p>
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

export default function Timer() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
  const { todos, addTodo, toggleTodo, deleteTodo } = useCalendarTodos()

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
        className={`month-sidebar${sidebarOpen ? ' month-sidebar--open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <TimerSidebar
          activeMode={activeMode}
          activePresetId={activePresetId}
          onSelectFocus={handleSelectFocus}
          onSelectClock={handleSelectClock}
          todos={todos}
          onAddTodo={addTodo}
          onToggleTodo={toggleTodo}
          onDeleteTodo={deleteTodo}
        />
      </aside>

      <div className="timer__main">
        <header className="timer__toolbar">
          <button
            type="button"
            className={`timer__sidebar-toggle${sidebarOpen ? ' timer__sidebar-toggle--active' : ''}`}
            aria-label={sidebarOpen ? 'Hide timer sidebar' : 'Show timer sidebar'}
            aria-pressed={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <PanelIcon />
          </button>

          {activeMode === 'clock' && (
            <div className="timer__display-toggle" role="group" aria-label="Clock display mode">
              <button
                type="button"
                className={`timer__display-toggle-btn${
                  clockDisplayMode === 'digital' ? ' timer__display-toggle-btn--active' : ''
                }`}
                aria-pressed={clockDisplayMode === 'digital'}
                onClick={() => setClockDisplayMode('digital')}
              >
                Digital
              </button>
              <button
                type="button"
                className={`timer__display-toggle-btn${
                  clockDisplayMode === 'analog' ? ' timer__display-toggle-btn--active' : ''
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
