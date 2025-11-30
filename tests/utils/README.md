# Test Utilities

This directory contains test utilities, validation scripts, and helper functions.

## 📁 Structure

```
utils/
├── validation/        # Validation scripts
├── helpers/          # Test helper functions
└── test-setup/       # Test setup utilities
```

## ✅ Validation Scripts

**Location**: `utils/validation/`

Scripts for validating:
- Environment variables
- Financial calculations
- Data structures
- Report accuracy

### Available Scripts

- `validate-env.js` - Environment variable validation
- `validate-report-calculations.py` - Financial calculation verification

### Usage

```bash
# Validate environment
node tests/utils/validation/validate-env.js

# Validate report calculations
python tests/utils/validation/validate-report-calculations.py pnl report.json
```

## 🛠️ Helper Functions

**Location**: `utils/helpers/`

Reusable helper functions for:
- Test data generation
- Test assertions
- Common test operations

### Available Helpers

- `report-test-helpers.ts` - Report validation helpers
- `datetime-utils.py` - Date/time formatting utilities

### Usage

```typescript
import { validateReportStructure } from "../../utils/helpers/report-test-helpers";

const result = validateReportStructure(data, "profit_loss");
```

## ⚙️ Test Setup

**Location**: `utils/test-setup/` (future)

Utilities for:
- Test environment setup
- Test database initialization
- Test data seeding

---

**Last Updated**: December 2024

