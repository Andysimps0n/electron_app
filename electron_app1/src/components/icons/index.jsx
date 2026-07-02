import Icon from './Icon'

export function CalendarIcon({ width = 20, height = 20, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <rect x="2" y="4" width="16" height="14" rx="2" />
      <path d="M2 8H18" />
      <path d="M6 2V6" strokeLinecap="round" />
      <path d="M14 2V6" strokeLinecap="round" />
    </Icon>
  )
}

export function TimerIcon({ width = 20, height = 20, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <circle cx="10" cy="11" r="7" />
      <path d="M10 4V2" strokeLinecap="round" />
      <path d="M8 2H12" strokeLinecap="round" />
      <path d="M10 11V7" strokeLinecap="round" />
    </Icon>
  )
}

export function NoteIcon({ width = 20, height = 20, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <path d="M5 2h8l4 4v12H5V2Z" strokeLinejoin="round" />
      <path d="M13 2v4h4" strokeLinejoin="round" />
      <path d="M7 10h6M7 13h6" strokeLinecap="round" />
    </Icon>
  )
}

export function ChevronLeftIcon({ width = 16, height = 16, weight = 2 }) {
  return (
    <Icon viewBox="0 0 16 16" width={width} height={height} weight={weight}>
      <path
        d="M10 3L5 8L10 13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

export function ChevronRightIcon({ width = 16, height = 16, weight = 2 }) {
  return (
    <Icon viewBox="0 0 16 16" width={width} height={height} weight={weight}>
      <path
        d="M6 3L11 8L6 13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

export function PanelIcon({ width = 18, height = 18, weight = 2 }) {
  return (
    <Icon viewBox="0 0 18 18" width={width} height={height} weight={weight}>
      <rect x="1" y="2" width="16" height="14" rx="2" />
      <path d="M7 2V16" />
    </Icon>
  )
}

export function SettingsIcon({ width = 18, height = 30, weight = 1.7}) {
  return (
    <Icon viewBox="0 0 18 18" width={width} height={height} weight={weight}>
      <path d="M9 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path
        d="M14.2 10.5 13.8 9.9c.1-.3.1-.6.1-.9s0-.6-.1-.9l.4-.6-1-1.7-.7.3c-.5-.4-1.1-.7-1.7-.9l-.1-.7H7.1l-.1.7c-.6.2-1.2.5-1.7.9l-.7-.3-1 1.7.4.6c-.1.3-.1.6-.1.9s0 .6.1.9l-.4.6 1 1.7.7-.3c.5.4 1.1.7 1.7.9l.1.7h3.8l.1-.7c.6-.2 1.2-.5 1.7-.9l.7.3 1-1.7Z"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

/* --------------------------------------------------------------------------
   Music page icons
   Nav icon + one icon per ambient track + playback controls.
   -------------------------------------------------------------------------- */

export function MusicIcon({ width = 20, height = 20, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <path d="M7 15V5l9-2v9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5" cy="15" r="2" />
      <circle cx="14" cy="12" r="2" />
    </Icon>
  )
}

export function ForestIcon({ width = 20, height = 20, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <path d="M10 2 6 8h2.5L5 13h10L11.5 8H14L10 2Z" strokeLinejoin="round" />
      <path d="M10 13v5" strokeLinecap="round" />
    </Icon>
  )
}

export function WavesIcon({ width = 20, height = 20, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <path d="M1 7 C 4 4, 6 10, 9 7 S 15 4, 19 7" strokeLinecap="round" />
      <path d="M1 13 C 4 10, 6 16, 9 13 S 15 10, 19 13" strokeLinecap="round" />
    </Icon>
  )
}

export function WhiteNoiseIcon({ width = 20, height = 20, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <circle cx="10" cy="13" r="1.5" />
      <path d="M6.5 11a5 5 0 0 1 7 0" strokeLinecap="round" />
      <path d="M4 8.5a9 9 0 0 1 12 0" strokeLinecap="round" />
    </Icon>
  )
}

export function BrownNoiseIcon({ width = 20, height = 20, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <path d="M4 11v3" strokeLinecap="round" />
      <path d="M8 6v9" strokeLinecap="round" />
      <path d="M12 8v6" strokeLinecap="round" />
      <path d="M16 4v11" strokeLinecap="round" />
    </Icon>
  )
}

export function HeadphonesIcon({ width = 20, height = 20, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <path d="M4 12v-2a6 6 0 0 1 12 0v2" strokeLinecap="round" />
      <rect x="3" y="11.5" width="3.2" height="5.5" rx="1.3" />
      <rect x="13.8" y="11.5" width="3.2" height="5.5" rx="1.3" />
    </Icon>
  )
}

export function RaindropIcon({ width = 20, height = 20, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <path d="M10 3c3 4 5 6 5 8.5a5 5 0 0 1-10 0C5 9 7 7 10 3Z" strokeLinejoin="round" />
    </Icon>
  )
}

export function VolumeLowIcon({ width = 16, height = 16, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <path d="M4 8h3l4-3v10l-4-3H4V8Z" strokeLinejoin="round" />
      <path d="M13 8c1 1.2 1 2.8 0 4" strokeLinecap="round" />
    </Icon>
  )
}

export function VolumeHighIcon({ width = 16, height = 16, weight = 2 }) {
  return (
    <Icon viewBox="0 0 20 20" width={width} height={height} weight={weight}>
      <path d="M4 8h3l4-3v10l-4-3H4V8Z" strokeLinejoin="round" />
      <path d="M13 7c1.5 1.8 1.5 4.2 0 6" strokeLinecap="round" />
      <path d="M15.5 5c2.5 2.8 2.5 7.2 0 10" strokeLinecap="round" />
    </Icon>
  )
}

// Play / Pause / Stop are solid glyphs. They deliberately skip the shared
// `.icon` class because that class forces `fill: none` (great for line art,
// wrong for filled shapes), so we fill them with currentColor directly.
export function PlayIcon({ width = 16, height = 16 }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" />
    </svg>
  )
}

export function PauseIcon({ width = 16, height = 16 }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <rect x="4" y="3.5" width="3" height="9" rx="1" fill="currentColor" />
      <rect x="9" y="3.5" width="3" height="9" rx="1" fill="currentColor" />
    </svg>
  )
}

export function StopIcon({ width = 16, height = 16 }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={width}
      height={height}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <rect x="4" y="4" width="8" height="8" rx="2" fill="currentColor" />
    </svg>
  )
}
