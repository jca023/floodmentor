# Phase 1: Walking Skeleton Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a minimal working PWA that records voice, transcribes it, and saves to Supabase - deployable to Railway for real device testing.

**Architecture:** React PWA with Vite, voice recording via MediaRecorder API, Supabase for backend (auth, storage, database), Whisper API for transcription via Edge Function.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL + Auth + Storage + Edge Functions), OpenAI Whisper API, Railway for deployment.

---

## Prerequisites

Before starting, ensure you have:
- Node.js 20+ installed
- Supabase account (free tier works)
- OpenAI API key (for Whisper)
- Railway account (free tier works)

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`

**Step 1: Initialize Vite React TypeScript project**

Run:
```bash
cd "c:\Users\john\Documents\_Claude\FloodMentor"
npm create vite@latest . -- --template react-ts
```

Expected: Project files created, prompts may ask to overwrite - select yes for empty directory.

**Step 2: Install dependencies**

Run:
```bash
npm install
npm install -D tailwindcss postcss autoprefixer
npm install @supabase/supabase-js
npx tailwindcss init -p
```

Expected: Dependencies installed, `tailwind.config.js` and `postcss.config.js` created.

**Step 3: Configure Tailwind**

Replace `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 4: Add Tailwind directives to CSS**

Replace `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 5: Verify dev server runs**

Run:
```bash
npm run dev
```

Expected: Server starts at `http://localhost:5173`, default Vite page shows.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React TypeScript project with Tailwind"
```

---

## Task 2: PWA Configuration

**Files:**
- Create: `vite.config.ts` (modify)
- Create: `public/manifest.json`
- Create: `public/icons/icon-192.png` (placeholder)
- Create: `public/icons/icon-512.png` (placeholder)

**Step 1: Install PWA plugin**

Run:
```bash
npm install -D vite-plugin-pwa
```

**Step 2: Configure Vite for PWA**

Replace `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'FloodMentor',
        short_name: 'FloodMentor',
        description: 'Flood claim observation capture',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
```

**Step 3: Create placeholder icons**

Create `public/icons/` directory and add placeholder PNG files (192x192 and 512x512). For now, create simple colored squares:

Run:
```bash
mkdir -p public/icons
```

Then create placeholder icons (we'll replace with real ones later). For now, use any 192x192 and 512x512 PNG images.

**Step 4: Build and verify PWA**

Run:
```bash
npm run build
npm run preview
```

Expected: Preview server runs, Chrome DevTools > Application > Manifest shows FloodMentor manifest.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: configure PWA with vite-plugin-pwa"
```

---

## Task 3: Supabase Project Setup

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `.env.local`
- Modify: `.gitignore`

**Step 1: Create Supabase project**

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: `floodmentor`
4. Generate a database password (save it)
5. Select region closest to you
6. Wait for project to provision

**Step 2: Get API credentials**

1. In Supabase dashboard, go to Settings > API
2. Copy "Project URL" and "anon public" key

**Step 3: Create environment file**

Create `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Step 4: Update gitignore**

Add to `.gitignore`:
```
.env.local
.env.*.local
```

**Step 5: Create Supabase client**

Create `src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 6: Test connection**

Update `src/App.tsx` temporarily:
```tsx
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [status, setStatus] = useState('Checking...')

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setStatus('Error: ' + error.message)
      } else {
        setStatus('Connected to Supabase!')
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-xl font-semibold">{status}</div>
    </div>
  )
}

export default App
```

Run:
```bash
npm run dev
```

Expected: Browser shows "Connected to Supabase!"

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client configuration"
```

---

## Task 4: Database Schema (Observations Table)

**Files:**
- Create: `supabase/migrations/001_observations.sql`

**Step 1: Create migrations directory**

Run:
```bash
mkdir -p supabase/migrations
```

**Step 2: Write migration for observations table**

Create `supabase/migrations/001_observations.sql`:
```sql
-- Observations table for Phase 1 (walking skeleton)
-- Simplified from full schema - just what we need for voice capture

create table if not exists public.observations (
  observation_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Input
  input_mode text not null check (input_mode in ('voice', 'text')),
  raw_text text not null,
  transcript_confidence numeric(3,2) check (transcript_confidence >= 0 and transcript_confidence <= 1),

  -- Audio storage
  audio_storage_path text,

  -- Processing status (added for Phase 1)
  processing_status text not null default 'ready' check (
    processing_status in ('recording', 'transcribing', 'extracting', 'ready', 'synced', 'failed')
  ),

  -- Location context (simplified for Phase 1)
  area_type text check (area_type in ('interior', 'exterior')),
  interior_level text,
  exterior_orientation text,

  -- Timestamps
  updated_at timestamptz not null default now()
);

