# Requirements — Component

## Problem

Document creation requires repetitive use of common blocks (letterhead, employee info, signature blocks). Without a reusable component system, these blocks are duplicated across templates, leading to inconsistency and maintenance burden.

## Objective

Enable users to create reusable document blocks (Components) that declare data requirements without containing actual data. Components can be inserted into any Template, which supplies the data at runtime.

## Actors

| Actor | Role |
|-------|------|
| Administrator | Creates, edits, publishes Components |
| Template Builder | Uses Components in Templates (same actor, different context) |

## User Stories

### US-001: Create a Component

**As an** Administrator
**I want to** create a reusable document block with a name and rich text content
**So that** I can reuse it across multiple templates

**Acceptance Criteria:**
- [ ] Component has a unique name and display name
- [ ] Content is authored via rich text editor
- [ ] Dynamic tokens {{variable}} can be inserted
- [ ] Component is created in Draft status

### US-002: Define Data Requirements

**As an** Administrator
**I want to** declare what data a Component needs
**So that** Templates know what data to supply

**Acceptance Criteria:**
- [ ] Each requirement has a name and type
- [ ] Requirements are referenced in content via {{name}} tokens
- [ ] Required flag indicates mandatory data
- [ ] Requirements can be added, edited, removed

### US-003: Configure Component Mode

**As an** Administrator
**I want to** set a Component to Single or Collection mode
**So that** it can render once or repeat for each data item

**Acceptance Criteria:**
- [ ] Single mode renders the component once
- [ ] Collection mode repeats the component for each item
- [ ] Collection mode requires a loop configuration
- [ ] Loop configuration specifies the data source

### US-004: Preview Component

**As an** Administrator
**I want to** preview a Component with sample data
**So that** I can verify its appearance before publishing

**Acceptance Criteria:**
- [ ] Preview shows rendered content with sample data
- [ ] Dynamic tokens replaced with placeholder values
- [ ] Loop mode shows multiple sample items

### US-005: Publish Component

**As an** Administrator
**I want to** publish a Component when it's ready
**So that** it becomes available for use in Templates

**Acceptance Criteria:**
- [ ] Published Components appear in Template component picker
- [ ] Publishing creates a version snapshot
- [ ] Editing a published Component creates a new version

## Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-CO-001 | System shall allow creating Components with unique names | Must |
| REQ-CO-002 | System shall provide rich text editor for Component content | Must |
| REQ-CO-003 | System shall support dynamic tokens {{name}} in content | Must |
| REQ-CO-004 | System shall require data requirements for each dynamic token | Must |
| REQ-CO-005 | System shall support Single and Collection rendering modes | Must |
| REQ-CO-006 | System shall version Components on publish | Should |
| REQ-CO-007 | System shall provide preview with sample data | Should |
| REQ-CO-008 | System shall support Component status lifecycle | Must |

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-CO-001 | Component load time | < 300ms |
| NFR-CO-002 | Preview render time | < 500ms |
| NFR-CO-003 | Component picker search | < 200ms |

## Constraints

- Component names must be unique
- Data requirement names must match token names in content
- Published Components cannot have requirements removed (only added)
- Collection-mode Components must have loop configuration

## Edge Cases

- Component with no dynamic tokens (static content only)
- Component with 20+ data requirements
- Component referenced by many Templates (10+)
- Circular component reference (Component A uses Component B which uses A)

## Dependencies

- Tiptap editor (for rich text content)
- Expression Engine (for loop/condition expressions)
- Global Table (for data source in loop mode)
