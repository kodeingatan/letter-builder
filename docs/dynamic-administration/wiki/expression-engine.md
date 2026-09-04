# Expression Engine

Karena operation akan digunakan di banyak tempat, sebaiknya dibuat satu konsep:

> **Expression Engine**

Engine ini menangani:

```text
+
-
*
/
++
"string"
```

dan nantinya bisa dikembangkan menjadi:

```text
IF
ELSE
ROUND
SUM
COUNT
MIN
MAX
DATE_FORMAT
CONCAT
```

Contoh:

```text
{{harga}} * {{jumlah}}
```

atau:

```text
{{nama}} ++ " - " ++ {{jabatan}}
```

Dengan begitu expression tidak hanya digunakan Global Table.

Nantinya bisa digunakan juga oleh:

* Component
* Template
* Conditional rendering
* Computed field
* Document generation

Ini akan membuat sistem jauh lebih konsisten.

## Related Concepts

- [[computed-field]] — computed field menggunakan expression engine
- [[unified-data-language]] — satu bahasa data untuk seluruh sistem
- [[global-table]] — expression dapat digunakan di column definition
- [[data-binding]] — binding menggunakan expression
- [[template]] — template menggunakan expression untuk conditional/looping
