import { motion } from 'framer-motion'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import type { RecordingResult } from '../types'

interface VoiceRecorderProps {
  onRecordingComplete: (result: RecordingResult) => void
  disabled?: boolean
}

export function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const { state, duration, error, startRecording, stopRecording } = useVoiceRecorder()

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleToggleRecording = async () => {
    if (disabled) return

    if (state === 'recording') {
      const result = await stopRecording()
      if (result) {
        onRecordingComplete(result)
      }
    } else {
      await startRecording()
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl w-full max-w-sm text-sm">
          {error}
        </div>
      )}

      {/* Waveform visualization (only when recording) */}
      {state === 'recording' && <Waveform />}

      {/* Duration display */}
      <div className="text-5xl font-mono tabular-nums text-gray-800">
        {formatDuration(duration)}
      </div>

      {/* Record button - large touch target for mobile (min 44x44, we use 96x96) */}
      <motion.button
        onClick={handleToggleRecording}
        disabled={disabled}
        whileTap={{ scale: 0.95 }}
        className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all touch-manipulation ${
          state === 'recording'
            ? 'bg-red-500'
            : disabled
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-red-500 active:bg-red-600'
        }`}
        aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
      >
        {state === 'recording' ? (
          // Stop icon (square)
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-8 h-8 bg-white rounded"
          />
        ) : (
          // Record icon (circle) - or play icon if you prefer
          <div className="w-8 h-8 bg-white rounded-full" />
        )}
      </motion.button>

      {/* Status text */}
      <p className="text-gray-500 text-center text-lg">
        {state === 'idle' && 'Tap to record'}
        {state === 'recording' && 'Recording... tap to stop'}
        {state === 'stopped' && 'Processing...'}
      </p>

      {/* Hint text */}
      {state === 'idle' && (
        <p className="text-gray-400 text-sm text-center max-w-xs px-4">
          Describe what you see: flood line height, evidence type, location
        </p>
      )}
    </div>
  )
}

function Waveform() {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 bg-red-400 rounded-full"
          animate={{
            height: [16, Math.random() * 48 + 16, 16],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.05,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
