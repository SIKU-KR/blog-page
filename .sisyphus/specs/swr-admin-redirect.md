# SWR Admin-Only Redirect Policy

## Overview

This specification defines the policy for automatic redirects on 401 Unauthorized errors within the global SWR configuration. The goal is to ensure that only admin-related authentication failures trigger a redirect to the login page, preventing unexpected redirects for public users.

## Policy Rules

### 1. Admin-Only Redirect Scope

Automatic redirection to `/login` on a 401 error MUST only occur if the request is identified as an admin-related operation.

An operation is considered "admin-related" if ANY of the following conditions are met:

- **Key Prefix Scope**: The SWR key (request URL) starts with `/api/admin`.
- **Pathname Scope**: The current browser location (`window.location.pathname`) starts with `/admin`.

### 2. Implementation Logic (for Task 8)

In `src/shared/lib/swr.ts`, the `onError` handler should be updated to:

1. Check if `error.status === 401`.
2. If true, verify if the request is in the "Admin-Only Redirect Scope".
3. Only if both are true, execute `window.location.href = '/login'`.

### 3. Non-Goals

- **Auth Model Stability**: Do NOT change the current authentication storage model. The `admin_token` MUST remain in `localStorage`.
- **Public User Experience**: Public API calls (non-admin) that return 401 should be handled gracefully by the calling component or ignored by the global redirector to avoid disrupting the public browsing experience.

## Examples

| SWR Key              | Current Pathname  | Error | Action                            |
| -------------------- | ----------------- | ----- | --------------------------------- |
| `/api/admin/posts`   | `/admin/posts`    | 401   | Redirect to `/login`              |
| `/api/posts/my-slug` | `/my-slug`        | 401   | **No Redirect**                   |
| `/api/admin/stats`   | `/`               | 401   | Redirect to `/login` (Admin API)  |
| `/api/health`        | `/admin/settings` | 401   | Redirect to `/login` (Admin Path) |

## Guardrails

- Ensure `window` is defined before accessing `window.location`.
- The check should be case-insensitive for path prefixes if applicable, though standard URL paths are lowercase.
