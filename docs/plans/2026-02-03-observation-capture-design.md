# Observation Capture System Design

**Date:** 2026-02-03
**Status:** Approved
**Purpose:** Voice-first observation capture for flood adjusters with AI-powered fact extraction

---

## Overview

A Progressive Web App (PWA) that lets adjusters capture flood observations via voice (primary) or text, with AI-powered fact extraction. Works offline, syncs when connected.

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Input method | Voice-primary, text for editing | Hands-free critical when climbing through damaged buildings |
| Platform | Mobile browser (PWA) | Works on any device, no app store approval, easy updates |
| User experience | Hybrid (guided → free form) | Training wheels for new users, efficiency for experienced |
| AI processing | Cloud LLM with offline queue | Best accuracy when online, field reliability when offline |
| Speech-to-text | Cloud (Whisper) + browser fallback | Quality when connected, resilience when not |
| Deployment | Railway | Container-based, good for full-stack apps |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PWA (React + TypeScript)             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Voice Input │  │ Text Input  │  │ Offline Queue   │  │
│  │ (Recording) │  │ (Edit/Add)  │  │ (IndexedDB)     │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
└─────────┼────────────────┼──────────────────┼───────────┘
          │                │                  │
          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                   Supabase Backend                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Transcribe  │  │ Extract     │  │ PostgreSQL      │  │
│  │ (Whisper)   │  │ (Claude)    │  │ (Your Schema)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Components

- **PWA shell** - Installable, works offline, service worker caches app
- **Voice recorder** - Captures audio, shows waveform, handles permissions
- **Offline queue** - IndexedDB stores recordings + pending observations when offline
- **Supabase Edge Functions** - Orchestrates transcription → extraction → storage
- **PostgreSQL** - Existing FloodMentor schema (Observation, Inspection, etc.)

---

## User Flows

### Guided Mode (New Users)

Step-by-step flow for adjusters learning the system:

**Step 1: Location**
- Screen shows: "Where are you?" with large tap targets
- Options: `Exterior` / `Interior`
- If Interior: follow-up for `Level` (basement, 1st floor, 2nd floor, attic)
- If Exterior: follow-up for `Orientation` (front, rear, left side, right side)

**Step 2: Voice Capture**
- Screen shows: "Describe what you see" with large record button
- Prompt hints: "flood line height, evidence type (silt, debris, watermark), any visible damage"
- Adjuster taps to record, speaks, taps to stop
- Waveform shows during recording, playback available after

**Step 3: Review Extracted Facts**
- Screen shows transcript + extracted fields in editable cards:
  - `Flood line height: 19 inches` ✏️
  - `Evidence type: watermark, silt line` ✏️
  - `Area context: front porch, exterior wall` ✏️
- Adjuster taps any field to correct via text or re-record
- "Add photo" button to attach visual evidence

**Step 4: Save**
- Tap "Save Observation" → stored locally + queued for sync
- Returns to inspection overview showing all observations captured

**Progression:** After ~10 saved observations, app offers: "You're getting the hang of this. Want to try free-form mode?"

### Free Form Mode (Experienced Users)

Streamlined capture for power users:

**Single Screen Capture**
- Large record button dominates screen
- Small location chips at top (tap to set: `Exterior` `Front`)
- Adjuster speaks everything at once:
  - "Exterior front, flood line 22 inches on the brick, clear silt line and debris mat at the foundation. Interior first floor, watermark at 18 inches on drywall, mud residue on baseboards."

**Real-time Transcript**
- Live transcript appears as they speak (browser API for preview)
- Final cloud transcript replaces it after processing

**Batch Extraction**
- AI parses full transcript and creates multiple observation cards:
  ```
  ▼ Observation 1: Exterior Front
    Flood line: 22 inches
    Evidence: silt line, debris mat
    Surface: brick, foundation

  ▼ Observation 2: Interior 1st Floor
    Flood line: 18 inches
    Evidence: watermark, mud residue
    Surface: drywall, baseboards
  ```

**Quick Edit & Save**
- Tap any card to expand and edit
- "Save All" commits everything at once
- Individual cards can be deleted if extraction erred

**Mode Toggle:** Settings lets users switch back to guided mode anytime.

---

## Offline Behavior

### Detection
- Service worker monitors connection state
- UI shows subtle indicator: `Online ✓` or `Offline - will sync later`

### Recording Offline
- Audio recording works normally (all local)
- Browser's Web Speech API provides instant transcript preview
- Observation saved to IndexedDB with status `pending_transcription`

### Local Queue
IndexedDB stores:
- Raw audio blob (compressed)
- Browser transcript (temporary)
- User-entered location data
- Timestamp, inspection ID

Queue badge shows count: `3 pending`

### When Connection Returns
Service worker detects connectivity and processes queue:
1. Upload audio → cloud transcription (Whisper)
2. Cloud transcript replaces browser transcript
3. Send to LLM for fact extraction
4. Update observation with extracted facts
5. Sync to PostgreSQL

User notified: "3 observations synced"

### Conflict Handling
- If user edited browser transcript while offline, keep their edits
- LLM extraction uses edited transcript, not raw cloud transcription
- Last-write-wins for field-level conflicts (rare edge case)

### Storage Limits
- Warn at 50MB queued audio: "Running low on offline storage"
- Audio purged after successful sync

---

## Technical Stack

### Frontend (PWA)
- **React 18 + TypeScript** - Component architecture, strict typing
- **Vite** - Fast builds, good PWA plugin support
- **Tailwind CSS** - Utility-first, mobile-responsive
- **Workbox** - Service worker for offline caching and background sync
- **Dexie.js** - IndexedDB wrapper for local queue

