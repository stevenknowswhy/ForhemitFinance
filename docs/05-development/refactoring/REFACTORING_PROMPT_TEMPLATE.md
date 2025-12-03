# Refactor Large File - AI Prompt Template

Use this prompt template to refactor any file >800 LOC into smaller, manageable modules.

---

## Prompt Template

```
You are a senior software engineer refactoring a codebase.

Goal:
Safely refactor any file over 800 lines into a set of smaller, cohesive modules
(preferably 100–400 lines each, never more than ~600), while keeping behavior
identical and maintaining a logical, easy-to-understand folder structure.

Constraints:
- Do NOT change behavior or business logic.
- Do NOT change public interfaces unnecessarily.
- Prefer extracting pure functions and well-defined responsibilities.
- Keep file and folder names descriptive and consistent with the existing project.
- Avoid circular dependencies; extract shared types/helpers into separate files when needed.

Refactor workflow for the target file:

1. Analyze the file and produce:
   - A short outline of its current structure.
   - A list of responsibilities it currently mixes (domain logic, infra, UI, etc.).

2. Propose a new file layout:
   - New file names and their locations.
   - A one-sentence responsibility description for each new file.

3. Implement the refactor in steps:
   - First, extract pure utility/domain functions into new files.
   - Then extract infra (DB/API) concerns.
   - Then extract UI components or orchestration pieces if applicable.
   - Keep a thin facade in the original file that re-exports the same public API.

4. Update imports:
   - Update all imports in the codebase that reference the original file,
     if the public API moved or was re-exported.

5. Add or update tests if necessary:
   - Ensure existing tests still run and pass.
   - If there are no tests for the extracted modules, suggest minimal unit tests.

6. At the end, output:
   - The final file/folder structure.
   - Any TODOs or risks that need human review.

Now apply this workflow to the file at:
{FILE_PATH}

Start by generating the current-outline and proposed new-file layout only.
Wait for confirmation before applying code changes.
```

---

## Usage Instructions

1. **Replace `{FILE_PATH}`** with the actual file path you want to refactor
2. **Copy the entire prompt** to your AI coding assistant
3. **Review the analysis** before approving code changes
4. **Run tests** after each refactoring phase

---

## Example Usage

```
You are a senior software engineer refactoring a codebase.

Goal:
Safely refactor any file over 800 lines into a set of smaller, cohesive modules
(preferably 100–400 lines each, never more than ~600), while keeping behavior
identical and maintaining a logical, easy-to-understand folder structure.

[... rest of prompt ...]

Now apply this workflow to the file at:
apps/web/app/dashboard/components/AddTransactionModal.tsx

Start by generating the current-outline and proposed new-file layout only.
Wait for confirmation before applying code changes.
```

---

## Pre-Refactoring Checklist

Before using this prompt:

- [ ] **Git snapshot created**
  ```bash
  git add .
  git commit -m "chore: snapshot before refactor {filename}"
  ```

- [ ] **Test baseline established**
  ```bash
  npm run test
  npm run lint
  npm run typecheck
  ```

- [ ] **File identified** (>800 LOC)
  ```bash
  wc -l path/to/file.tsx
  ```

---

## Post-Refactoring Checklist

After refactoring:

- [ ] **All tests pass**
  ```bash
  npm run test
  ```

- [ ] **Linter passes**
  ```bash
  npm run lint
  ```

- [ ] **Type checking passes**
  ```bash
  npm run typecheck
  ```

- [ ] **Manual testing completed**
  - Test core functionality
  - Test edge cases
  - Test error handling

- [ ] **Imports updated**
  - All files importing the refactored module still work
  - No broken imports

- [ ] **Documentation updated**
  - README files updated if needed
  - Code comments preserved/updated

---

## File Size Guidelines

| File Type | Ideal Size | Max Acceptable | Must Refactor |
|-----------|------------|----------------|---------------|
| React Component | 100-300 LOC | 400 LOC | 800+ LOC |
| Hook | 50-150 LOC | 200 LOC | 400+ LOC |
| Utility/Helper | 50-100 LOC | 150 LOC | 300+ LOC |
| Service/Controller | 200-400 LOC | 600 LOC | 800+ LOC |
| Domain Logic | 100-300 LOC | 400 LOC | 600+ LOC |

---

## Common Refactoring Patterns

### Pattern 1: Extract Custom Hooks
**Before:** Component with 200+ lines of state management  
**After:** Component + `useFeatureState.ts` hook

### Pattern 2: Extract UI Components
**Before:** Component with multiple UI sections  
**After:** Component + `FeatureSection.tsx`, `FeaturePanel.tsx`, etc.

### Pattern 3: Extract Domain Logic
**Before:** Service with business logic mixed with infrastructure  
**After:** `domain.ts` + `service.ts` + `repository.ts`

### Pattern 4: Split by Feature
**Before:** One large file handling multiple features  
**After:** `feature1.ts`, `feature2.ts`, `feature3.ts` + `index.ts`

### Pattern 5: Extract Utilities
**Before:** File with helper functions mixed with main logic  
**After:** Main file + `utils.ts` or `helpers.ts`

---

## Naming Conventions

### Backend Files
- `something.controller.ts` - Routes/orchestration
- `something.service.ts` - Business workflows
- `something.repository.ts` - Persistence
- `something.domain.ts` - Pure domain logic
- `something.types.ts` - Types/interfaces
- `something.utils.ts` - Generic helpers

### Frontend Files
- `views/Feature/FeatureScreen.tsx` - Page-level
- `views/Feature/components/*` - Presentational components
- `views/Feature/hooks/useFeatureX.ts` - Logic hooks
- `views/Feature/types.ts` - UI-specific models

---

## Safety Guidelines

1. **Never refactor without a git snapshot**
2. **Test after each extraction phase**
3. **Keep public API stable** (same exports)
4. **Extract pure functions first** (lowest risk)
5. **Watch for circular dependencies**
6. **Update tests as you go**

---

## Troubleshooting

### Issue: Circular Dependencies
**Solution:** Extract shared types/utilities to a third file

### Issue: Too Many Props Drilling
**Solution:** Consider using React Context or state management library

### Issue: Tests Breaking
**Solution:** Update test imports and mocks to match new structure

### Issue: Import Errors
**Solution:** Check that all exports are properly re-exported from index files

---

## Success Metrics

After refactoring, you should have:

✅ **Smaller files** - Each file <600 LOC (ideally 100-400)  
✅ **Clear responsibilities** - One responsibility per file  
✅ **Maintainable structure** - Easy to find and modify code  
✅ **Same functionality** - All tests pass, no behavior changes  
✅ **Better testability** - Extracted functions are easier to test  
✅ **Improved readability** - Code is easier to understand

