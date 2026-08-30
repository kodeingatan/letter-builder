# Review Rules

These rules govern how implementation is reviewed.

## Severity Levels

### CRITICAL

**Blocks completion.** Must be fixed before feature can be approved.

Examples:
- Security vulnerability
- Data loss risk
- Architecture violation that will cause maintenance problems
- Business rule not implemented
- Acceptance criteria not met

### HIGH

**Blocks completion.** Must be fixed before feature can be approved.

Examples:
- Missing error handling
- Missing validation
- Poor UX that will confuse users
- Performance problem
- Duplicated logic

### MEDIUM

**Should be fixed.** Can be addressed in follow-up if time-constrained.

Examples:
- Minor code style issues
- Suboptimal but working implementation
- Missing edge case handling
- Inconsistent naming

### LOW

**Nice to have.** Can be deferred.

Examples:
- Minor UI polish
- Documentation improvements
- Minor refactoring suggestions

## Review Checklist

### Requirements Review
- [ ] All requirements implemented
- [ ] No requirement misunderstood
- [ ] No unnecessary functionality added

### Architecture Review
- [ ] Layer separation maintained
- [ ] Module boundaries respected
- [ ] No duplicated abstractions
- [ ] Dependencies appropriate

### Backend Review
- [ ] API routes are thin
- [ ] Service handles business logic
- [ ] Repository handles data access
- [ ] Validation is comprehensive
- [ ] Error handling is consistent

### Frontend Review
- [ ] Components are reusable
- [ ] Composables are focused
- [ ] API integration is clean
- [ ] No business logic in templates

### UI/UX Review
- [ ] Visual hierarchy is clear
- [ ] Spacing is consistent
- [ ] Typography follows system
- [ ] Loading states present
- [ ] Empty states present
- [ ] Error states present
- [ ] Responsive design works
- [ ] Accessibility requirements met

### Security Review
- [ ] Input validated
- [ ] Authorization checked
- [ ] No sensitive data exposed
- [ ] No injection risks

### Performance Review
- [ ] No unnecessary requests
- [ ] No unnecessary rendering
- [ ] Pagination implemented where needed
- [ ] No large payloads

## Review Output Format

```markdown
## CRITICAL
[List CRITICAL findings]

## HIGH
[List HIGH findings]

## MEDIUM
[List MEDIUM findings]

## LOW
[List LOW findings]

## Positive Findings
[What was done well]

## Verdict
APPROVED / CHANGES REQUIRED
```

## Blocking Rules

- **CRITICAL or HIGH findings** → CHANGES REQUIRED
- **Only MEDIUM/LOW findings** → APPROVED (with notes)
- **No findings** → APPROVED
