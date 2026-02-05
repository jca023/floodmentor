import { motion, AnimatePresence } from 'framer-motion'
import type { ExtractedFacts } from '../types'

interface ExtractionCardsProps {
  facts: ExtractedFacts | null
  isExtracting?: boolean
}

interface FactCard {
  icon: string
  label: string
  value: string
}

export function ExtractionCards({ facts, isExtracting }: ExtractionCardsProps) {
  const cards: FactCard[] = []

  if (facts) {
    // Flood line
    if (facts.floodLine) {
      const { heightValue, heightUnit } = facts.floodLine
      cards.push({
        icon: '📏',
        label: 'Flood Line',
        value: `${heightValue} ${heightUnit}`,
      })
    }

    // Evidence type
    if (facts.floodLine?.evidenceType && facts.floodLine.evidenceType !== 'unknown') {
      cards.push({
        icon: '🔍',
        label: 'Evidence',
        value: facts.floodLine.evidenceType.charAt(0).toUpperCase() + facts.floodLine.evidenceType.slice(1),
      })
    }

    // Water source hint
    if (facts.waterSourceHint && facts.waterSourceHint !== 'unknown') {
      const sourceLabels: Record<string, string> = {
        rising_floodwater_outside_in: 'Rising floodwater',
        surface_water: 'Surface water',
        overflow_inland_tidal: 'Tidal overflow',
        mudflow_as_defined: 'Mudflow',
        sewer_backup_flood_related: 'Sewer backup (flood)',
        sewer_backup_non_flood: 'Sewer backup',
        internal_plumbing_discharge: 'Plumbing',
      }
      cards.push({
        icon: '💧',
        label: 'Water Source',
        value: sourceLabels[facts.waterSourceHint] || facts.waterSourceHint,
      })
    }

    // Mentioned items
    if (facts.mentionedItems && facts.mentionedItems.length > 0) {
      cards.push({
        icon: '📋',
        label: 'Items Noted',
        value: facts.mentionedItems.slice(0, 3).join(', '),
      })
    }
  }

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center gap-2">
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
          Extracted Facts
        </span>
        {isExtracting && (
          <span className="text-xs text-gray-400 animate-pulse">extracting...</span>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{
              type: 'spring',
              damping: 15,
              delay: index * 0.1,
            }}
            className="bg-white rounded-xl p-4 shadow-md border-l-4 border-brand-blue flex items-center gap-3"
          >
            <span className="text-2xl">{card.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className="text-gray-800 font-semibold truncate">{card.value}</p>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {cards.length === 0 && !isExtracting && (
        <div className="text-center text-gray-400 py-4">
          No facts extracted yet
        </div>
      )}
    </div>
  )
}
