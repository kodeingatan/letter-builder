# Use Cases

## UC-001: Define a Data Collection

**Actor:** Administrator

**Flow:**
1. Administrator navigates to Collections
2. Creates a new Global Table (e.g., "Pegawai")
3. Adds fields: nama (text), nip (text), jabatan (relation), tanggal_lahir (date), foto (image), status (select)
4. Configures field properties (required, searchable, orderable)
5. Publishes the collection
6. System automatically provides CRUD operations for the collection

## UC-002: Create a Reusable Document Component

**Actor:** Administrator

**Flow:**
1. Administrator navigates to Components
2. Creates a new component (e.g., "Identitas Pegawai")
3. Defines data requirements: nama (text), nip (text), jabatan (text)
4. Writes component content using rich text editor with dynamic tokens
5. Publishes the component
6. Component is now available for use in any template

## UC-003: Build a Document Template

**Actor:** Administrator

**Flow:**
1. Administrator navigates to Templates
2. Creates a new template (e.g., "Surat Keputusan")
3. Opens the template editor (Document Composition Canvas)
4. Inserts static text (heading, paragraphs)
5. Inserts reusable components from the component library
6. Connects component data requirements to data sources
7. Configures looping for collection components
8. Configures conditions for conditional rendering
9. Publishes the template

## UC-004: Create a Document via Administration Workflow

**Actor:** Staff

**Flow:**
1. Staff selects an Administration (e.g., "Surat Keputusan Pengangkatan")
2. System presents Step 1: fill in letter metadata (number, date, subject)
3. Staff completes Step 1, proceeds to Step 2
4. Step 2: select employees from Global Table "Pegawai"
5. Staff selects employees, proceeds to Step 3
6. Step 3: fill in decision details
7. Staff completes all steps
8. System resolves data bindings, components, loops, conditions
9. System renders final document (HTML preview)
10. Staff generates PDF

## UC-005: Manage Document Versions

**Actor:** Administrator

**Flow:**
1. Administrator opens a published template
2. Makes changes to the template structure
3. Saves as new version (v2)
4. Existing documents remain on v1
5. New documents use v2
6. Administrator can view version history, compare versions, restore previous versions