-- Update timestamp trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger observations_updated_at
  before update on public.observations
  for each row
  execute function update_updated_at();

-- Row Level Security (disabled for Phase 1, enable in Phase 2 with auth)
alter table public.observations enable row level security;

-- Allow all operations for now (Phase 1 - no auth)
create policy "Allow all for Phase 1" on public.observations
  for all using (true) with check (true);
```

**Step 3: Run migration in Supabase**

1. Go to Supabase Dashboard > SQL Editor
2. Paste the SQL above
3. Click "Run"

Expected: Success message, table appears in Table Editor.

**Step 4: Verify table exists**

In Supabase Dashboard > Table Editor, confirm `observations` table with correct columns.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add observations table migration"
```

---

## Task 5: Voice Recorder Hook

**Files:**
- Create: `src/hooks/useVoiceRecorder.ts`
- Create: `src/types/index.ts`

**Step 1: Create types file**

Create `src/types/index.ts`:
```ts
export type RecordingState = 'idle' | 'recording' | 'stopped'

export interface RecordingResult {
  blob: Blob
  duration: number
}

export interface UseVoiceRecorderReturn {
  state: RecordingState
  duration: number
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<RecordingResult | null>
}
```

**Step 2: Create voice recorder hook**

Create `src/hooks/useVoiceRecorder.ts`:
```ts
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Collect data every second

      startTimeRef.current = Date.now()
      setState('recording')
      setDuration(0)

      // Update duration every 100ms
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 100)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone'
      setError(message)
      setState('idle')
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
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
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000)

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop())

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
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add useVoiceRecorder hook for audio capture"
```

---

## Task 6: Voice Recorder Component

**Files:**
- Create: `src/components/VoiceRecorder.tsx`

**Step 1: Create the component**

Create `src/components/VoiceRecorder.tsx`:
```tsx
import { useState } from 'react'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import type { RecordingResult } from '../types'

interface VoiceRecorderProps {
  onRecordingComplete: (result: RecordingResult) => void
}

export function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const { state, duration, error, startRecording, stopRecording } = useVoiceRecorder()
  const [lastRecording, setLastRecording] = useState<RecordingResult | null>(null)

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleToggleRecording = async () => {
    if (state === 'recording') {
      const result = await stopRecording()
      if (result) {
        setLastRecording(result)
        onRecordingComplete(result)
      }
    } else {
      setLastRecording(null)
      await startRecording()
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-full max-w-md">
          {error}
        </div>
      )}

      {/* Duration display */}
      <div className="text-4xl font-mono tabular-nums">
        {formatDuration(duration)}
      </div>

      {/* Record button */}
      <button
        onClick={handleToggleRecording}
        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
          state === 'recording'
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
      >
        {state === 'recording' ? (
          <div className="w-8 h-8 bg-white rounded" />
        ) : (
          <div className="w-8 h-8 bg-white rounded-full" />
        )}
      </button>

      {/* Status text */}
      <div className="text-gray-600">
        {state === 'idle' && 'Tap to record'}
        {state === 'recording' && 'Recording... tap to stop'}
        {state === 'stopped' && lastRecording && `Recorded ${formatDuration(lastRecording.duration)}`}
      </div>

      {/* Playback for last recording */}
      {lastRecording && state === 'stopped' && (
        <audio
          controls
          src={URL.createObjectURL(lastRecording.blob)}
          className="w-full max-w-md"
        />
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add VoiceRecorder component with record/stop UI"
```

---

## Task 7: Observation Service (Save to Supabase)

**Files:**
- Create: `src/services/observationService.ts`

**Step 1: Create observation service**

Create `src/services/observationService.ts`:
```ts
import { supabase } from '../lib/supabase'

export interface CreateObservationInput {
  rawText: string
  inputMode: 'voice' | 'text'
  audioBlob?: Blob
  transcriptConfidence?: number
  areaType?: 'interior' | 'exterior'
  interiorLevel?: string
  exteriorOrientation?: string
}

export interface Observation {
  observation_id: string
  created_at: string
  input_mode: string
  raw_text: string
  transcript_confidence: number | null
  audio_storage_path: string | null
  processing_status: string
  area_type: string | null
  interior_level: string | null
  exterior_orientation: string | null
}

export async function createObservation(input: CreateObservationInput): Promise<Observation> {
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
  const { data, error } = await supabase
    .from('observations')
    .insert({
      input_mode: input.inputMode,
      raw_text: input.rawText,
      transcript_confidence: input.transcriptConfidence ?? null,
      audio_storage_path: audioStoragePath,
      processing_status: 'ready',
      area_type: input.areaType ?? null,
      interior_level: input.interiorLevel ?? null,
      exterior_orientation: input.exteriorOrientation ?? null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create observation: ${error.message}`)
  }

  return data as Observation
}

