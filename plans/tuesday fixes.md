# Tuesday Fixes — June 16

## White Screen on Library Add/Edit (CRITICAL)
- **Cause**: `fetch("/api/doctor-specialties/")` on the library form page used raw `fetch()` without Bearer token auth. The backend requires `IsAuthenticated`, so it returned 401 `{"detail": "..."}`. The response JSON was set as the `specialties` state (an object), and `specialties.map(...)` crashed during render → blank white page.
- **Fix**: Replaced raw `fetch()` with `apiClient.get()` from the existing Axios client (which automatically attaches `Authorization: Bearer` tokens).

## NaN Publication Year Crash (HIGH)
- **Cause**: When the user cleared and re-typed the year field, `parseInt("")` returned `NaN`. This was serialized as the string `"NaN"` in `FormData`, causing DRF validation error `"A valid integer is required."`. The error wasn't displayed properly, so saves appeared to silently fail.
- **Fix**: Changed `onValueChange` to pass `undefined` when the field is empty: `value ? parseInt(value) : undefined`.

## Files Changed
- `frontend/src/pages/library/form.tsx` — added `apiClient` import, replaced raw fetch with `apiClient.get`, fixed year input NaN guard.
