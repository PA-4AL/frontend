import { useCallback, useEffect, useState } from 'react'

/* Thème clair/sombre partagé via la classe `dark` sur <body> (comme les
   maquettes) et persisté dans localStorage('pa-theme'). */

export function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('pa-theme')
    if (stored) return stored === 'dark'
    return document.body.classList.contains('dark')
  })

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    localStorage.setItem('pa-theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = useCallback(() => setDark((d) => !d), [])
  return { dark, toggle }
}
