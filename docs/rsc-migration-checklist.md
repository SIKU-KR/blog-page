# RSC Migration Checklist

This checklist provides guardrails for safely migrating components from Client Components (`'use client'`) to Server Components.

## 1. Pre-Migration Analysis

- [ ] **Check for Hooks**: Does the component use any of the following?
  - `useState`, `useReducer`
  - `useEffect`, `useLayoutEffect`, `useInsertionEffect`
  - `useContext`
  - `useRef`, `useImperativeHandle`
  - `useMemo`, `useCallback`
  - `useTransition`, `useDeferredValue`
  - `useOptimistic`, `useActionState` (React 19)
  - _If yes, it must remain a Client Component or be refactored._

- [ ] **Check for Event Handlers**: Does the component use props like `onClick`, `onChange`, `onSubmit`, etc.?
  - _If yes, it must remain a Client Component._

- [ ] **Check for Browser APIs**: Does the component access `window`, `document`, `localStorage`, `navigator`, etc.?
  - _If yes, it must remain a Client Component (or wrap the access in `useEffect` which also requires `'use client'`)._

- [ ] **Check for Client-only Libraries**: Does the component use libraries that depend on the DOM (e.g., Tiptap, some animation libraries)?
  - _If yes, it must remain a Client Component._

- [ ] **Check for Context Providers**: Does the component provide a Context?
  - _If yes, it must remain a Client Component._

- [ ] **Check for Props**: Does the component receive functions as props?
  - _If yes, the parent must be a Client Component, and this component likely should be too._

## 2. Migration Steps

1. [ ] **Create Characterization Test**: Before making any changes, ensure there is a test that captures the current behavior and rendered output.
2. [ ] **Remove `'use client'`**: Delete the directive from the top of the file.
3. [ ] **Convert to Async (if needed)**: If the component needs to fetch data, convert it to an `async` function and use server-side data fetching (e.g., `db.query`, `fetch` with cache).
4. [ ] **Update Imports**: Ensure that any client-only components imported by this component are still compatible (Server Components can import Client Components, but not vice versa).
5. [ ] **Verify with Type-Checking**: Run `npm run build` to ensure no RSC-specific type errors (e.g., passing non-serializable props to Client Components).

## 3. Post-Migration Verification

- [ ] **Run Tests**: Ensure characterization tests still pass.
- [ ] **Structural Regression Check**: Use `assertComponentStructure` helper to verify the rendered HTML hasn't changed unexpectedly.
- [ ] **Manual Smoke Test**: Verify the component works as expected in the browser, especially interactive parts that might have been moved to child Client Components.
