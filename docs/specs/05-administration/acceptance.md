# Acceptance Criteria — Administration

## AC-001: Create Workflow

**Given** the Administrator is on the Administrations page
**When** they create a new Workflow with a valid name
**Then** a Workflow is created in Draft status and the builder opens

**Mapped to:** REQ-WF-001, US-001

## AC-002: Unique Workflow Name

**Given** a Workflow named "surat_keputusan" exists
**When** the Administrator creates another with the same name
**Then** a validation error is shown

**Mapped to:** REQ-WF-001, BC-WF-001

## AC-003: Add Steps

**Given** the Administrator is in the Workflow builder
**When** they add 3 steps with templates and roles
**Then** steps are ordered 1-2-3 in the flow diagram

**Mapped to:** REQ-WF-002, US-002

## AC-004: Configure Step Condition

**Given** a step has a condition editor
**When** the Administrator enters a valid expression
**Then** the condition badge appears in the flow

**Mapped to:** REQ-WF-004, US-002

## AC-005: Publish Workflow

**Given** all steps have published Templates and assigned Roles
**When** the Administrator clicks "Publish"
**Then** status changes to Published, version incremented

**Mapped to:** REQ-WF-009, US-005

## AC-006: Block Publish with Invalid Steps

**Given** a step references an unpublished Template
**When** the Administrator tries to publish
**Then** publishing is blocked with specific error message

**Mapped to:** BC-WF-002, BC-WF-003

## AC-007: Execute Workflow

**Given** a Published Workflow exists
**When** a Staff member clicks "Execute"
**Then** an instance is created and first step assigned

**Mapped to:** REQ-WF-006, US-006

## AC-008: Approve Step

**Given** a Staff member is assigned to the current step
**When** they fill in data and click "Approve"
**Then** step marked complete, next step activated

**Mapped to:** REQ-WF-006, US-006

## AC-009: Reject Step

**Given** a Staff member is assigned to the current step
**When** they click "Reject" with a reason
**Then** instance marked Rejected, workflow ends

**Mapped to:** REQ-WF-006, US-006

## AC-010: Track Progress

**Given** a workflow instance is in progress
**When** the Staff member opens the instance
**Then** step progress and history are visible

**Mapped to:** REQ-WF-007, US-007

## AC-011: Complete Workflow

**Given** the final step is approved
**When** the last action is submitted
**Then** instance marked Complete, Document generated

**Mapped to:** REQ-WF-007, US-008

## Summary

| ID | Criterion | Mapped To | Status |
|----|-----------|-----------|--------|
| AC-001 | Create Workflow | REQ-WF-001 | [ ] |
| AC-002 | Unique name | REQ-WF-001 | [ ] |
| AC-003 | Add steps | REQ-WF-002 | [ ] |
| AC-004 | Configure condition | REQ-WF-004 | [ ] |
| AC-005 | Publish workflow | REQ-WF-009 | [ ] |
| AC-006 | Block invalid publish | BC-WF-002 | [ ] |
| AC-007 | Execute workflow | REQ-WF-006 | [ ] |
| AC-008 | Approve step | REQ-WF-006 | [ ] |
| AC-009 | Reject step | REQ-WF-006 | [ ] |
| AC-010 | Track progress | REQ-WF-007 | [ ] |
| AC-011 | Complete workflow | REQ-WF-007 | [ ] |
