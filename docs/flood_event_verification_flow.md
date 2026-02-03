# Flood Event Verification Flow
Version: 1.0
Purpose: Provide a defensible, policy-grounded method to confirm a qualifying flood event, classify water source, capture neighborhood corroboration, and safely gate coverage guidance with citations and audit logging.

## Core Principles
- A flood line alone is evidence of water presence, not proof of a qualifying flood event.
- The system must not declare coverage without policy support and citations.
- Unknown / indeterminate is an acceptable intermediate state.
- When on-structure evidence is unclear, area corroboration is permitted and must be documented.

---

## A. Entry Points

### A1. Observation Mode (Voice or Text)
Examples:
- "Exterior front of house, flood line 19 inches off the ground."
- "Basement, flood line 38 inches visible in photos."

System actions:
1) Transcribe voice (if used).
2) Extract structured facts:
   - Interior/exterior, level, orientation, flood line height, evidence type.
3) Create an Observation record (linked to Inspection and Policy Pack version).
4) If water source is not explicitly known, set water_source = "unknown".

---

## B. Flood Event Verification (Qualifying Flood vs Water Presence)

### B1. Determine Water Source Category (Attempt classification)
Goal: classify the source as one of:
- rising_floodwater_outside_in
- surface_water
- overflow_inland_tidal
- mudflow_as_defined
- sewer_backup_flood_related
- sewer_backup_non_flood
- internal_plumbing_discharge
- unknown

System behavior:
- Do not guess. If not supported by facts, keep "unknown".

### B2. Ask Minimal Clarifying Questions (Only what is required)
Ask short fact checks, not long interviews. Examples:
- "Did water enter from outside rising water (outside-in)?"
- "Were streets/yards/ditches flooded nearby?"
- "Do neighboring homes show similar water lines?"
- "Was there a plumbing failure source inside the structure?"
- "Any evidence of flow direction, debris, silt lines, or exterior inundation?"

---

## C. Neighborhood Corroboration Mode

### C1. When to Trigger Corroboration Mode
Trigger when:
- water_source = unknown OR
- flood evidence on the insured structure is not clear OR
- insured structure lacks visible exterior lines but water damage is present

### C2. Corroboration Capture
Allow adjuster to capture:
- Photos of neighboring homes with similar lines
- Photos of street/yard inundation marks
- Photos of drainage/ditch overflow indicators
- Notes describing observed area conditions
- Relation to insured property (adjacent, same street, same block, etc.)

System outputs:
- CorroborationEvidence record linked to the same Inspection.

---

## D. Flood Event Confidence Scoring (Evidence-based, not vibes)

### D1. Confidence Inputs
- On-structure evidence present? (yes/no)
- Corroboration evidence present? (yes/no)
- Consistency of heights/marks across area? (low/medium/high)
- Flow direction indicators? (outside-in/inside-out/unknown)
- Water source classification confidence? (low/medium/high)

### D2. Confidence Levels
- high:
  - on-structure evidence AND corroboration, consistent with outside-in flood indicators
- medium:
  - limited on-structure evidence AND strong corroboration
- low:
  - water damage present but weak corroboration and unclear source
- indeterminate:
  - insufficient or conflicting information

Store confidence with reasons.

---

## E. Policy Grounding and Citation Gate

### E1. Definition Gate
If the system claims the event qualifies as "flood" (or a flood-related category), it must cite:
- policy definition sections relevant to flood causation and the event classification

If it cannot cite:
- respond with "Flood classification not supported by the current policy pack"
- do not proceed to coverage decisions

### E2. Coverage Guidance Gate
Coverage guidance about payable items is allowed only when:
- flood_event_confidence is at least medium OR
- the system has enough policy-defined facts to proceed AND
- all coverage statements are citation-backed

If not:
- system responds:
  - what is known
  - what is needed
  - how to document it
  - "not determined yet"

---

## F. Multi-Agent Verification (A/B/C)

### F1. Agent A: Coverage Analyst
- Uses only the active policy pack
- Produces:
  - event classification (if support exists)
  - coverage guidance (if support exists)
  - citations and excerpts

### F2. Agent B: Independent Reviewer
- Runs independently
- Validates citations and interpretation
- Flags unsupported claims

### F3. Agent C: Arbiter
- Compares A vs B
- Outputs final:
  - verified classification
  - verified guidance
  - confidence score
  - required follow-ups if disagreement or ambiguity

If A/B disagree materially:
- downgrade confidence
- require additional facts
- do not assert coverage unless both support it with citations

---

## G. Output Contract (What the adjuster sees)

Every response must include:
1) Parsed Context
2) Current Flood Event Status
   - source classification + confidence
3) Guidance
   - what to check next
4) Decision Status
   - not determined / covered if conditions met / not found
5) Citations (if any policy claim is made)
6) Follow-up questions (minimal)

---

## H. Audit and Defense Packet Requirements

Every step logs:
- question/observation text
- extracted facts
- water_source classification
- corroboration evidence links
- confidence and reasons
- policy pack version
- citations + excerpts used
- Agent A/B/C outputs

Exports must include:
- event verification summary
- corroboration evidence summary
- policy definitions cited
- policy pack version and timestamps
