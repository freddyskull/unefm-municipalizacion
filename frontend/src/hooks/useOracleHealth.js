import { useState, useCallback, useEffect } from 'react'
import api from '../services/api'

export default function useOracleHealth() {
  const [status, setStatus] = useState('checking')
  const [latency, setLatency] = useState(null)
  const [error, setError] = useState('')

  const check = useCallback(async () => {
    setStatus('checking')
    try {
      const res = await api.get('/oracle/health')
      if (res.data.connected) {
        setStatus('connected')
        setLatency(res.data.latencyMs)
        setError('')
        return true
      }
      setStatus('disconnected')
      setLatency(res.data.latencyMs)
      setError(res.data.error || 'No se pudo conectar a la base de datos Oracle')
      return false
    } catch (err) {
      setStatus('disconnected')
      setLatency(null)
      setError(err.response?.data?.error || err.message || 'Error de conexión con Oracle')
      return false
    }
  }, [])

  useEffect(() => {
    check()
  }, [check])

  return { status, latency, error, check }
}