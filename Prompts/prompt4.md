Carefully review and refactor the provided codebase to maximize clarity, maintainability, and ease of future extension by an AI agent or developer.  
Apply these standards throughout all files and modules:

### 1. Structure & Organization
- Separate logic into clear, well-named functions and modules based on functionality.
- Ensure that file and class naming is descriptive and matches their contents.
- Remove unused, duplicated, or dead code.
- Group related logic—such as UI, data/model, and service code—into distinct files/modules.

### 2. Readability
- Rewrite variable, function, and class names to be self-explanatory with consistent casing (snake_case, camelCase, or PascalCase according to language conventions).
- Add concise docstrings/comments above all major functions, classes, and complex logic blocks.
- Adopt a uniform indentation style and spacing throughout.
- Break up long functions into smaller, single-responsibility ones.
- Use constants for repeated values.

### 3. Consistency
- Standardize error handling (try/catch, error boundaries) so all flows are predictable.
- Use clear, consistent data types and interfaces; document them as needed.
- Use design patterns (e.g., MVC, observer) where appropriate for maintainability.

### 4. API & Data
- Explicitly type all function inputs and outputs, preferably with TypeScript interfaces/types or docstrings in Python.
- Document expected structures for any API requests or responses.

### 5. Documentation
- Add or update top-level README and in-file comments to explain project purpose, structure, and essential workflows.
- Add function/class summaries describing intent and input/output.

### 6. Extendability
- Where logic must be customized or extended, add TODO comments or `<AI_MODIFIABLE>` tags showing recommended entry points.
- Avoid hardcoding, especially for configuration and static data—use config files or centralized constants.
- Highlight places where business logic may change and mark them with comments.

### 7. Automated Checks
- Add code linters (e.g., ESLint for JS/TS, flake8 for Python) and basic tests (unit/integration) for key logic so the project can be validated automatically before changes are committed.

### 8. Output
- Return only the fully refactored code, stripped of any obsolete or unnecessary lines.
- If part of the code is ambiguous, add comments describing any assumptions made and open questions for future developers.

**Example summary header:**

```
/*
  [ModuleName] Refactored for clarity and AI maintainability:
  - Functions separated by responsibility
  - Consistent error handling and naming
  - Clear type/interface usage
  - Entry points for AI modification marked
  - Full documentation included
*/
```
