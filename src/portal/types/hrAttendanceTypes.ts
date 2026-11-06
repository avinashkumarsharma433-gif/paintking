export interface Employee {
  id: string; // e.g. "PK-EMP-0101"
  name: string;
  designation: string;
  department: 'Liquid Coating' | 'Hydrographics' | 'UV Digital' | 'Injection Moulding' | 'Quality Assurance' | 'Administration' | 'HR' | 'Maintenance';
  shift: 'General (09:00 - 18:00)' | 'Morning Shift A (06:00 - 14:30)' | 'Evening Shift B (14:00 - 22:30)' | 'Night Shift C (22:00 - 06:30)';
  phone: string;
  email: string;
  joinDate: string; // YYYY-MM-DD
  avatarUrl?: string;
  faceEnrolled: boolean;
  faceDescriptors?: number[][]; // 128-dimensional face embedding vectors (multiple angles)
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE';

export interface LocationStamp {
  lat: number;
  lng: number;
  accuracy: number;
  distanceToHQ: number; // in meters
  isHQVerified: boolean;
  locationName: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  inTime?: string; // HH:mm:ss
  outTime?: string; // HH:mm:ss
  inLocation?: LocationStamp;
  outLocation?: LocationStamp;
  status: AttendanceStatus;
  shiftName: string;
  totalWorkMinutes?: number;
  isManualOverride?: boolean;
  overrideReason?: string;
  overrideBy?: string;
}

export interface GeofenceTarget {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

export interface TerminalConfig {
  activeLocationId: string;
  strictGeofence: boolean;
  bypassGeofenceForDev: boolean;
  minRecognitionConfidence: number; // 0.0 - 1.0 (e.g. 0.46)
  cooldownMinutes: number; // default 5 minutes
  selectedCameraId?: string;
  requiredConsecutiveFrames?: number; // multi-frame confirmation (default 3)
  minRecognitionMargin?: number; // margin over second-best (default 0.05)
}

export interface EnrollmentQualityDetails {
  passed: boolean;
  reasons: string[];
  qualityScore: number; // 0 - 100
  blurScore: number; // variance of Laplacian
  exposureScore: number; // 0 - 255 luminance
  eyeAspectRatio: number; // EAR
  boxCoveragePct: number; // % of frame
  detectedPose: 'NEUTRAL' | 'SMILE' | 'LEFT' | 'RIGHT' | 'UP' | 'GLASSES_EXPRESSION' | 'UNKNOWN';
}

export interface UnknownAttemptLog {
  id: string;
  timestamp: string;
  date: string;
  thumbnailDataUrl: string;
  bestDistance: number;
  closestEmployeeName?: string;
  reason: string;
}

export interface RecognitionStageLatency {
  detectionMs: number;
  landmarksMs: number;
  embeddingMs: number;
  matchingMs: number;
  totalPipelineMs: number;
}
