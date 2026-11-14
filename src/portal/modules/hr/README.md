# HR Module (`src/portal/modules/hr`)

## Overview
Provides the Human Resources, Biometric Attendance Terminal, Face Enrollment, Employee Directory, Shift Settings, Payroll, and Recognition Lab UI components for the PaintKing Portal.

## Interface
- `HRAttendanceRegister.tsx:HRAttendanceRegister` — Attendance register view with manual override and manual record addition.
- `HRAttendanceTerminal.tsx:HRAttendanceTerminal` — Biometric attendance punch terminal with configurable recognition thresholds.
- `HREmployeeDirectory.tsx:HREmployeeDirectory` — Employee directory CRUD and biometric enrollment triggers.
- `HREnrollFaceModal.tsx:HREnrollFaceModal` — Modal for capturing and saving employee face descriptors.
- `HRPayrollView.tsx:HRPayrollView` — Monthly payroll calculation and rate management view.
- `HRShiftSettings.tsx:HRShiftSettings` — Plant shift and holiday configuration view.
- `RecognitionLab.tsx:RecognitionLab` — Diagnostic lab for testing face recognition baselines.

## Invariants
- `[HRAttendanceRegister.tsx:absentCount]` Clamped to `>= 0` via `Math.max(0, totalEmployees - presentCount - onLeaveCount)`.
- `[HRAttendanceTerminal.tsx:config]` Enforces `minRecognitionConfidence <= 0.40` (clamped to `0.38`), `minRecognitionMargin >= 0.03`, and `requiredConsecutiveFrames >= 7` when loading saved config.
- `[HREnrollFaceModal.tsx:HREnrollFaceModal]` Returns `null` immediately if `!employee || !employee.id`.
- `[HRShiftSettings.tsx:handleAddHoliday]` Maintains `localHolidays` sorted ascending by date (`a.date.localeCompare(b.date)`).

## Side Effects
- `[HRAttendanceTerminal.tsx:config]` Reads `'pk_terminal_config'` from `localStorage` on initialization.
- `[HRShiftSettings.tsx:handleSaveAllShifts]` Schedules a `2500ms` `setTimeout` to clear `savedSuccess` state.
- `[RecognitionLab.tsx:baseline]` Reads `'pk_recognition_baseline'` from `localStorage` on initialization.

## Verification
- Run: `npm run lint && npm run build`
