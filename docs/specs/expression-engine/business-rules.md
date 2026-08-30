# Business Rules — Expression Engine

## Validation Rules

| ID | Field | Rule | Error Message |
|----|-------|------|---------------|
| VR-EX-001 | expression | Must be parseable | "Invalid expression syntax" |
| VR-EX-002 | variables | Must exist in context | "Undefined variable: {{name}}" |
| VR-EX-003 | operators | Valid for operand types | "Invalid operation for type" |

## Permission Rules

| ID | Action | Role | Condition |
|----|--------|------|-----------|
| PR-EX-001 | use expressions | System | — |
| PR-EX-002 | write expressions | Administrator | In template configuration |

## State Transition Rules

| ID | From | To | Condition |
|----|------|----|-----------|
| ST-EX-001 | Raw expression | Parsed AST | Parse successful |
| ST-EX-002 | Parsed AST | Evaluated result | Evaluate with context |

## Business Constraints

| ID | Constraint | Severity |
|----|-----------|----------|
| BC-EX-001 | Expressions must be parseable | CRITICAL |
| BC-EX-002 | Division by zero returns null | HIGH |
| BC-EX-003 | Undefined variables return null | HIGH |
| BC-EX-004 | Expression depth limited to 100 | MEDIUM |

## Side Effects

| ID | Action | Side Effect |
|----|--------|-------------|
| SE-EX-001 | Evaluate expression | Returns computed value |
| SE-EX-002 | Parse invalid expression | Returns error |
