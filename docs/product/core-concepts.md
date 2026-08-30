# Core Concepts

This document defines the fundamental concepts that form the foundation of the Persuratan platform. These concepts are stable and framework-independent.

---

## 1. Global Table

**Definition:** A metadata-driven data structure that defines how data is stored, input, displayed, validated, searched, and ordered.

**Purpose:** Enable users to create data collections without developer intervention.

**Attributes:**
- Name (unique identifier)
- Display Name (human-readable)
- Status (draft, published, archived)
- Columns (ordered list of field definitions)
- Created/Updated timestamps

**Relationships:**
- Has many Columns
- Referenced by Components (via data requirements)
- Referenced by Workflows (via data sources)

**Lifecycle:**
```
Draft → Published → Archived
```

**Constraints:**
- Name must be unique
- At least one column required
- Published tables cannot have columns removed if data exists

---

## 2. Column (Field)

**Definition:** A field definition within a Global Table that specifies data type, behavior, and UI rendering.

**Purpose:** Define the structure and behavior of individual data fields.

**Attributes:**
- Name (unique within table)
- Display Name
- Type (text, number, date, image, select, richtext, relation, computed)
- Required (boolean)
- Searchable (boolean)
- Orderable (boolean)
- Default Value
- Format (for date/number types)
- Options (for select types)
- Relation Config (for relation types)
- Expression (for computed types)
- Order (position within table)

**Types and Behaviors:**
| Type | Input | Display | Storage |
|------|-------|---------|---------|
| text | Text input | Plain text | String |
| number | Number input | Formatted number | Number |
| date | Date picker | Formatted date | ISO date |
| image | File upload | Image preview | File reference |
| select | Dropdown | Badge/label | String |
| richtext | Rich text editor | Rendered HTML | JSON/HTML |
| relation | Relation selector | Related record display | Foreign key |
| computed | Readonly/hidden | Calculated value | Calculated |

**Lifecycle:**
- Created with table
- Can be reordered
- Can be modified (with caution if data exists)
- Cannot be deleted if data exists

---

## 3. Component

**Definition:** A reusable document block that defines content structure and data requirements without containing actual data.

**Purpose:** Enable document block reuse across multiple templates.

**Attributes:**
- Name
- Status (draft, published, archived)
- Version
- Content (rich text with dynamic tokens)
- Data Requirements (list of required fields)
- Rendering Mode (single or collection/loop)

**Key Principle:** Components do NOT contain data. They declare what data they need. Templates supply the data.

**Relationships:**
- Has many Data Requirements
- Used by many Templates (via template-component references)
- Data Requirements reference Column types

**Lifecycle:**
```
Draft → Published → Archived
Versioned: v1 → v2 → v3
```

**Constraints:**
- Name must be unique
- At least one data requirement if content uses dynamic tokens
- Published component changes create new version

---

## 4. Data Requirement

**Definition:** A contract between a Component and its data source, specifying what data the component needs.

**Purpose:** Decouple component content from data sources, enabling reuse.

**Attributes:**
- Name (matches token in component content)
- Type (text, number, date, image, etc.)
- Required (boolean)
- Source (determined at template binding time)

**Relationships:**
- Belongs to a Component
- Bound to a data source in Template context

**Key Principle:** Data Requirements are the interface. Templates implement the interface by providing data bindings.

---

## 5. Template

**Definition:** A document blueprint that assembles static content, components, dynamic data, conditions, and loops into a composable document structure.

**Purpose:** Define document structure without hardcoding data.

**Attributes:**
- Name
- Status (draft, published, archived)
- Version
- Content (Tiptap document model with custom nodes)
- Component References (embedded component blocks)
- Data Bindings (connections between requirements and sources)
- Loop Configurations
- Condition Configurations

**Relationships:**
- References many Components
- Has many Data Bindings
- Used by many Workflows
- Generates many Documents

**Lifecycle:**
```
Draft → Published → Archived
Versioned: v1 → v2 → v3
```

