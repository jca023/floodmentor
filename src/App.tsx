import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type DemoState = 'idle' | 'recording' | 'transcribing' | 'extracting' | 'complete'

const DEMO_TRANSCRIPT = "Exterior front, flood line 22 inches on the brick, clear silt line and debris mat at the foundation."

const EXTRACTED_DATA = [
  { label: 'Flood Line', value: '22 inches', icon: '📏' },
  { label: 'Evidence', value: 'Silt line, debris mat', icon: '🔍' },
  { label: 'Location', value: 'Exterior front', icon: '📍' },
]

function App() {
  const [state, setState] = useState<DemoState>('idle')
  const [displayedText, setDisplayedText] = useState('')
  const [showCards, setShowCards] = useState<number[]>([])

  const startDemo = async () => {
    // Reset
    setDisplayedText('')
    setShowCards([])
    setState('recording')

    // Recording phase (3 seconds)
    await sleep(3000)
    setState('transcribing')

    // Typing animation
    for (let i = 0; i <= DEMO_TRANSCRIPT.length; i++) {
      setDisplayedText(DEMO_TRANSCRIPT.slice(0, i))
      await sleep(30)
    }

    await sleep(500)
    setState('extracting')

    // Show cards one by one
    for (let i = 0; i < EXTRACTED_DATA.length; i++) {
      await sleep(400)
      setShowCards(prev => [...prev, i])
    }

    await sleep(500)
    setState('complete')
  }

  const reset = () => {
    setState('idle')
    setDisplayedText('')
    setShowCards([])
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-brand-blue text-white px-4 py-4 shadow-lg">
        <h1 className="text-xl font-bold">FloodMentor</h1>
        <p className="text-blue-200 text-sm">Voice-first flood documentation</p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Idle / Recording state - show record button */}
          {(state === 'idle' || state === 'recording') && (
            <motion.div
              key="recorder"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Waveform visualization */}
              {state === 'recording' && <Waveform />}

              {/* Record button */}
              <button
                onClick={state === 'idle' ? startDemo : undefined}
                disabled={state === 'recording'}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  state === 'recording'
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-red-500 hover:bg-red-600 hover:scale-105'
                }`}
              >
                {state === 'recording' ? (
                  <div className="w-8 h-8 bg-white rounded" />
                ) : (
                  <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-2" />
                )}
              </button>

              <p className="text-gray-500 text-center">
                {state === 'idle' ? 'Tap to record observation' : 'Recording...'}
              </p>
            </motion.div>
          )}

          {/* Transcribing state */}
          {(state === 'transcribing' || state === 'extracting' || state === 'complete') && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md space-y-4"
            >
              {/* Transcript */}
              <div className="bg-white rounded-xl p-4 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Transcript
                  </span>
                  {state === 'transcribing' && (
                    <span className="text-xs text-gray-400 animate-pulse">typing...</span>
                  )}
                </div>
                <p className="text-gray-800 leading-relaxed">
                  {displayedText}
                  {state === 'transcribing' && (
                    <span className="inline-block w-0.5 h-5 bg-brand-blue ml-1 animate-pulse" />
                  )}
                </p>
              </div>

              {/* Extraction cards */}
              {(state === 'extracting' || state === 'complete') && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Extracted Facts
                    </span>
                    {state === 'extracting' && showCards.length < EXTRACTED_DATA.length && (
                      <span className="text-xs text-gray-400 animate-pulse">extracting...</span>
                    )}
                  </div>

                  {EXTRACTED_DATA.map((item, index) => (
                    <AnimatePresence key={item.label}>
                      {showCards.includes(index) && (
                        <motion.div
                          initial={{ opacity: 0, x: -20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ type: 'spring', damping: 15 }}
                          className="bg-white rounded-xl p-4 shadow-md border-l-4 border-brand-blue flex items-center gap-3"
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
                            <p className="text-gray-800 font-semibold">{item.value}</p>
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}
                </div>
              )}

              {/* Complete state - show reset */}
              {state === 'complete' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center gap-4 pt-4"
                >
                  <p className="text-green-600 font-semibold">Observation saved!</p>
                  <button
                    onClick={reset}
                    className="bg-brand-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Record Another
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer hint */}
      <footer className="text-center text-gray-400 text-xs py-4">
        Demo Mode - UI Preview
      </footer>
    </div>
  )
}

function Waveform() {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-red-400 rounded-full"
          animate={{
            height: [16, Math.random() * 40 + 20, 16],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.05,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default App
