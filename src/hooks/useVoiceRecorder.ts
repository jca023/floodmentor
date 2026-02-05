import { useState, useRef, useCallback, useEffect } from 'react'
import type { RecordingState, RecordingResult, UseVoiceRecorderReturn } from '../types'

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    chunksRef.current = []

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })

      streamRef.current = stream

      // Determine best supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/wav'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setError('Recording error occurred')
        setState('idle')
      }

      mediaRecorderRef.current = mediaRecorder

      // Start recording with timeslice to collect data periodically
      mediaRecorder.start(1000)

      startTimeRef.current = Date.now()
      setState('recording')
      setDuration(0)

      // Update duration every 100ms for smooth display
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 100)

    } catch (err) {
      console.error('Failed to start recording:', err)

      let message = 'Failed to access microphone'
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          message = 'Microphone permission denied. Please allow access in your browser settings.'
        } else if (err.name === 'NotFoundError') {
          message = 'No microphone found. Please connect a microphone.'
        } else {
          message = err.message
        }
      }

      setError(message)
      setState('idle')
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      return null
    }

    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        // Create blob from chunks
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000)

        // Stop all tracks to release microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }

        setState('stopped')
        resolve({ blob, duration: finalDuration })
      }

      mediaRecorder.stop()
    })
  }, [])

  return {
    state,
    duration,
    error,
    startRecording,
    stopRecording,
  }
}