export async function listObservations(): Promise<Observation[]> {
  const { data, error } = await supabase
    .from('observations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(`Failed to list observations: ${error.message}`)
  }

  return data as Observation[]
}
```

**Step 2: Create audio storage bucket in Supabase**

1. Go to Supabase Dashboard > Storage
2. Click "New bucket"
3. Name: `audio`
4. Public: No (private)
5. Click "Create bucket"

**Step 3: Set storage policy**

In Supabase Dashboard > Storage > audio bucket > Policies, add:

```sql
-- Allow uploads (Phase 1 - no auth)
create policy "Allow uploads for Phase 1"
on storage.objects for insert
with check (bucket_id = 'audio');

-- Allow reads (Phase 1 - no auth)
create policy "Allow reads for Phase 1"
on storage.objects for select
using (bucket_id = 'audio');
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add observation service with Supabase storage"
```

---

## Task 8: Whisper Transcription (Edge Function)

**Files:**
- Create: `supabase/functions/transcribe/index.ts`

**Step 1: Create Edge Function directory**

Run:
```bash
mkdir -p supabase/functions/transcribe
```

**Step 2: Create transcription Edge Function**

Create `supabase/functions/transcribe/index.ts`:
```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioPath } = await req.json()

    if (!audioPath) {
      return new Response(
        JSON.stringify({ error: 'audioPath is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Download audio from storage
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('audio')
      .download(audioPath)

    if (downloadError) {
      throw new Error(`Failed to download audio: ${downloadError.message}`)
    }

    // Prepare form data for Whisper API
    const formData = new FormData()
    formData.append('file', audioData, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')

    // Call Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    })

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text()
      throw new Error(`Whisper API error: ${errorText}`)
    }

    const result = await whisperResponse.json()

    return new Response(
      JSON.stringify({
        text: result.text,
        confidence: result.segments?.[0]?.avg_logprob
          ? Math.exp(result.segments[0].avg_logprob)
          : null,
        duration: result.duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Step 3: Set OpenAI API key in Supabase**

1. Go to Supabase Dashboard > Settings > Edge Functions
2. Add secret: `OPENAI_API_KEY` = your OpenAI API key

**Step 4: Deploy Edge Function**

Run:
```bash
npx supabase functions deploy transcribe --project-ref YOUR_PROJECT_REF
```

Or deploy via Supabase Dashboard > Edge Functions > Deploy new function.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Whisper transcription Edge Function"
```

---

## Task 9: Transcription Service (Frontend)

**Files:**
- Modify: `src/services/observationService.ts`
- Create: `src/services/transcriptionService.ts`

**Step 1: Create transcription service**

Create `src/services/transcriptionService.ts`:
```ts
import { supabase } from '../lib/supabase'

export interface TranscriptionResult {
  text: string
  confidence: number | null
  duration: number
}

export async function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  const { data, error } = await supabase.functions.invoke('transcribe', {
    body: { audioPath },
  })

  if (error) {
    throw new Error(`Transcription failed: ${error.message}`)
  }

  if (data.error) {
    throw new Error(`Transcription failed: ${data.error}`)
  }

  return {
    text: data.text,
    confidence: data.confidence,
    duration: data.duration,
  }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add transcription service for Whisper API"
```

---

## Task 10: Main App Integration

**Files:**
- Modify: `src/App.tsx`

**Step 1: Build the main capture flow**

Replace `src/App.tsx`:
```tsx
import { useState } from 'react'
import { VoiceRecorder } from './components/VoiceRecorder'
import { createObservation, listObservations, type Observation } from './services/observationService'
import { transcribeAudio } from './services/transcriptionService'
import type { RecordingResult } from './types'

type AppState = 'recording' | 'transcribing' | 'review' | 'saved'

function App() {
  const [appState, setAppState] = useState<AppState>('recording')
  const [transcript, setTranscript] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioPath, setAudioPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedObservations, setSavedObservations] = useState<Observation[]>([])

  const handleRecordingComplete = async (result: RecordingResult) => {
    setError(null)
    setAudioBlob(result.blob)
    setAppState('transcribing')

    try {
      // First upload audio to get the path
      const fileName = `recordings/${Date.now()}-${crypto.randomUUID()}.webm`

      const { supabase } = await import('./lib/supabase')
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, result.blob, {
          contentType: result.blob.type,
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      setAudioPath(fileName)

      // Transcribe
      const transcription = await transcribeAudio(fileName)
      setTranscript(transcription.text)
      setAppState('review')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed')
      setAppState('recording')
    }
  }

  const handleSave = async () => {
    if (!transcript || !audioPath) return

    setError(null)

    try {
      await createObservation({
        rawText: transcript,
        inputMode: 'voice',
        transcriptConfidence: 0.9, // TODO: get from Whisper response
      })

      // Refresh list
      const observations = await listObservations()
      setSavedObservations(observations)

      // Reset for next recording
      setTranscript('')
      setAudioBlob(null)
      setAudioPath(null)
      setAppState('saved')

      // Return to recording after brief delay
      setTimeout(() => setAppState('recording'), 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const handleDiscard = () => {
    setTranscript('')
    setAudioBlob(null)
    setAudioPath(null)
    setAppState('recording')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">FloodMentor</h1>
        <p className="text-blue-200 text-sm">Observation Capture</p>
      </header>

      {/* Main content */}
      <main className="p-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {appState === 'recording' && (
          <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
        )}

        {appState === 'transcribing' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="text-gray-600">Transcribing...</p>
          </div>
        )}

        {appState === 'review' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Review Transcript</h2>

            {audioBlob && (
              <audio
                controls
                src={URL.createObjectURL(audioBlob)}
                className="w-full"
              />
            )}

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full h-32 p-3 border rounded-lg"
              placeholder="Transcript will appear here..."
            />

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold"
              >
                Save Observation
              </button>
              <button
                onClick={handleDiscard}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {appState === 'saved' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="text-green-500 text-5xl">✓</div>
            <p className="text-gray-600">Observation saved!</p>
          </div>
        )}

        {/* Recent observations */}
        {savedObservations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Recent Observations</h2>
            <div className="space-y-2">
              {savedObservations.slice(0, 5).map((obs) => (
                <div key={obs.observation_id} className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-600 truncate">{obs.raw_text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(obs.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
```

**Step 2: Test the full flow**

Run:
```bash
npm run dev
```

1. Open browser at `http://localhost:5173`
2. Click record button, speak, click stop
3. Verify transcription appears
4. Click Save
5. Check Supabase Dashboard > Table Editor > observations

Expected: Observation row created with transcript.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: integrate voice recording with transcription and save flow"
```

---

## Task 11: Railway Deployment

**Files:**
- Create: `railway.json`
- Create: `Dockerfile` (optional, Nixpacks should work)

**Step 1: Create Railway project**

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select the FloodMentor repo
5. Railway auto-detects Vite and configures build

**Step 2: Add environment variables in Railway**

In Railway project settings > Variables, add:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Step 3: Configure build settings**

Railway should auto-detect, but verify:
- Build command: `npm run build`
- Start command: `npm run preview -- --host 0.0.0.0 --port $PORT`

Or create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run preview -- --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Step 4: Deploy**

Push to GitHub:
```bash
git add -A
git commit -m "chore: add Railway deployment config"
git push origin main
```

Railway will auto-deploy on push.

**Step 5: Test on mobile**

1. Get Railway URL from dashboard (e.g., `floodmentor-production.up.railway.app`)
2. Open URL on mobile device
3. Test full flow: record → transcribe → save

**Step 6: Commit deployment URL to docs**

Add to `docs/plans/2026-02-03-observation-capture-design.md`:
```
## Deployment

- **Railway URL:** https://your-app.up.railway.app
```

```bash
git add -A
git commit -m "docs: add Railway deployment URL"
```

---

## Phase 1 Complete Checklist

- [ ] Vite + React + TypeScript project scaffolded
- [ ] PWA configured with manifest and service worker
- [ ] Supabase client configured
- [ ] Observations table created with RLS
- [ ] Audio storage bucket created
- [ ] Voice recorder hook working
- [ ] Voice recorder UI component
- [ ] Observation service saves to Supabase
- [ ] Whisper Edge Function deployed
- [ ] Transcription service calls Edge Function
- [ ] Full flow integrated in App.tsx
- [ ] Deployed to Railway
- [ ] Tested on real mobile device

---

## Next: Phase 2

After Phase 1 is complete, Phase 2 adds:
- Guided flow UI (location steps)
- Claude fact extraction
- Review/edit extracted fields
- Processing status indicators

See design doc for full Phase 2 scope.
