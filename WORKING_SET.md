# WORKING SET

- 2026-11-08: Automatic Pose Detection & Auto-Capture with 512-D / 128-D Vector Analysis
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts` (`assessEnrollmentQuality`: fixed inverted horizontal yaw angles for left/right turns, relaxed smile ratio to 0.18, restored smooth hold progress feedback)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Auto-capture loop with smooth decay, duplicate face non-blocking alert, live 'AI Sees' pose badge, auto chime sound, and auto-save on completion)
    - `src/portal/types/hrAttendanceTypes.ts` (Added optional `locationId` property)
  - Issue Diagnosed: Duplicate face check was executing `return;` on step 1 blocking all captures when testing repeatedly. Also, yaw directions were flipped in landmark space, preventing left/right turn poses from being detected automatically.
  - Status: Verified with `tsc --noEmit` (0 errors), dev server active on http://localhost:3000/.
