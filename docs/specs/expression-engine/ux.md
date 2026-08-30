# UX — Expression Engine

## User Flow

### Write Expression

```
Click expression field
    │
    ├── Type expression: {{harga}} * {{jumlah}}
    │
    ├── Variable picker opens on {{
    │       │
    │       ├── Search/select variable
    │       │
    │       └── Variable inserted
    │
    ├── Expression validated in real-time
    │       │
    │       ├── Green check = valid
    │       └── Red X = invalid with error
    │
    ▼
Save → Expression stored
```

### Use Variable Picker

```
Type {{ in expression editor
    │
    ▼
Variable picker opens
    │
    ├── Search variables
    ├── Select variable
    │
    ▼
Variable inserted: {{pegawai.nama}}
```

### Real-time Validation

```
Type expression
    │
    ├── System validates syntax
    ├── System resolves variables
    ├── System determines result type
    │
    ▼
Feedback shown below editor
```

## Feedback

| Action | Feedback Type | Description |
|--------|--------------|-------------|
| Valid expression | Green check | "Valid expression" |
| Invalid syntax | Red X | "Syntax error at position N" |
| Undefined variable | Yellow warning | "Variable not found" |
| Type error | Red X | "Cannot divide string by number" |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| {{ | Open variable picker |
| @ | Open variable picker |
| Tab | Accept suggestion |
| Escape | Close picker |
| Enter | Evaluate expression |
