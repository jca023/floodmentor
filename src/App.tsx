import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VoiceRecorder } from './components/VoiceRecorder'
import { LocationSelector } from './components/LocationSelector'
import { ExtractionCards } from './components/ExtractionCards'
import { ObservationList } from './components/ObservationList'
import { createObservation, listObservations } from './services/observationService'
import { isDemoMode } from './lib/supabase'
import type { Observation, ObservationContext, RecordingResult, ExtractedFacts } from './types'

type AppState = 'location' | 'recording' | 'transcribing' | 'review' | 'saved'

// Demo extraction - simulates AI extraction for demo mode
function simulateExtraction(text: string): ExtractedFacts {
  const facts: ExtractedFacts = {}

  // Look for flood line height
  const heightMatch = text.match(/(\d+)\s*(inch|inches|in|feet|ft|"|')/i)
  if (heightMatch) {
    const value = parseInt(heightMatch[1], 10)
    const unit = heightMatch[2].toLowerCase()
    facts.floodLine = {
      heightValue: value,
      heightUnit: unit.includes('f') || unit === "'" ? 'ft' : 'in',
      evidenceType: 'observed',
    }
  }

  // Look for water source hints
  if (text.toLowerCase().includes('silt') || text.toLowerCase().includes('debris')) {
    facts.waterSourceHint = 'rising_floodwater_outside_in'
  }

  // Extract mentioned items
  const items: string[] = []
  const itemKeywords = ['drywall', 'baseboard', 'foundation', 'brick', 'wall', 'floor', 'ceiling']
  itemKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      items.push(keyword)
    }
  })
  if (items.length > 0) {
    facts.mentionedItems = items
  }

  return facts
}

function App() {
  const [appState, setAppState] = useState<AppState>('location')
  const [locationContext, setLocationContext] = useState<Partial<ObservationContext>>({})
  const [transcript, setTranscript] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [extractedFacts, setExtractedFacts] = useState<ExtractedFacts | null>(null)
  const [observations, setObservations] = useState<Observation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)

  // Load existing observations on mount
  useEffect(() => {
    listObservations().then(setObservations).catch(console.error)
  }, [])

  const handleLocationComplete = (context: ObservationContext) => {
    setLocationContext(context)
    setAppState('recording')
  }

  const handleRecordingComplete = async (result: RecordingResult) => {
    setAudioBlob(result.blob)
    setAppState('transcribing')
    setError(null)

    // In demo mode, simulate transcription
    // In production, this would call Whisper API
    setTimeout(() => {
      // Demo transcript based on location
      const demoTranscripts: Record<string, string> = {
        interior: "First floor living room, flood line at 22 inches on the drywall, clear silt line and water damage visible on baseboards.",
        exterior: "Exterior front, flood line 18 inches on the brick foundation, debris mat and silt line visible at ground level.",
      }

      const text = demoTranscripts[locationContext.areaType || 'interior'] ||
        "Flood line observed at approximately 20 inches, water damage evident."

      setTranscript(text)
      setAppState('review')

      // Simulate extraction
      setIsExtracting(true)
      setTimeout(() => {
        const facts = simulateExtraction(text)
        setExtractedFacts(facts)
        setIsExtracting(false)
      }, 1500)
    }, 2000)
  }

  const handleSave = async () => {
    if (!transcript || !locationContext.areaType) return

    setError(null)

    try {
      await createObservation({
        rawText: transcript,
        inputMode: 'voice',
        audioBlob: audioBlob || undefined,
        context: locationContext as ObservationContext,
      })

      // Refresh observations list
      const updated = await listObservations()
      setObservations(updated)

      setAppState('saved')

      // Reset after delay
      setTimeout(() => {
        resetFlow()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save observation')
    }
  }

  const resetFlow = () => {
    setAppState('location')
    setLocationContext({})
    setTranscript('')
    setAudioBlob(null)
    setExtractedFacts(null)
    setError(null)
    setIsExtracting(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-brand-blue text-white px-4 py-4 shadow-lg safe-area-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">FloodMentor</h1>
            <p className="text-blue-200 text-sm">
              {isDemoMode ? 'Demo Mode' : 'Voice-first documentation'}
            </p>
          </div>
          {appState !== 'location' && appState !== 'saved' && (
            <button
              onClick={resetFlow}
              className="text-blue-200 text-sm px-3 py-1 rounded-lg bg-blue-700/50"
            >
              Cancel
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto px-4 py-6 safe-area-bottom">
        {/* Error display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Location selection */}
          {appState === 'location' && (
            <motion.div
              key="location"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <LocationSelector
                value={locationContext}
                onChange={setLocationContext}
                onComplete={handleLocationComplete}
              />

              {/* Show recent observations */}
              {observations.length > 0 && (
                <div className="mt-8">
                  <ObservationList observations={observations} />
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Recording */}
          {appState === 'recording' && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Location badge */}
              <div className="flex justify-center mb-4">
                <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 shadow-sm">
                  📍 {formatLocationBadge(locationContext)}
                </span>
              </div>

              <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
            </motion.div>
          )}

          {/* Step 3: Transcribing */}
          {appState === 'transcribing' && (
            <motion.div
              key="transcribing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-blue border-t-transparent" />
              <p className="text-gray-600 text-lg">Transcribing...</p>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {appState === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Location badge */}
              <div className="flex justify-center">
                <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 shadow-sm">
                  📍 {formatLocationBadge(locationContext)}
                </span>
              </div>

              {/* Transcript */}
              <div className="bg-white rounded-xl p-4 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    Transcript
                  </span>
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full text-gray-800 leading-relaxed resize-none border-0 focus:ring-0 p-0 min-h-[100px]"
                  placeholder="Transcript will appear here..."
                />
              </div>

              {/* Extracted facts */}
              <ExtractionCards facts={extractedFacts} isExtracting={isExtracting} />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isExtracting}
                  className="flex-1 bg-brand-blue text-white py-4 rounded-xl font-semibold
                             disabled:opacity-50 disabled:cursor-not-allowed
                             active:bg-blue-700 touch-manipulation"
                >
                  Save Observation
                </button>
                <button
                  onClick={resetFlow}
                  className="px-6 bg-gray-200 text-gray-700 py-4 rounded-xl font-medium
                             active:bg-gray-300 touch-manipulation"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Saved confirmation */}
          {appState === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center"
              >
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <p className="text-xl font-semibold text-gray-800">Observation Saved!</p>
              <p className="text-gray-500">Ready for the next one</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer - safe area for mobile */}
      <footer className="text-center text-gray-400 text-xs py-2 safe-area-bottom">
        {isDemoMode && 'Demo Mode - Data stored locally'}
      </footer>
    </div>
  )
}

function formatLocationBadge(context: Partial<ObservationContext>): string {
  if (context.areaType === 'interior' && context.interiorLevel) {
    const labels: Record<string, string> = {
      basement: 'Basement',
      first_floor: '1st Floor',
      second_floor: '2nd Floor',
      upper_floor: 'Upper Floor',
      garage: 'Garage',
      crawlspace: 'Crawlspace',
    }
    return `Interior - ${labels[context.interiorLevel] || context.interiorLevel}`
  }
  if (context.areaType === 'exterior' && context.exteriorOrientation) {
    return `Exterior - ${context.exteriorOrientation.charAt(0).toUpperCase() + context.exteriorOrientation.slice(1)}`
  }
  return context.areaType || 'Unknown'
}

export default App
