# Domain — Render Engine

## Entities

### RenderContext

**Definition:** The complete context for rendering a Template.

**Attributes:**
| Attribute | Type | Description |
|-----------|------|-------------|
| template | Template | Source template |
| data | Map<string, any> | Data context for variable resolution |
| components | Map<string, Component> | Published components |
| settings | DocumentSettings | PDF settings |
| depth | number | Current nesting depth |

### RenderResult

**Definition:** Output of the rendering process.

**Attributes:**
| Attribute | Type | Description |
|-----------|------|-------------|
| html | string | Rendered HTML |
| errors | RenderError[] | Any rendering errors |
| warnings | string[] | Non-fatal warnings |

### RenderError

**Definition:** An error encountered during rendering.

**Attributes:**
| Attribute | Type | Description |
|-----------|------|-------------|
| type | enum | component_not_found / binding_missing / loop_error / condition_error |
| message | string | Human-readable error |
| block_id | string | Source block reference |

## Processing Pipeline

```
Template Content
    │
    ▼
┌─────────────────┐
│ Parse Content   │ ← Tiptap document model
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Resolve Tokens  │ ← Variable substitution
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Render Components│ ← Component HTML insertion
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Expand Loops    │ ← Data iteration
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Evaluate Conditions│ ← Show/hide blocks
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Assemble HTML   │ ← Final output
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate PDF    │ ← Puppeteer/Playwright
└─────────────────┘
```

## Invariants

- Rendering must not modify original Template
- Errors must be collected, not thrown
- PDF must match HTML rendering
- Nested depth must not exceed limit
