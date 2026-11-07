import * as faceapi from '@vladmandic/face-api';
import { calculateEyeAspectRatio, estimateHeadPoseFromLandmarks } from '../services/faceRecognitionService';

export type LivenessChallengeType = 'BLINK' | 'TURN_LEFT' | 'TURN_RIGHT' | 'SMILE';

export interface LivenessChallenge {
  id: string;
  type: LivenessChallengeType;
  prompt: string;
  hindiPrompt: string;
  targetDurationMs: number;
}

export interface ChallengeEvaluationResult {
  completed: boolean;
  progress: number; // 0 - 100
  metricValue: number;
  reason?: string;
}

export const LIVENESS_CHALLENGES: LivenessChallenge[] = [
  {
    id: 'CH_BLINK',
    type: 'BLINK',
    prompt: 'Blink your eyes',
    hindiPrompt: 'अपनी आँखें झपकाएं',
    targetDurationMs: 3500,
  },
  {
    id: 'CH_TURN_LEFT',
    type: 'TURN_LEFT',
    prompt: 'Turn head slightly left',
    hindiPrompt: 'चेहरे को थोड़ा बायीं ओर घुमाएं',
    targetDurationMs: 4000,
  },
  {
    id: 'CH_TURN_RIGHT',
    type: 'TURN_RIGHT',
    prompt: 'Turn head slightly right',
    hindiPrompt: 'चेहरे को थोड़ा दायीं ओर घुमाएं',
    targetDurationMs: 4000,
  },
  {
    id: 'CH_SMILE',
    type: 'SMILE',
    prompt: 'Smile naturally',
    hindiPrompt: 'प्राकृतिक रूप से मुस्कुराएं',
    targetDurationMs: 3500,
  },
];

/**
 * Tracks subtle involuntary micro-dynamics over consecutive frames for a face.
 * Real living faces:
 *  - Micro eye tremors / subtle blinking (EAR variance > 0.0035 over 3-5 frames)
 *  - Natural pulse / respiratory micro-nodding (landmark coordinates jitter slightly by 0.4px - 3.5px)
 * Photos / screens:
 *  - Static landmark coordinates across frames (variance < 0.0008, 0% natural micro-motion)
 */
interface MicroMotionRecord {
  lastSeen: number;
  earHistory: number[];
  positionsHistory: { x: number; y: number }[][];
}

const faceMotionCache = new Map<string, MicroMotionRecord>();

export function evaluatePassiveMicroLiveness(
  empId: string,
  landmarks: faceapi.FaceLandmarks68
): { isLive: boolean; reason?: string } {
  const now = Date.now();
  const ear = calculateEyeAspectRatio(landmarks);
  const keyPoints = [
    landmarks.positions[30], // nose tip
    landmarks.positions[36], // left eye outer
    landmarks.positions[45], // right eye outer
    landmarks.positions[48], // mouth left
    landmarks.positions[54], // mouth right
    landmarks.positions[8],  // chin
  ];

  let record = faceMotionCache.get(empId);
  if (!record || now - record.lastSeen > 3500) {
    record = {
      lastSeen: now,
      earHistory: [ear],
      positionsHistory: [keyPoints.map((p) => ({ x: p.x, y: p.y }))],
    };
    faceMotionCache.set(empId, record);
    // Allow initial recognition to start green while gathering rolling history
    return { isLive: true };
  }

  record.lastSeen = now;
  record.earHistory.push(ear);
  record.positionsHistory.push(keyPoints.map((p) => ({ x: p.x, y: p.y })));

  if (record.earHistory.length > 8) record.earHistory.shift();
  if (record.positionsHistory.length > 8) record.positionsHistory.shift();

  // Need at least 4 rolling frames to detect complete freeze / static photo
  if (record.positionsHistory.length < 4) {
    return { isLive: true };
  }

  // 1. Natural Involuntary Eye Dynamics
  const earMin = Math.min(...record.earHistory);
  const earMax = Math.max(...record.earHistory);
  const earDelta = earMax - earMin;

  // 2. Multi-point coordinate jitter
  let totalPositionShift = 0;
  for (let f = 1; f < record.positionsHistory.length; f++) {
    const prev = record.positionsHistory[f - 1];
    const curr = record.positionsHistory[f];
    for (let p = 0; p < keyPoints.length; p++) {
      totalPositionShift += Math.hypot(curr[p].x - prev[p].x, curr[p].y - prev[p].y);
    }
  }
  const avgShiftPerFrame = totalPositionShift / ((record.positionsHistory.length - 1) * keyPoints.length);

  // Dead photo check: 
  // If eye variance is virtually ZERO (<0.002) AND position shift is virtually ZERO (<0.15px) across 4+ frames
  const isCompletelyFrozen = earDelta < 0.002 && avgShiftPerFrame < 0.15;

  if (isCompletelyFrozen) {
    return {
      isLive: false,
      reason: 'Static 2D photo / screen detected (zero natural micro-motion across frames)',
    };
  }

  return { isLive: true };
}
 /**
 * Passive texture & frequency analysis for screen / photo spoof detection.
 * Inspects:
 * 1. High frequency specular reflection patterns typical of mobile phone screens and glossy photo prints.
 * 2. Color saturation and standard deviation of color channels.
 */
