import { motion } from 'framer-motion'
import type { AreaType, InteriorLevel, ExteriorOrientation, ObservationContext } from '../types'

interface LocationSelectorProps {
  value: Partial<ObservationContext>
  onChange: (context: Partial<ObservationContext>) => void
  onComplete: (context: ObservationContext) => void
}

const INTERIOR_LEVELS: { value: InteriorLevel; label: string }[] = [
  { value: 'basement', label: 'Basement' },
  { value: 'first_floor', label: '1st Floor' },
  { value: 'second_floor', label: '2nd Floor' },
  { value: 'upper_floor', label: 'Upper Floor' },
  { value: 'garage', label: 'Garage' },
  { value: 'crawlspace', label: 'Crawlspace' },
]

const EXTERIOR_ORIENTATIONS: { value: ExteriorOrientation; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'left', label: 'Left Side' },
  { value: 'right', label: 'Right Side' },
]

export function LocationSelector({ value, onChange, onComplete }: LocationSelectorProps) {
  const handleAreaTypeSelect = (areaType: AreaType) => {
    onChange({ areaType })
  }

  const handleInteriorLevelSelect = (level: InteriorLevel) => {
    const context: ObservationContext = {
      areaType: 'interior',
      interiorLevel: level,
    }
    onComplete(context)
  }

  const handleExteriorOrientationSelect = (orientation: ExteriorOrientation) => {
    const context: ObservationContext = {
      areaType: 'exterior',
      exteriorOrientation: orientation,
    }
    onComplete(context)
  }

  // Step 1: Select area type
  if (!value.areaType) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <h2 className="text-xl font-semibold text-gray-800">Where are you?</h2>

        <div className="flex gap-4 w-full max-w-sm px-4">
          <OptionButton
            onClick={() => handleAreaTypeSelect('interior')}
            icon="🏠"
            label="Interior"
            sublabel="Inside the building"
          />
          <OptionButton
            onClick={() => handleAreaTypeSelect('exterior')}
            icon="🏡"
            label="Exterior"
            sublabel="Outside the building"
          />
        </div>
      </div>
    )
  }

  // Step 2a: Select interior level
  if (value.areaType === 'interior') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <button
          onClick={() => onChange({})}
          className="text-brand-blue text-sm flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-xl font-semibold text-gray-800">Which level?</h2>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm px-4">
          {INTERIOR_LEVELS.map((level) => (
            <motion.button
              key={level.value}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleInteriorLevelSelect(level.value)}
              className="bg-white rounded-xl p-4 shadow-md border-2 border-transparent
                         active:border-brand-blue touch-manipulation text-left"
            >
              <span className="text-gray-800 font-medium">{level.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  // Step 2b: Select exterior orientation
  if (value.areaType === 'exterior') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <button
          onClick={() => onChange({})}
          className="text-brand-blue text-sm flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-xl font-semibold text-gray-800">Which side?</h2>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm px-4">
          {EXTERIOR_ORIENTATIONS.map((orientation) => (
            <motion.button
              key={orientation.value}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExteriorOrientationSelect(orientation.value)}
              className="bg-white rounded-xl p-4 shadow-md border-2 border-transparent
                         active:border-brand-blue touch-manipulation text-left"
            >
              <span className="text-gray-800 font-medium">{orientation.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  return null
}

interface OptionButtonProps {
  onClick: () => void
  icon: string
  label: string
  sublabel: string
}

function OptionButton({ onClick, icon, label, sublabel }: OptionButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex-1 bg-white rounded-2xl p-6 shadow-md border-2 border-transparent
                 active:border-brand-blue touch-manipulation flex flex-col items-center gap-2"
    >
      <span className="text-4xl">{icon}</span>
      <span className="text-gray-800 font-semibold text-lg">{label}</span>
      <span className="text-gray-500 text-sm">{sublabel}</span>
    </motion.button>
  )
}
