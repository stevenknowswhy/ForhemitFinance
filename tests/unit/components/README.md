# Frontend Component Tests

## Overview

This directory contains unit tests for React components using React Testing Library and Vitest.

## Test Structure

```
tests/unit/components/
├── EntryPreview.test.tsx
├── ApprovalQueue.test.tsx
└── AddTransactionModal.test.tsx
```

## Running Tests

```bash
# Run all component tests
pnpm test tests/unit/components

# Run specific test file
pnpm test tests/unit/components/EntryPreview.test.tsx
```

## Test Setup

Tests use:
- **Vitest** - Test runner
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - DOM matchers

## Example Test

```typescript
import { render, screen } from '@testing-library/react';
import { EntryPreview } from '@/app/dashboard/components/EntryPreview';

describe('EntryPreview', () => {
  it('displays entry information', () => {
    render(<EntryPreview {...props} />);
    expect(screen.getByText('Suggested Accounting Entry')).toBeInTheDocument();
  });
});
```
