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
