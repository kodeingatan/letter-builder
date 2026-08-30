# UI — Administration

## Pages

### Administrations List

**Route:** `/administrations`

**Layout:** Workspace (sidebar + canvas)

### Administration Builder

**Route:** `/administrations/:id`

**Layout:** Three-panel builder

### Administration Instance

**Route:** `/administrations/:id/instances/:instanceId`

## Administration Builder Layout

```
┌──────────────┬──────────────────────────────────┬──────────────┐
│ STEPS        │          PROCESS FLOW            │ PROPERTIES   │
│              │                                  │              │
│ Step 1       │ ┌────────────────────────────┐   │ Step Name    │
│ Step 2       │ │  [ Step 1 ] ──▶ [ Step 2 ]│   │ Template     │
│ Step 3       │ │       └──▶ [ Step 3 ]     │   │ Role         │
│              │ └────────────────────────────┘   │ Condition    │
│              │                                  │ Actions      │
└──────────────┴──────────────────────────────────┴──────────────┘
```

### Left Panel — Steps List

- Ordered step list
- Drag to reorder
- Click to select/edit
- "+" to add step
- Each step shows: order, template name, role

### Center Panel — Process Flow

- Visual flow diagram
- Step boxes connected by arrows
- Click step to edit in properties
- Condition shown as badge
- Visual flow: Draft → Step 1 → Step 2 → Step 3 → Complete

### Right Panel — Step Properties

**When step selected:**
- Step name
- Template picker (search dropdown)
- Role picker (search dropdown)
- Condition expression editor
- Delete step

**When nothing selected:**
- Workflow name
- Display name
- Description

## Instance Tracking

### Instance List

**Route:** `/instances`

```
┌─────────────────────────────────────────────────────┐
│ Workflow Instances                    Filter: [▼ All] │
├─────────────────────────────────────────────────────┤
│ ▸ WF-001  │ Surat Keputusan  │ Step 2/3 │ Waiting   │
│ ▸ WF-002  │ Surat Tugas      │ Step 3/3 │ Complete  │
│ ▸ WF-003  │ Surat Keputusan  │ Step 1/3 │ Rejected  │
└─────────────────────────────────────────────────────┘
```

### Instance Detail

**Route:** `/instances/:instanceId`

```
┌──────────────────────────────────────────────────────┐
│ WF-001: Surat Keputusan                    Status: ▼ │
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐ │
│ │ STEP PROGRESS                                    │ │
│ │                                                  │ │
│ │ [✓ Step 1] ──── [● Step 2] ──── [○ Step 3]     │ │
│ │ Approved      Waiting         Pending            │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ CURRENT STEP: Step 2 - Review Data              │ │
│ │                                                  │ │
│ │ Template: draft_surat                            │ │
│ │ Required Inputs:                                 │ │
│ │   nama  → [ .................. ]                 │ │
│ │   nip   → [ .................. ]                 │ │
│ │                                                  │ │
│ │ [Preview] [Approve] [Reject]                     │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ HISTORY                                          │ │
│ │ 2026-08-30 10:00 - Afdal - Started workflow      │ │
│ │ 2026-08-30 10:05 - Budi - Approved step 1        │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Visual Flow Diagram

The center panel shows a process flow:

```
Start
  │
  ▼
┌────────────────┐
│ Step 1: Draft  │ ← Role: Staff
│ [Template]     │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Step 2: Review │ ← Role: Manager
│ [Template]     │
│ {condition}    │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Step 3: Sign   │ ← Role: Director
│ [Template]     │
└───────┬────────┘
        │
        ▼
     Complete
```

## State Badges

| Status | Badge |
|--------|-------|
| Draft | Gray |
| Published | Blue |
| Running | Yellow pulse |
| Complete | Green |
| Rejected | Red |

## Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop | Three-panel builder |
| Tablet | Two-panel (flow + drawer) |
| Mobile | Full-screen flow, bottom panels |
