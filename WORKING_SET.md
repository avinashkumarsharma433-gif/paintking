# WORKING SET

- 2026-11-08: Duplicate Face Detection & Strict Enrollment Blocking Error
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts` (`checkDuplicateFace`: set standard recognition threshold `0.46`)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (`duplicateError`: strict blocking on capture and finalize, full error modal displaying matched employee name, ID, and similarity %, with Try Another Person, Cancel, and Admin Override options)
  - Issue Diagnosed: Duplicate check was previously set as an informational toast rather than a hard block, allowing the same face to be enrolled under multiple employee profiles.
  - Status: Verified with `tsc --noEmit` (0 errors), dev server active on http://localhost:3000/.

- 2026-11-08: Automatic Pose Detection & Auto-Capture with 512-D / 128-D Vector Analysis
  - Files touched:
    - `src/portal/services/faceRecognitionService.ts` (`assessEnrollmentQuality`: fixed inverted horizontal yaw angles for left/right turns, relaxed smile ratio to 0.18, restored smooth hold progress feedback)
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Auto-capture loop with smooth decay, live 'AI Sees' pose badge, auto chime sound, and auto-save on completion)
    - `src/portal/types/hrAttendanceTypes.ts` (Added optional `locationId` property)
  - Issue Diagnosed: Yaw directions were flipped in landmark space, preventing left/right turn poses from being detected automatically.
  - Status: Verified with `tsc --noEmit` (0 errors).