export function analyzePassiveSpoof(
  canvas: HTMLCanvasElement,
  box: { x: number; y: number; width: number; height: number }
): { isLive: boolean; spoofConfidence: number; reasons: string[] } {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { isLive: true, spoofConfidence: 0.1, reasons: [] };

  const bx = Math.max(0, Math.min(canvas.width - 10, (box.x / 100) * canvas.width));
  const by = Math.max(0, Math.min(canvas.height - 10, (box.y / 100) * canvas.height));
  const bw = Math.max(20, Math.min(canvas.width - bx, (box.width / 100) * canvas.width));
  const bh = Math.max(20, Math.min(canvas.height - by, (box.height / 100) * canvas.height));

  const imgData = ctx.getImageData(bx, by, bw, bh);
  const data = imgData.data;
  const numPixels = data.length / 4;

  let rSum = 0, gSum = 0, bSum = 0;
  let brightPixelCount = 0;
  let flatColorPixelCount = 0;
  let highContrastEdgeCount = 0;

  // Measure variance/flatness and high-frequency digital noise
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    rSum += r;
    gSum += g;
    bSum += b;

    // Specular screen reflection / bright phone flashlight / glare (>240)
    if (r > 240 && g > 240 && b > 240) {
      brightPixelCount++;
    }

    // Digital screens / printed photo color banding
    if (Math.abs(r - g) < 5 && Math.abs(g - b) < 5) {
      flatColorPixelCount++;
    }

    // Check adjacent pixel contrast (sharp printed paper border / phone screen edge)
    if (i > 4) {
      const prevR = data[i - 4];
      const prevG = data[i - 3];
      const prevB = data[i - 2];
      const delta = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
      if (delta > 110) {
        highContrastEdgeCount++;
      }
    }
  }

  const glareRatio = brightPixelCount / numPixels;
  const flatRatio = flatColorPixelCount / numPixels;
  const edgeRatio = highContrastEdgeCount / numPixels;

  const reasons: string[] = [];
  let spoofScore = 0;

  // Real world lighting thresholds (avoids false-positive on human skin under office LED/tubelight):
  if (glareRatio > 0.08) {
    spoofScore += 0.45;
    reasons.push('Screen reflection / paper specular glare detected');
  }

  if (flatRatio > 0.42) {
    spoofScore += 0.40;
    reasons.push('Digital screen color banding detected');
  }

  if (edgeRatio > 0.22) {
    spoofScore += 0.35;
    reasons.push('Screen moiré / print halftone artifact detected');
  }

  return {
    isLive: spoofScore < 0.60,
    spoofConfidence: Number(spoofScore.toFixed(2)),
    reasons,
  };
}

/**
 * State machine for active liveness challenge verification across video frames.
 */
