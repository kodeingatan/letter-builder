# Business Rules

## Global Table Rules

| ID | Rule | Severity |
|----|------|----------|
| BR-GT-001 | Global Table name must be unique across all tables | CRITICAL |
| BR-GT-002 | A Global Table must have at least one column | CRITICAL |
| BR-GT-003 | Column names must be unique within a table | CRITICAL |
| BR-GT-004 | Published tables with data cannot have columns deleted | HIGH |
| BR-GT-005 | Computed columns must have a valid expression | HIGH |
| BR-GT-006 | Relation columns must reference a valid published table | HIGH |
| BR-GT-007 | Required columns must have a value for every record | MEDIUM |

## Component Rules

| ID | Rule | Severity |
|----|------|----------|
| BR-CO-001 | Component name must be unique | CRITICAL |
| BR-CO-002 | Components cannot contain raw data — only data requirements | CRITICAL |
| BR-CO-003 | Data requirement names must match dynamic tokens in content | HIGH |
| BR-CO-004 | Published components create new versions on edit | HIGH |
| BR-CO-005 | Collection-mode components must have loop configuration | MEDIUM |

## Template Rules

| ID | Rule | Severity |
|----|------|----------|
| BR-TE-001 | Template name must be unique | CRITICAL |
| BR-TE-002 | All component data requirements must be bound | HIGH |
| BR-TE-003 | Loop data sources must reference a valid Global Table | HIGH |
| BR-TE-004 | Condition expressions must use valid field references | HIGH |
| BR-TE-005 | Published templates create new versions on edit | HIGH |

## Administration Rules

| ID | Rule | Severity |
|----|------|----------|
| BR-AD-001 | Administration name must be unique | CRITICAL |
| BR-AD-002 | An Administration must have at least one step | CRITICAL |
| BR-AD-003 | Each step must reference a valid published template | HIGH |
| BR-AD-004 | Step order determines the workflow sequence | HIGH |
| BR-AD-005 | One Administration can use multiple different templates | MEDIUM |

## Document Rules

| ID | Rule | Severity |
|----|------|----------|
| BR-DO-001 | Documents must capture a data snapshot at creation time | HIGH |
| BR-DO-002 | Documents must reference the template version used | HIGH |
| BR-DO-003 | PDF generation must use the same rendering as preview | HIGH |

## Data Integrity Rules

| ID | Rule | Severity |
|----|------|----------|
| BR-DI-001 | Deleting a Global Table used by Components must show dependencies | CRITICAL |
| BR-DI-002 | Deleting a Component used by Templates must show dependencies | CRITICAL |
| BR-DI-003 | Deleting a Template used by Workflows must show dependencies | CRITICAL |
| BR-DI-004 | Archived resources cannot be used in new documents | HIGH |

## Versioning Rules

| ID | Rule | Severity |
|----|------|----------|
| BR-VE-001 | Templates and Components support version history | MEDIUM |
| BR-VE-002 | Existing documents retain reference to the version at creation | HIGH |
| BR-VE-003 | Version restore creates a new version, does not overwrite | MEDIUM |
