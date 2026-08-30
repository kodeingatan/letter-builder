# Accessibility

## Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order must be logical
- Focus must be visible
- Escape closes modals/popovers
- Enter activates buttons/links
- Arrow keys navigate within lists/menus

## Focus Management

- Focus trapped in modals
- Focus restored after modal closes
- Focus moved to new content on navigation
- Skip navigation link for main content

## Labels

- All form inputs must have visible labels
- Icons must have aria-label or sr-only text
- Buttons must have accessible names
- Images must have alt text

## Semantic Structure

- Use proper heading hierarchy (h1 → h2 → h3)
- Use landmarks (nav, main, aside, header, footer)
- Use lists for navigation items
- Use tables for tabular data

## Contrast

- Text contrast ratio ≥ 4.5:1 (normal text)
- Text contrast ratio ≥ 3:1 (large text)
- Focus indicators must have sufficient contrast
- Don't rely on color alone for meaning

## Screen Readers

- Use aria-live for dynamic content
- Use aria-expanded for expandable sections
- Use aria-selected for selected items
- Announce loading states
- Announce error states

## Validation Feedback

- Associate errors with form fields
- Use aria-describedby for error messages
- Announce validation errors
- Provide suggestions for correction