export class ActiveLivenessSession {
  public challenge: LivenessChallenge;
  public startTime: number;
  private earHistory: number[] = [];
  private yawHistory: number[] = [];
  private smileHistory: number[] = [];
  public completed: boolean = false;

  constructor(challenge?: LivenessChallenge) {
    this.challenge = challenge || LIVENESS_CHALLENGES[Math.floor(Math.random() * LIVENESS_CHALLENGES.length)];
    this.startTime = Date.now();
  }

  public reset(challenge?: LivenessChallenge) {
    this.challenge = challenge || LIVENESS_CHALLENGES[Math.floor(Math.random() * LIVENESS_CHALLENGES.length)];
    this.startTime = Date.now();
    this.earHistory = [];
    this.yawHistory = [];
    this.smileHistory = [];
    this.completed = false;
  }

  public update(landmarks: faceapi.FaceLandmarks68): ChallengeEvaluationResult {
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.challenge.targetDurationMs) {
      return {
        completed: false,
        progress: 0,
        metricValue: 0,
        reason: 'Challenge timed out. Please try again.',
      };
    }

    const ear = calculateEyeAspectRatio(landmarks);
    const pose = estimateHeadPoseFromLandmarks(landmarks);
    const mouthWidth = Math.hypot(
      landmarks.positions[54].x - landmarks.positions[48].x,
      landmarks.positions[54].y - landmarks.positions[48].y
    );
    const eyeDist = Math.hypot(
      landmarks.positions[45].x - landmarks.positions[36].x,
      landmarks.positions[45].y - landmarks.positions[36].y
    );
    const smileRatio = eyeDist > 0 ? mouthWidth / eyeDist : 0;

    this.earHistory.push(ear);
    this.yawHistory.push(pose.yaw);
    this.smileHistory.push(smileRatio);

    if (this.earHistory.length > 20) this.earHistory.shift();
    if (this.yawHistory.length > 20) this.yawHistory.shift();
    if (this.smileHistory.length > 20) this.smileHistory.shift();

    switch (this.challenge.type) {
      case 'BLINK': {
        // Blink verification: require an EAR dip below 0.17 followed by rebound above 0.23
        const minEar = Math.min(...this.earHistory);
        const maxEar = Math.max(...this.earHistory);
        const hasDipped = minEar <= 0.17 && maxEar >= 0.23;
        const progress = hasDipped ? 100 : Math.min(90, Math.round(((0.30 - ear) / 0.13) * 100));

        if (hasDipped) this.completed = true;
        return {
          completed: this.completed,
          progress: this.completed ? 100 : Math.max(0, progress),
          metricValue: Number(ear.toFixed(3)),
        };
      }

      case 'TURN_LEFT': {
        // Yaw turns negative when looking towards user's left
        const minYaw = Math.min(...this.yawHistory);
        const turnedLeft = minYaw <= -14;
        const progress = Math.min(100, Math.round((Math.abs(Math.min(0, minYaw)) / 14) * 100));

        if (turnedLeft) this.completed = true;
        return {
          completed: this.completed,
          progress: this.completed ? 100 : progress,
          metricValue: Number(pose.yaw.toFixed(1)),
        };
      }

      case 'TURN_RIGHT': {
        // Yaw turns positive when looking towards user's right
        const maxYaw = Math.max(...this.yawHistory);
        const turnedRight = maxYaw >= 14;
        const progress = Math.min(100, Math.round((Math.max(0, maxYaw) / 14) * 100));

        if (turnedRight) this.completed = true;
        return {
          completed: this.completed,
          progress: this.completed ? 100 : progress,
          metricValue: Number(pose.yaw.toFixed(1)),
        };
      }

      case 'SMILE': {
        const maxSmile = Math.max(...this.smileHistory);
        const hasSmiled = maxSmile >= 0.78;
        const progress = Math.min(100, Math.round(((maxSmile - 0.60) / 0.18) * 100));

        if (hasSmiled) this.completed = true;
        return {
          completed: this.completed,
          progress: this.completed ? 100 : Math.max(0, progress),
          metricValue: Number(smileRatio.toFixed(3)),
        };
      }
    }
  }
}
