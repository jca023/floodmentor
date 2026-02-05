import { supabase, isDemoMode } from '../lib/supabase'
import type {
  Observation,
  CreateObservationInput,
  ProcessingStatus,
  ObservationContext,
} from '../types'

// Convert camelCase to snake_case for database
function toSnakeCase(context: ObservationContext): Record<string, unknown> {
  return {
    area_type: context.areaType,
    interior_level: context.interiorLevel,
    exterior_orientation: context.exteriorOrientation,
    room_or_zone: context.roomOrZone,
  }
}

// Convert snake_case from database to camelCase
function fromSnakeCase(row: Record<string, unknown>): Observation {
  return {
    observationId: row.observation_id as string,
    createdAt: row.created_at as string,
    inputMode: row.input_mode as 'voice' | 'text',
    rawText: row.raw_text as string,
    transcriptConfidence: row.transcript_confidence as number | undefined,
    audioStoragePath: row.audio_storage_path as string | undefined,
    processingStatus: row.processing_status as ProcessingStatus,
    context: {
      areaType: row.area_type as ObservationContext['areaType'],
      interiorLevel: row.interior_level as ObservationContext['interiorLevel'],
      exteriorOrientation: row.exterior_orientation as ObservationContext['exteriorOrientation'],
      roomOrZone: row.room_or_zone as string | undefined,
    },
    extracted: row.extracted as Observation['extracted'],
  }
}

// Demo mode: in-memory storage
let demoObservations: Observation[] = []

export async function createObservation(input: CreateObservationInput): Promise<Observation> {
  // Demo mode - store in memory
  if (isDemoMode) {
    const observation: Observation = {
      observationId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      inputMode: input.inputMode,
      rawText: input.rawText,
      transcriptConfidence: input.transcriptConfidence,
      processingStatus: 'ready',
      context: input.context,
    }
    demoObservations.unshift(observation)
    return observation
  }

  // Real mode - use Supabase
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  let audioStoragePath: string | null = null

  // Upload audio if provided
  if (input.audioBlob) {
    const fileName = `recordings/${Date.now()}-${crypto.randomUUID()}.webm`

    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, input.audioBlob, {
        contentType: input.audioBlob.type,
      })

    if (uploadError) {
      throw new Error(`Failed to upload audio: ${uploadError.message}`)
    }

    audioStoragePath = fileName
  }

  // Insert observation record
  const contextData = toSnakeCase(input.context)

  const { data, error } = await supabase
    .from('observations')
    .insert({
      input_mode: input.inputMode,
      raw_text: input.rawText,
      transcript_confidence: input.transcriptConfidence ?? null,
      audio_storage_path: audioStoragePath,
      processing_status: 'ready',
      ...contextData,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create observation: ${error.message}`)
  }

  return fromSnakeCase(data)
}

export async function updateObservationStatus(
  observationId: string,
  status: ProcessingStatus,
  updates?: Partial<Pick<Observation, 'rawText' | 'transcriptConfidence' | 'extracted'>>
): Promise<Observation> {
  // Demo mode
  if (isDemoMode) {
    const index = demoObservations.findIndex(o => o.observationId === observationId)
    if (index === -1) {
      throw new Error('Observation not found')
    }
    demoObservations[index] = {
      ...demoObservations[index],
      processingStatus: status,
      ...updates,
    }
    return demoObservations[index]
  }

  // Real mode
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('observations')
    .update({
      processing_status: status,
      raw_text: updates?.rawText,
      transcript_confidence: updates?.transcriptConfidence,
      extracted: updates?.extracted,
    })
    .eq('observation_id', observationId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update observation: ${error.message}`)
  }

  return fromSnakeCase(data)
}

export async function listObservations(limit = 50): Promise<Observation[]> {
  // Demo mode
  if (isDemoMode) {
    return demoObservations.slice(0, limit)
  }

  // Real mode
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('observations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to list observations: ${error.message}`)
  }

  return (data ?? []).map(fromSnakeCase)
}

export async function getObservation(observationId: string): Promise<Observation | null> {
  // Demo mode
  if (isDemoMode) {
    return demoObservations.find(o => o.observationId === observationId) ?? null
  }

  // Real mode
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('observations')
    .select('*')
    .eq('observation_id', observationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get observation: ${error.message}`)
  }

  return fromSnakeCase(data)
}

// Clear demo data (for testing)
export function clearDemoData(): void {
  demoObservations = []
}
