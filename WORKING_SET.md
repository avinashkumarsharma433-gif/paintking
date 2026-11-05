# WORKING SET

- 2026-11-06: Interactive Guided 6-Pose Biometric Calibration (Replaced burst mode with visual directional instructions & on-screen hints)
  - Files touched:
    - `src/portal/modules/hr/HREnrollFaceModal.tsx` (Interactive 6-pose stepper with dedicated icons, live visual arrows, and step guidance)
    - `src/portal/services/faceRecognitionService.ts` (`computeMasterVector` across 6 calibrated poses)
  - Features:
    - Pose 1: Straight & Neutral (Center oval)
    - Pose 2: Natural Smile (Smile icon)
    - Pose 3: Turn Head Left 20° (Live bouncing left arrow)
    - Pose 4: Turn Head Right 20° (Live bouncing right arrow)
    - Pose 5: Tilt Chin Up 15° (Live bouncing up arrow)
    - Pose 6: Glasses or Expression Check (Glasses icon)
  - Status: Verified with `tsc` (0 errors).
