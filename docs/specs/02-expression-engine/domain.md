# Domain — Expression Engine

## Entities

### Expression

**Definition:** A string representation of a computation that can be parsed and evaluated.

**Types:**
| Type | Example | Result |
|------|---------|--------|
| Mathematical | `{{harga}} * {{jumlah}}` | number |
| String | `{{nama_depan}} + " " + {{nama_belakang}}` | string |
| Conditional | `{{status}} == "active"` | boolean |
| Mixed | `{{harga}} * {{jumlah}} > 1000000` | boolean |

### Token

**Definition:** A lexical unit in an expression.

**Types:**
| Type | Example | Description |
|------|---------|-------------|
| Number | `123`, `3.14` | Numeric literal |
| String | `"hello"` | String literal |
| Variable | `nama`, `pegawai.nama` | Variable reference |
| Operator | `+`, `-`, `*`, `/` | Mathematical operator |
| Comparison | `==`, `!=`, `>`, `<` | Comparison operator |
| Logical | `&&`, `\|\|`, `!` | Logical operator |
| Parenthesis | `(`, `)` | Grouping |
| Function | `formatDate()` | Function call |

### AST (Abstract Syntax Tree)

**Definition:** Parsed representation of an expression.

**Node Types:**
| Type | Description |
|------|-------------|
| Literal | Number or string constant |
| Variable | Variable reference |
| BinaryOp | Two operands + operator |
| UnaryOp | One operand + operator |
| FunctionCall | Function name + arguments |
| Conditional | Condition + true/false branches |

### ExpressionContext

**Definition:** Data context for variable resolution.

**Attributes:**
| Attribute | Type | Description |
|-----------|------|-------------|
| variables | Map<string, any> | Variable name → value |
| parent | ExpressionContext | Parent context (for nesting) |

## Relationships

```
Expression ──parse──▶ Token[]
Token[] ──build──▶ AST
AST ──evaluate──▶ Result
```

## Invariants

- Expression must be parseable without error
- Variable resolution must be deterministic
- Evaluation must not have side effects
- Result type must match expression type
