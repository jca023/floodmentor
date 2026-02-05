// Recording types
export type RecordingState = 'idle' | 'recording' | 'stopped'

export interface RecordingResult {
  blob: Blob
  duration: number
}

// Processing states
export type ProcessingStatus =
  | 'recording'
  | 'transcribing'
  | 'extracting'
  | 'ready'
  | 'synced'
  | 'failed'

// Location context
export type AreaType = 'interior' | 'exterior'

export type InteriorLevel =
  | 'basement'
  | 'crawlspace'
  | 'first_floor'
  | 'second_floor'
  | 'upper_floor'
  | 'garage'
  | 'unknown'

export type ExteriorOrientation =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'unknown'

export type WaterSourceHint =
  | 'rising_floodwater_outside_in'
  | 'surface_water'
  | 'overflow_inland_tidal'
  | 'mudflow_as_defined'
  | 'sewer_backup_flood_related'
  | 'sewer_backup_non_flood'
  | 'internal_plumbing_discharge'
  | 'unknown'

export type EvidenceType = 'observed' | 'photo' | 'video' | 'unknown'

// Observation context
export interface ObservationContext {
  areaType: AreaType
  interiorLevel?: InteriorLevel
  exteriorOrientation?: ExteriorOrientation
  roomOrZone?: string
}

// Extracted facts from transcript
export interface ExtractedFacts {
  floodLine?: {
    heightValue: number
    heightUnit: 'in' | 'ft' | 'cm' | 'm'
    evidenceType: EvidenceType
    notes?: string
  }
  waterSourceHint?: WaterSourceHint
  mentionedItems?: string[]
}

// Observation record (matches database schema)
export interface Observation {
  observationId: string
  createdAt: string
  inputMode: 'voice' | 'text'
  rawText: string
  transcriptConfidence?: number
  audioStoragePath?: string
  processingStatus: ProcessingStatus
  context: ObservationContext
  extracted?: ExtractedFacts
}

// Input for creating observation
export interface CreateObservationInput {
  rawText: string
  inputMode: 'voice' | 'text'
  audioBlob?: Blob
  transcriptConfidence?: number
  context: ObservationContext
}

// Transcription result
export interface TranscriptionResult {
  text: string
  confidence: number | null
  duration: number
}

// Voice recorder hook return type
export interface UseVoiceRecorderReturn {
  state: RecordingState
  duration: number
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<RecordingResult | null>
}
