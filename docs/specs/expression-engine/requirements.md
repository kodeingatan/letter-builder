# Requirements — Expression Engine

## Problem

Document templates need dynamic content based on data values. There is no standardized way to evaluate mathematical expressions, string operations, or conditional logic within templates.

## Objective

Provide an expression engine that parses and evaluates mathematical, string, and conditional expressions with variable resolution, used for template bindings, conditions, and computed values.

## Actors

| Actor | Role |
|-------|------|
| System | Evaluates expressions during rendering |
| Administrator | Writes expressions in template configuration |

## User Stories

### US-001: Evaluate Mathematical Expressions

**Given** a template has a binding expression like `{{harga}} * {{jumlah}}`
**When** the expression is evaluated
**Then** the result is computed correctly

**Acceptance Criteria:**
- [ ] Supports +, -, *, / operators
- [ ] Supports parentheses for precedence
- [ ] Supports numeric variables
- [ ] Returns numeric result

### US-002: Evaluate String Expressions

**Given** a template has a string expression like `{{nama_depan}} + " " + {{nama_belakang}}`
**When** the expression is evaluated
**Then** the string is concatenated correctly

**Acceptance Criteria:**
- [ ] Supports string concatenation
- [ ] Supports string variables
- [ ] Returns string result

### US-003: Evaluate Conditional Expressions

**Given** a template has a condition like `{{status}} == "active"`
**When** the expression is evaluated
**Then** the boolean result is returned

**Acceptance Criteria:**
- [ ] Supports ==, !=, >, <, >=, <= operators
- [ ] Supports &&, || logical operators
- [ ] Supports ! (not) operator
- [ ] Returns boolean result

### US-004: Resolve Variables

**Given** an expression references variables like `{{nama}}`
**When** variables are resolved
**Then** values are substituted from the data context

**Acceptance Criteria:**
- [ ] Variables use `{{variable}}` syntax
- [ ] Nested object access: `{{pegawai.nama}}`
- [ ] Undefined variables return null/empty

### US-005: Format Output

**Given** a numeric result like 1234567
**When** formatted for display
**Then** it shows "1,234,567" (locale-aware)

**Acceptance Criteria:**
- [ ] Number formatting with thousand separators
- [ ] Currency formatting
- [ ] Date formatting
- [ ] Configurable format strings

## Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-EX-001 | System shall parse and evaluate mathematical expressions | Must |
| REQ-EX-002 | System shall parse and evaluate string expressions | Must |
| REQ-EX-003 | System shall parse and evaluate conditional expressions | Must |
| REQ-EX-004 | System shall resolve variables from data context | Must |
| REQ-EX-005 | System shall support output formatting | Should |
| REQ-EX-006 | System shall handle undefined variables gracefully | Must |
| REQ-EX-007 | System shall provide expression validation | Should |

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-EX-001 | Expression evaluation | < 10ms |
| NFR-EX-EX-002 | Variable resolution | < 5ms |
| NFR-EX-EX-003 | Validation response | < 100ms |

## Constraints

- Expressions must be parseable in linear time
- Division by zero must return null, not error
- Undefined variables return null
- Expression depth limited to 100 levels

## Edge Cases

- Division by zero
- Null variable values
- Deeply nested expressions
- Very large numbers
- Special characters in strings

## Dependencies

- Template (for binding expressions)
- Component (for requirement expressions)
- Administration (for step conditions)
