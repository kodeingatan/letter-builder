# SDD Workflow

## Overview

Spec-Driven Development (SDD) is the development workflow for this project. Every feature follows a structured path from idea to completion.

## Workflow

```
IDEA
  ↓
UNDERSTAND
  ↓
SPEC
  ↓
REVIEW SPEC
  ↓
PLAN
  ↓
IMPLEMENT
  ↓
VERIFY
  ↓
REVIEW
  ↓
FIX (if needed)
  ↓
VERIFY AGAIN
  ↓
DONE
```

## Phase Details

### IDEA

**Input:** User request or requirement

**Activity:**
- Understand the goal
- Identify the feature scope
- Determine if a new spec is needed

**Output:** Feature name and brief description

---

### UNDERSTAND

**Activity:**
- Read existing documentation
- Inspect existing code
- Identify dependencies
- Identify conflicts

**Output:** Understanding summary

---

### SPEC

**Agent:** product

**Activity:**
- Create specification files
- Define requirements
- Define domain model
- Define API contracts
- Define UI/UX
- Define acceptance criteria

**Rules:**
- DO NOT implement code
- DO NOT modify source files
- Focus on WHAT, not HOW

**Output:** `docs/specs/<feature>/` directory

---

### REVIEW SPEC

**Agent:** reviewer

**Activity:**
- Review specification for completeness
- Check for ambiguity
- Check for conflicts
- Verify testability

**Output:** APPROVED or CHANGES REQUIRED

---

### PLAN

**Agent:** architect

**Activity:**
- Read specification
- Inspect existing codebase
- Identify reusable abstractions
- Define implementation order
- Create task breakdown

**Rules:**
- DO NOT implement code
- Focus on HOW, not writing code

**Output:** Updated `tasks.md` with implementation plan

---

### IMPLEMENT

**Agent:** build (frontend + backend)

**Activity:**
- Follow tasks in order
- Implement each task incrementally
- Run checks after meaningful changes
- Fix errors immediately

**Rules:**
- Follow specification exactly
- Do not modify unrelated code
- Do not add unspecified functionality

**Output:** Working code

---

### VERIFY

**Agent:** qa

**Activity:**
- Run typecheck
- Run lint
- Run tests
- Run build
- Check acceptance criteria
- Verify UI/UX states
- Verify accessibility

**Rules:**
- Never assume PASS
- Provide evidence for every check

**Output:** Verification report

---

### REVIEW

**Agent:** reviewer

**Activity:**
- Review implementation against specification
- Check architecture compliance
- Check code quality
- Check security
- Check performance
- Check UI/UX quality

**Output:** Review report with severity levels

---

### FIX

**Agent:** build

**Activity:**
- Fix CRITICAL and HIGH findings
- Re-run verification

**Output:** Fixed code

---

### DONE

**Criteria:**
- All tasks complete
- All acceptance criteria pass
- All verification checks pass
- No CRITICAL or HIGH review findings
- Build succeeds
