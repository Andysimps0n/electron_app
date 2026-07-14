import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'themePreference'
// 'system' means "follow the OS". 'light' / 'dark' are explicit overrides.
const PREFERENCES = ['system', 'light', 'dark']

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function getInitialPreference() {
  const saved = localStorage.getItem(STORAGE_KEY)
  // Older builds stored only 'light' | 'dark'. Those still work as overrides.
  // Anything else (missing, invalid) falls back to system default.
  return PREFERENCES.includes(saved) ? saved : 'system'
}

function resolveTheme(preference) {
  return preference === 'system' ? getSystemTheme() : preference
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(getInitialPreference)
  const [theme, setTheme] = useState(() => resolveTheme(getInitialPreference()))

  // Keep <html data-theme> and localStorage in sync with the user's preference.
  // When preference is 'system', we also listen for OS theme changes so the
  // app flips live if the user changes macOS/Windows appearance.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, preference)

    function applyResolvedTheme() {
      const next = resolveTheme(preference)
      setTheme(next)
      document.documentElement.setAttribute('data-theme', next)
    }

    applyResolvedTheme()

    if (preference !== 'system') {
      return undefined
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', applyResolvedTheme)
    return () => media.removeEventListener('change', applyResolvedTheme)
  }, [preference])

  function toggleTheme() {
    // Cycle: system → dark → light → system.
    // Useful if a future UI wants a one-click flip; Settings uses setPreference.
    setPreference((current) => {
      if (current === 'system') return 'dark'
      if (current === 'dark') return 'light'
      return 'system'
    })
  }

  const value = {
    preference,
    theme,
    isDark: theme === 'dark',
    isSystem: preference === 'system',
    setPreference,
    setTheme: setPreference,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider')
  }
  return context
}