**Content Model (Tiptap Custom Nodes):**
- Text (static)
- DynamicText (variable reference)
- DynamicImage (image reference)
- Component (reusable block reference)
- Loop (repeat block)
- Condition (conditional block)
- PageBreak
- Table

---

## 6. Data Binding

**Definition:** A connection between a Component's data requirement and a data source within a Template context.

**Purpose:** Resolve component data requirements to actual data at runtime.

**Attributes:**
- Requirement Name (from component)
- Source Type (administration, global-table, manual, expression, system)
- Source Reference (table name, field path, expression)
- Alias (for loop items)

**Source Types:**
| Source | Example |
|--------|---------|
| administration | `{{step1.nomor_surat}}` |
| global-table | `{{pegawai.nama}}` |
| manual | Static value entered at runtime |
| expression | `{{harga}} * {{jumlah}}` |
| system | `{{current_date}}`, `{{user.name}}` |

---

## 7. Administration (Workflow)

**Definition:** A multi-step data collection process that guides users through document creation by gathering data, selecting templates, and generating documents.

**Purpose:** Standardize and automate document creation workflows.

**Attributes:**
- Name
- Status (draft, published, archived)
- Steps (ordered list)
- Associated Templates (one or more per step)

**Key Principle:** One Administration can use multiple Templates. Each step may reference a different template.

**Relationships:**
- Has many Steps
- Each Step references one Template
- Generates Documents

**Lifecycle:**
```
Draft → Published → Archived
```

---

## 8. Step

**Definition:** A single data gathering stage within an Administration workflow.

**Purpose:** Break document creation into manageable, sequential stages.

**Attributes:**
- Name
- Order (position in workflow)
- Template Reference (template used at this step)
- Data Fields (auto-generated from template requirements)
- Data Source Configuration (where each field gets its data)

**Relationships:**
- Belongs to an Administration
- References one Template
- Contains data field configurations

**Constraints:**
- Steps are ordered sequentially
- Each step must reference a valid template
- Data fields are derived from template's component requirements

---

## 9. Document

**Definition:** A generated output produced by executing an Administration workflow with specific data.

**Purpose:** The final artifact — a filled-in document ready for use.

**Attributes:**
- Title
- Administration Reference
- Template Version (snapshot at generation time)
- Data Snapshot (all data used)
- Rendered Content (HTML)
- Generated File (PDF)
- Status (draft, generated, approved, archived)
- Created By
- Created At

**Relationships:**
- Generated from an Administration
- Uses a specific Template version
- Contains a data snapshot

**Lifecycle:**
```
Generated → Approved → Archived
```

---

## 10. Expression Engine

**Definition:** A computation system that evaluates mathematical and string expressions using field references.

**Purpose:** Enable computed fields and dynamic content across the platform.

**Supported Operations:**
- Arithmetic: `+`, `-`, `*`, `/`
- String concatenation: `++`
- Functions: `IF`, `ELSE`, `ROUND`, `SUM`, `COUNT`, `MIN`, `MAX`, `DATE_FORMAT`, `CONCAT`
- Field references: `{{field_name}}`

**Used By:**
- Computed Columns in Global Tables
- Dynamic text in Components
- Conditional expressions in Templates
- Data transformations in Workflows

---

## Concept Relationships Diagram

```
GLOBAL TABLE
    │
    └── COLUMN
            │
            │ defines structure for
            ▼
COMPONENT
    │
    └── DATA REQUIREMENT
            │
            │ requires data from
            ▼
TEMPLATE
    │
    ├── CONTENT (static + dynamic)
    ├── COMPONENT REFERENCES
    ├── DATA BINDINGS
    ├── LOOPS
    └── CONDITIONS
            │
            │ used by
            ▼
ADMINISTRATION
    │
    └── STEP
            │
            │ generates
            ▼
DOCUMENT
    │
    ├── DATA SNAPSHOT
    ├── TEMPLATE VERSION
    └── RENDERED OUTPUT
```
