import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'persona_actual'
const PersonaContext = createContext(null)

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p && p.cedula) {
        return { cedula: String(p.cedula), tipo: p.tipo ? String(p.tipo) : undefined }
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

export function PersonaProvider({ children }) {
  const [persona, setPersonaState] = useState(readStored)

  const setPersona = useCallback((p) => {
    setPersonaState(p)
    try {
      if (p && p.cedula) localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  )
}

export const usePersona = () => useContext(PersonaContext)