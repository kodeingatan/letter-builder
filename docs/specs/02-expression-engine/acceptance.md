# Acceptance Criteria — Expression Engine

## AC-001: Evaluate Mathematical Expression

**Given** an expression `{{harga}} * {{jumlah}}` with harga=50000 and jumlah=10
**When** the expression is evaluated
**Then** the result is 500000

**Mapped to:** REQ-EX-001, US-001

## AC-002: Evaluate String Expression

**Given** an expression `{{nama_depan}} + " " + {{nama_belakang}}`
**When** the expression is evaluated
**Then** the result is the concatenated string

**Mapped to:** REQ-EX-002, US-002

## AC-003: Evaluate Conditional Expression

**Given** an expression `{{status}} == "active"` with status="active"
**When** the expression is evaluated
**Then** the result is true

**Mapped to:** REQ-EX-003, US-003

## AC-004: Resolve Nested Variable

**Given** an expression `{{pegawai.nama}}` with pegawai={nama: "Afdal"}
**When** the variable is resolved
**Then** the value "Afdal" is returned

**Mapped to:** REQ-EX-004, US-004

## AC-005: Handle Undefined Variable

**Given** an expression `{{undefined_var}}`
**When** the variable is resolved
**Then** null is returned without error

**Mapped to:** REQ-EX-006, US-004

## AC-006: Format Number Output

**Given** a result of 1234567
**When** formatted with thousand separators
**Then** the output is "1,234,567"

**Mapped to:** REQ-EX-005, US-005

## Summary

| ID | Criterion | Mapped To | Status |
|----|-----------|-----------|--------|
| AC-001 | Evaluate math expression | REQ-EX-001 | [ ] |
| AC-002 | Evaluate string expression | REQ-EX-002 | [ ] |
| AC-003 | Evaluate conditional expression | REQ-EX-003 | [ ] |
| AC-004 | Resolve nested variable | REQ-EX-004 | [ ] |
| AC-005 | Handle undefined variable | REQ-EX-006 | [ ] |
| AC-006 | Format number output | REQ-EX-005 | [ ] |
