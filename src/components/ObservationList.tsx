import { motion } from 'framer-motion'
import type { Observation } from '../types'

interface ObservationListProps {
  observations: Observation[]
  maxItems?: number
}

export function ObservationList({ observations, maxItems = 5 }: ObservationListProps) {
  const displayedObservations = observations.slice(0, maxItems)

  if (displayedObservations.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Observations</h2>
      <div className="space-y-2">
        {displayedObservations.map((obs, index) => (
          <motion.div
            key={obs.observationId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              {/* Location badge */}
              <div className="flex-shrink-0">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {formatLocation(obs.context)}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 line-clamp-2">{obs.rawText}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTime(obs.createdAt)}
                </p>
              </div>

              {/* Status indicator */}
              <div className="flex-shrink-0">
                <StatusBadge status={obs.processingStatus} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {observations.length > maxItems && (
        <p className="text-center text-gray-400 text-sm mt-3">
          +{observations.length - maxItems} more observations
        </p>
      )}
    </div>
  )
}

function formatLocation(context: Observation['context']): string {
  if (context.areaType === 'interior' && context.interiorLevel) {
    return context.interiorLevel.replace('_', ' ')
  }
  if (context.areaType === 'exterior' && context.exteriorOrientation) {
    return `Exterior ${context.exteriorOrientation}`
  }
  return context.areaType || 'Unknown'
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  return date.toLocaleDateString()
}

function StatusBadge({ status }: { status: Observation['processingStatus'] }) {
  const config = {
    recording: { bg: 'bg-red-100', text: 'text-red-700', label: 'Recording' },
    transcribing: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Transcribing' },
    extracting: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Extracting' },
    ready: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready' },
    synced: { bg: 'bg-green-100', text: 'text-green-700', label: 'Synced' },
    failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
  }

  const { bg, text, label } = config[status] || config.ready

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${bg} ${text}`}>
      {label}
    </span>
  )
}