### Backend (Supabase)
- **PostgreSQL** - Existing FloodMentor schema, Row Level Security
- **Edge Functions (Deno)** - Orchestration for transcription → extraction
- **Supabase Auth** - Adjuster login (email/password, SSO later)
- **Supabase Storage** - Audio files and photos

### External Services
- **OpenAI Whisper API** - Primary transcription ($0.006/minute)
- **Claude API** - Fact extraction from transcripts

### Deployment
- **Railway** - Container-based hosting for PWA static files and any API routes

### Data Flow (Online)
```
Record audio
    ↓
Upload to Supabase Storage
    ↓
Edge Function triggered
    ↓
Whisper API → transcript
    ↓
Claude API → extracted facts (JSON)
    ↓
Insert Observation row
    ↓
Real-time subscription updates UI
```

### Schema Addition
Add processing status to Observation:
- `processing_status`: `recording` → `transcribing` → `extracting` → `ready` → `synced`

---

## Fact Extraction

### Input
```json
{
  "transcript": "Exterior front, flood line 22 inches on the brick,
                 clear silt line and debris mat at the foundation.",
  "location": { "position": "exterior", "orientation": "front" },
  "inspection_id": "insp_abc123"
}
```

### Output
```json
{
  "observations": [
    {
      "flood_line_height_inches": 22,
      "evidence_types": ["silt_line", "debris_mat"],
      "surfaces": ["brick", "foundation"],
      "area_context": "exterior front wall",
      "water_source_hint": null,
      "confidence": "high",
      "extraction_notes": null
    }
  ],
  "clarification_needed": null
}
```

### Prompt Strategy
- System prompt defines schema fields and valid enum values
- Few-shot examples show good extractions
- Explicit instruction: "If a value isn't mentioned, return null. Do not infer or guess."
- Returns `clarification_needed` when transcript is ambiguous

### Handling Ambiguity
- If `clarification_needed` is set, UI shows quick follow-up question
- User answers via tap (multiple choice) or short voice reply
- Re-run extraction with clarification appended

### Validation
- Response validated against JSON schema before saving
- Invalid responses logged and flagged for manual review
- Fallback: save transcript only, mark `processing_status: extraction_failed`

---

## Error Handling

| Scenario | Response |
|----------|----------|
| **Microphone denied** | Show explanation, link to settings, fallback to text-only mode |
| **Transcription fails** | Retry once, then use browser transcript with `transcription_source: browser_fallback` |
| **Extraction fails** | Save transcript only, show empty form for manual entry, retry hourly |
| **Audio too short** | "Recording too short. Tap and hold to record." |
| **Audio too long** | Auto-stop at 5 minutes, split into chunks |
| **Storage full** | Warn at 80%, block at 95%, prompt sync or delete |
| **Sync conflict** | Keep both versions, flag for manual merge |
| **Session timeout** | Complete recording locally, prompt re-login before sync |

---

## Testing Strategy

### Unit Tests (Vitest)
- Fact extraction response parsing and validation
- Offline queue operations (add, retrieve, delete)
- Audio compression and chunk splitting
- Location state machine (guided mode flow)

### Component Tests (React Testing Library)
- Voice recorder: permission states, recording states, playback
- Observation card: display, edit mode, validation
- Offline indicator: state changes, queue count badge
- Guided flow: step progression, back navigation

### Integration Tests (Playwright)
- Full guided flow: location → record → review → save
- Free form flow: record → batch extraction → edit → save
- Offline simulation: record offline → come online → verify sync
- Error recovery: failed transcription → fallback → manual edit

### E2E Tests (Real Devices)
- iOS Safari and Android Chrome
- Web Speech API fallback verification
- Poor network (throttled connection)
- Battery and storage impact

### LLM Extraction Tests
- Golden dataset: 50+ real transcript examples with expected extractions
- Compare outputs against extraction prompt
- Track accuracy metrics over time
- Flag regressions before deploying prompt changes

---

## Implementation Phases

### Phase 1: Walking Skeleton
- Basic PWA shell with Vite + React + Tailwind
- Single-screen voice recorder (no extraction yet)
- Supabase project setup with Observation table
- Upload audio → store transcript → save to DB
- Deploy to Railway for real device testing

### Phase 2: Guided Flow + Extraction
- Location step UI (guided mode)
- Whisper integration via Edge Function
- Claude extraction with basic prompt
- Review/edit screen with extracted fields
- Processing status indicators

### Phase 3: Free Form + Offline
- Free form mode with batch extraction
- IndexedDB queue with Dexie.js
- Service worker with Workbox
- Background sync when online
- Browser Speech API fallback

### Phase 4: Polish + Testing
- Error handling for all failure modes
- Mode toggle (guided ↔ free form)
- Extraction prompt refinement with test cases
- Playwright E2E tests
- Real device testing and bug fixes

---

## Open Questions for Implementation

1. **Whisper vs alternatives** - Deepgram or AssemblyAI may have better latency/pricing. Worth testing.
2. **Photo capture** - Integrate camera capture in Phase 2 or defer to Phase 4?
3. **Multi-adjuster sync** - If two adjusters work the same inspection, how do we merge? (Likely Phase 5+)
4. **Policy pack reference** - Source FEMA SFIP PDF for citation engine. Parsing needed.

---

## References

- [Flood Event Verification Flow](../flood_event_verification_flow.md)
- [FloodMentor Schema](../floodmentor.schema.json)
- [FEMA Standard Flood Insurance Policy (Oct 2021)](https://www.fema.gov/sites/default/files/documents/fema_F-122-Dwelling-SFIP_2021.pdf)
