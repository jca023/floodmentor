# FloodMentor

Voice-first flood damage documentation app for insurance adjusters.

## Live URL

**Production:** https://floodmentor-production.up.railway.app

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Animations:** Framer Motion
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Railway (Docker)
- **Voice:** MediaRecorder API (real microphone access)

## Features

- **Voice Recording:** Large touch-friendly record button with waveform animation
- **Location Context:** Guided 2-step flow (Interior/Exterior → Level/Orientation)
- **Fact Extraction:** Simulated extraction of flood line height, evidence type, water source
- **Observation History:** Recent observations with status badges
- **Mobile-First:** Safe areas, touch targets, responsive design

## Local Development

```bash
npm install
npm run dev
```

Runs on http://localhost:3000

## Environment Variables

Create `.env` file:
```
VITE_SUPABASE_URL=https://uukgjupamzlmjhaoussx.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Without these, app runs in **Demo Mode** (data stored in memory).

## Database Schema

Table: `observations`
- `observation_id` (UUID, PK)
- `created_at` (timestamp)
- `input_mode` ('voice' | 'text')
- `raw_text` (transcript)
- `processing_status` ('recording' | 'transcribing' | 'extracting' | 'ready' | 'synced' | 'failed')
- `context` (JSONB - area type, level, orientation)
- `extracted` (JSONB - flood line, evidence, water source)

## Project Structure

```
src/
├── components/
│   ├── VoiceRecorder.tsx      # Recording UI with waveform
│   ├── LocationSelector.tsx    # 2-step location picker
│   ├── ExtractionCards.tsx     # Animated fact cards
│   └── ObservationList.tsx     # Recent observations
├── hooks/
│   └── useVoiceRecorder.ts     # MediaRecorder hook
├── services/
│   └── observationService.ts   # CRUD operations
├── lib/
│   └── supabase.ts             # Supabase client + demo mode
├── types/
│   └── index.ts                # TypeScript definitions
└── App.tsx                     # Main app with state machine
```

## Session Notes (2026-02-07)

### Completed This Session
1. Set up Railway deployment with GitHub integration
2. Fixed healthcheck failure (PORT env variable)
3. Created Supabase database with observations table
4. Configured Railway environment variables via CLI
5. Set up global credentials system for future projects
6. Token stored in `~/.claude/credentials/services.env`

### Global Automation Setup
Claude can now automatically provision databases and deployments:
- **Supabase:** CLI authenticated, org ID stored
- **Railway:** API token stored, CLI working
- **Config:** `~/.claude/credentials/services.env`

### Next Steps (Future Sessions)
- [ ] Integrate real Whisper API for transcription
- [ ] Integrate Claude API for fact extraction
- [ ] Add photo capture alongside voice
- [ ] Implement offline queue with sync
- [ ] Add user authentication
- [ ] Create video marketing content
