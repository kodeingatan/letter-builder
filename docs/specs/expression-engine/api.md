# API — Expression Engine

## Endpoints

### POST /api/expressions/validate

**Description:** Validate an expression string

**Request Body:**
```json
{
  "expression": "{{harga}} * {{jumlah}} > 1000000"
}
```

**Response:**
```json
{
  "data": {
    "valid": true,
    "type": "boolean",
    "variables": ["harga", "jumlah"]
  }
}
```

### POST /api/expressions/evaluate

**Description:** Evaluate an expression with given context

**Request Body:**
```json
{
  "expression": "{{harga}} * {{jumlah}}",
  "context": {
    "harga": 50000,
    "jumlah": 10
  }
}
```

**Response:**
```json
{
  "data": {
    "result": 500000,
    "type": "number"
  }
}
```

### POST /api/expressions/resolve

**Description:** Resolve all dynamic tokens in content

**Request Body:**
```json
{
  "content": "Harga: {{harga}}, Jumlah: {{jumlah}}",
  "context": {
    "harga": "Rp 50.000",
    "jumlah": "10"
  }
}
```

**Response:**
```json
{
  "data": {
    "content": "Harga: Rp 50.000, Jumlah: 10"
  }
}
```

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_EXPRESSION | Syntax error |
| 400 | UNDEFINED_VARIABLE | Variable not in context |
| 400 | TYPE_ERROR | Invalid operation for type |
| 500 | INTERNAL_ERROR | Server error |
