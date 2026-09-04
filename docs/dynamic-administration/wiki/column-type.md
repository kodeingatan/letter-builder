# Column Type = Behavior Data

Setiap column memiliki **type**.

Type bukan hanya menentukan jenis data, tetapi juga menentukan bagaimana data tersebut:

1. disimpan,
2. diinput,
3. ditampilkan,
4. divalidasi,
5. diformat,
6. dicari,
7. diurutkan.

Contoh:

```text
text
   ↓
Text Input
```

```text
richtext
   ↓
Rich Text Editor
```

```text
date
   ↓
Date Picker
   ↓
Format Display
```

```text
select
   ↓
Select
   ↓
Options
```

```text
select-table-relation
   ↓
Relation Selector
   ↓
Global Table
```

```text
number + currency
   ↓
Number Input
   ↓
Currency Formatter
```

Dengan demikian:

```text
Column Type
    ↓
Data Behavior
    ↓
Input Component
    ↓
Display Component
    ↓
Validation
    ↓
Search / Order behavior
```

## Related Concepts

- [[global-table]] — column adalah bagian dari Global Table
- [[computed-field]] — operation column sebagai computed data
- [[expression-engine]] — engine untuk evaluasi ekspresi
- [[crud-generated-table]] — UI yang dihasilkan dari column definition
