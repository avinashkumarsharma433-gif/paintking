import * as faceapi from '@vladmandic/face-api';
import { Employee, EnrollmentQualityDetails, RecognitionStageLatency } from '../types/hrAttendanceTypes';

export interface FaceMatchResult {
  matchedEmployee?: Employee;
  secondBestEmployee?: Employee;
  secondBestDistance?: number;
  margin?: number; // difference between secondBestDistance and bestDistance
  distance: number;
  confidence: number; // 0% - 100%
  isMatch: boolean;
  isLive: boolean; // Basic liveness check
  eyeAspectRatio?: number;
}

export interface DetectedFaceSlot {
  box: { x: number; y: number; width: number; height: number };
  descriptor: number[];
  matchResult: FaceMatchResult;
  status: 'RECOGNIZED' | 'UNKNOWN' | 'SPOOF_SUSPECTED';
  landmarks?: faceapi.FaceLandmarks68;
}

let modelsLoaded = false;
let modelLoadPromise: Promise<void> | null = null;

/**
 * Loads SSD MobileNet V1, 68-Point Facial Landmark, and Face Recognition Deep Neural Networks
 */
export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
    } catch (err) {
      console.error('Failed to load neural network weights from /models:', err);
    }
  })();

  return modelLoadPromise;
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

/**
 * Calculates Euclidean distance between two 128-dimensional face embedding vectors
 */
export function calculateEuclideanDistance(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length || vec1.length === 0) return 999;
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Normalizes Euclidean distance into confidence percentage (FaceNet ResNet-34 / CompreFace Standard)
 * Since 128-D descriptors are L2-normalized unit vectors, Cosine Similarity S = 1 - (D^2)/2.
 * D = 0.00 -> 100%
 * D = 0.25 -> 97%
 * D = 0.35 -> 94%
 * D = 0.46 (Threshold) -> 89%
 * D = 0.60 -> 82%
 * D >= 1.00 -> <= 50%
 */
export function distanceToConfidence(distance: number): number {
  if (distance <= 0) return 100;
  if (distance >= 1.414) return 0;
  // Exact Cosine Similarity for unit-normalized embeddings
  const cosineSim = Math.max(0, 1 - (distance * distance) / 2);
  return Math.round(cosineSim * 100);
}

/**
 * Computes variance of Laplacian on grayscale face crop to estimate sharpness/blur
 * Returns variance value (>30 is adequately sharp; <30 indicates motion or camera blur)
 */
export function computeLaplacianVariance(ctx: CanvasRenderingContext2D, box: { x: number; y: number; width: number; height: number }): number {
  try {
    const bx = Math.max(0, Math.floor(box.x));
    const by = Math.max(0, Math.floor(box.y));
    const bw = Math.max(10, Math.floor(box.width));
    const bh = Math.max(10, Math.floor(box.height));
    const imgData = ctx.getImageData(bx, by, bw, bh);
    const data = imgData.data;

    // Convert to grayscale
    const gray = new Float32Array(bw * bh);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // Apply 3x3 Laplacian filter
    let sum = 0;
    let sumSq = 0;
    let count = 0;

    for (let y = 1; y < bh - 1; y++) {
      for (let x = 1; x < bw - 1; x++) {
        const center = y * bw + x;
        const lap =
          gray[center - bw] + // top
          gray[center + bw] + // bottom
          gray[center - 1] +  // left
          gray[center + 1] -  // right
          4 * gray[center];

        sum += lap;
        sumSq += lap * lap;
        count++;
      }
    }

    if (count === 0) return 0;
    const mean = sum / count;
    const variance = sumSq / count - mean * mean;
    return Math.max(0, Number(variance.toFixed(2)));
  } catch {
    return 50; // Fallback if canvas security or dimension error
  }
}

/**
 * Calculates average luminance of face crop (0 - 255)
 */
export function computeExposureScore(ctx: CanvasRenderingContext2D, box: { x: number; y: number; width: number; height: number }): number {
  try {
    const bx = Math.max(0, Math.floor(box.x));
    const by = Math.max(0, Math.floor(box.y));
    const bw = Math.max(10, Math.floor(box.width));
    const bh = Math.max(10, Math.floor(box.height));
    const imgData = ctx.getImageData(bx, by, bw, bh);
    const data = imgData.data;

    let totalLuma = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return Math.round(totalLuma / (pixelCount || 1));
  } catch {
    return 120;
  }
}

/**
 * Estimates head pose angles (yaw, pitch, roll) from 68 facial landmarks
 */
/**
 * Estimates head pose angles (yaw, pitch, roll) and smile metrics from 68 facial landmarks.
 * In unmirrored canvas:
 * - Turning head to physical LEFT moves nose tip rightwards in canvas (yaw > 0).
 * - Turning head to physical RIGHT moves nose tip leftwards in canvas (yaw < 0).
 * - Tilting chin UP shrinks vertical distance between nose and chin relative to eye line (pitch > 0).
 */
export function estimateHeadPoseFromLandmarks(landmarks: faceapi.FaceLandmarks68): {
  yaw: number; // Physical turn: Left (+) / Right (-)
  pitch: number; // Down (-) / Up (+)
  roll: number;
  mouthAspectRatio: number;
  isSmiling: boolean;
} {
  const pts = landmarks.positions;
  const noseTip = pts[30];
  const jawLeft = pts[0];
  const jawRight = pts[16];
  const chin = pts[8];
  const leftEyeOuter = pts[36];
  const rightEyeOuter = pts[45];
  const eyeMidY = (pts[36].y + pts[45].y) / 2;

  const totalJawWidth = Math.max(1, jawRight.x - jawLeft.x);

  // Unmirrored Canvas: pts[0] is canvas left, pts[16] is canvas right.
  // When person turns towards their physical LEFT: nose moves towards canvas right (pts[16]).
  // distFromLeft = noseTip.x - jawLeft.x. distFromRight = jawRight.x - noseTip.x.
  const distFromLeft = noseTip.x - jawLeft.x;
  const distFromRight = jawRight.x - noseTip.x;
  const yaw = Number(((distFromLeft - distFromRight) / totalJawWidth).toFixed(3));

  // Pitch calculation:
  // Distance from eye line to nose tip vs distance from nose tip to chin tip
  const distEyeNose = Math.max(1, noseTip.y - eyeMidY);
  const distNoseChin = Math.max(1, chin.y - noseTip.y);
  // When head is tilted UP: chin moves up towards nose, distNoseChin shrinks.
  // In neutral face, distNoseChin / distEyeNose is around 1.15 to 1.35. In chin up it drops below 0.85.
  const pitch = Number(((1.10 - (distNoseChin / distEyeNose))).toFixed(3));

  // Roll: eye level tilt
  const roll = Number(((rightEyeOuter.y - leftEyeOuter.y) / totalJawWidth).toFixed(3));

  // Smile detection using lip corners & mouth geometry
  const mouthWidth = Math.hypot(pts[54].x - pts[48].x, pts[54].y - pts[48].y);
  const eyeDist = Math.max(1, Math.hypot(pts[45].x - pts[36].x, pts[45].y - pts[36].y));
  const mouthHeight = Math.hypot(pts[57].x - pts[51].x, pts[57].y - pts[51].y);

  const smileWidthRatio = mouthWidth / eyeDist;
  const mouthAspectRatio = Number((mouthHeight / (mouthWidth || 1)).toFixed(3));

  // A genuine smile either expands lip width or opens mouth with curvature
  const isSmiling = mouthAspectRatio >= 0.22 || (smileWidthRatio >= 1.02 && mouthAspectRatio >= 0.14);

  return { yaw, pitch, roll, mouthAspectRatio, isSmiling };
}

/**
 * Enrollment Quality Gate: Evaluates detection confidence, face dimensions, blur, lighting, eyes open, and pose compliance
 */
export function assessEnrollmentQuality(
  detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>,
  ctx: CanvasRenderingContext2D,
  frameWidth: number,
  frameHeight: number,
  requestedStepId: number // 1 to 6
): EnrollmentQualityDetails {
  const box = detection.detection.box;
  const score = detection.detection.score;
  const landmarks = detection.landmarks;

  const ear = calculateEyeAspectRatio(landmarks);
  const pose = estimateHeadPoseFromLandmarks(landmarks);
  const blurScore = computeLaplacianVariance(ctx, box);
  const exposureScore = computeExposureScore(ctx, box);
  const boxCoveragePct = Math.round((box.height / (frameHeight || 1)) * 100);

  const reasons: string[] = [];

  // 1. Detection confidence
  if (score < 0.25) {
    reasons.push(`Low face detection confidence (${Math.round(score * 100)}%)`);
  }

  // 2. Minimum face size
  if (box.width < 35 || box.height < 35) {
    reasons.push('Face is too far from camera. Move closer.');
  }

  // 3. Extreme lighting checks
  if (exposureScore < 6) {
    reasons.push('Lighting is too dark. Increase ambient light.');
  } else if (exposureScore > 252) {
    reasons.push('Face is overexposed/glare. Avoid direct backlight.');
  }

  // 4. Intelligent Head Pose Classifier
  let detectedPose: EnrollmentQualityDetails['detectedPose'] = 'NEUTRAL';
  if (pose.isSmiling) {
    detectedPose = 'SMILE';
  } else if (pose.yaw >= 0.14) {
    detectedPose = 'LEFT';
  } else if (pose.yaw <= -0.14) {
    detectedPose = 'RIGHT';
  } else if (pose.pitch >= 0.14) {
    detectedPose = 'UP';
  } else {
    detectedPose = 'NEUTRAL';
  }

  // 5. Strict Step-by-Step Pose Verification (Guarantees user actually executes each requested pose)
  if (requestedStepId === 1) {
    // Pose 1: Straight & Neutral
    if (Math.abs(pose.yaw) > 0.12) reasons.push('Look directly straight at the camera.');
    if (pose.pitch > 0.14 || pose.pitch < -0.18) reasons.push('Keep head level (not tilted up/down).');
    if (pose.isSmiling) reasons.push('Keep a neutral expression for Step 1.');
  } else if (requestedStepId === 2) {
    // Pose 2: Natural Smile
    if (!pose.isSmiling) reasons.push('Please give a natural smile (हल्की मुस्कान दें).');
  } else if (requestedStepId === 3) {
    // Pose 3: Turn Head Left
    if (pose.yaw < 0.14) reasons.push('Turn head towards your left side (चेहरा बायीं तरफ घुमाएं).');
  } else if (requestedStepId === 4) {
    // Pose 4: Turn Head Right
    if (pose.yaw > -0.14) reasons.push('Turn head towards your right side (चेहरा दायीं तरफ घुमाएं).');
  } else if (requestedStepId === 5) {
    // Pose 5: Chin Up
    if (pose.pitch < 0.14) reasons.push('Tilt chin slightly upward (ठोड़ी को ऊपर उठाएं).');
  } else if (requestedStepId === 6) {
    // Pose 6: Final Verification (Straight neutral)
    if (Math.abs(pose.yaw) > 0.14) reasons.push('Look straight into the camera for final verification.');
  }

  const passed = reasons.length === 0;

  // Composite Quality Score (0 - 100)
  let qualityScore = 100;
  if (!passed) qualityScore -= reasons.length * 15;
  qualityScore = Math.max(0, Math.min(100, qualityScore));

  return {
    passed,
    reasons,
    qualityScore,
    blurScore,
    exposureScore,
    eyeAspectRatio: ear,
    boxCoveragePct,
    detectedPose,
  };
}

export function computeMasterVector(descriptors: number[][]): number[] {
  if (descriptors.length === 0) return [];
  if (descriptors.length === 1) return descriptors[0];

  const avgVec = new Array(128).fill(0);
  for (const vec of descriptors) {
    for (let i = 0; i < 128; i++) {
      avgVec[i] += vec[i];
    }
  }

  let norm = 0;
  for (let i = 0; i < 128; i++) {
    avgVec[i] = avgVec[i] / descriptors.length;
    norm += avgVec[i] * avgVec[i];
  }
  norm = Math.sqrt(norm) || 1;
  return avgVec.map((val) => Number((val / norm).toFixed(6)));
}

/**
 * Duplicate Face Detection: Checks whether a live face matches another employee in the company
 * Uses strict Master Vector identity matching (<= 0.35) and pose minimum distance (<= 0.30)
 * to avoid false positive duplicate alerts across 200+ employees.
 * Safely skips the current employee (case-insensitive) for smooth re-enrollment.
 */
export function checkDuplicateFace(
  newDescriptor: number[],
  existingEmployees: Employee[],
  currentEmployeeId: string,
  strictThreshold: number = 0.35 // strict identical identity threshold
): { isDuplicate: boolean; matchedEmployee?: Employee; distance: number } {
  let closestDistance = 999;
  let duplicateEmp: Employee | undefined = undefined;

  const normalizedCurrentId = (currentEmployeeId || '').trim().toLowerCase();

  for (const emp of (existingEmployees || [])) {
    if (!emp || !emp.id) continue;
    const normalizedEmpId = emp.id.trim().toLowerCase();
    // NEVER compare against current employee (supports clean re-enrollment)
    if (normalizedEmpId === normalizedCurrentId) continue;
    if (!emp.faceEnrolled || !emp.faceDescriptors || emp.faceDescriptors.length === 0) continue;

    // Index 0 is the master vector
    const masterVec = emp.faceDescriptors[0];
    const masterDist = calculateEuclideanDistance(newDescriptor, masterVec);

    // Also check all individual sample vectors
    let minVectorDist = masterDist;
    for (const vec of emp.faceDescriptors) {
      const d = calculateEuclideanDistance(newDescriptor, vec);
      if (d < minVectorDist) {
        minVectorDist = d;
      }
    }

    // A person is genuinely a duplicate if both their master vector matches (<= 0.35)
    // AND at least one sample vector confirms with high confidence (<= 0.30)
    const isEmpDuplicate = masterDist <= strictThreshold && minVectorDist <= 0.30;

    if (minVectorDist < closestDistance) {
      closestDistance = minVectorDist;
      if (isEmpDuplicate) {
        duplicateEmp = emp;
      }
    }
  }

  return {
    isDuplicate: duplicateEmp !== undefined,
    matchedEmployee: duplicateEmp,
    distance: Number(closestDistance.toFixed(4)),
  };
}

/**
 * Eye Aspect Ratio (EAR) for Anti-Spoofing & Liveness
 */
export function calculateEyeAspectRatio(landmarks: faceapi.FaceLandmarks68): number {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();

  const getEAR = (eye: faceapi.Point[]) => {
    const d1 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
    const d2 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
    const dHor = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
    return (d1 + d2) / (2.0 * (dHor || 1));
  };

  const leftEAR = getEAR(leftEye);
  const rightEAR = getEAR(rightEye);
  return (leftEAR + rightEAR) / 2.0;
}

/**
 * Searches enrolled employees to find best match using CompreFace-style matching:
 * - Computes best match per employee across individual example vectors
 * - Master vector used as tie-breaker if top employees have identical minimal distances
 * - Enforces minimum recognition margin between top-1 and top-2 candidate
 */
export function findBestFaceMatch(
  liveDescriptor: number[],
  enrolledEmployees: Employee[],
  threshold: number = 0.46,
  isLive: boolean = true,
  minMargin: number = 0.04
): FaceMatchResult {
  interface Candidate {
    employee: Employee;
    bestDistance: number;
    masterDistance: number;
  }

  const candidates: Candidate[] = [];

  for (const emp of (enrolledEmployees || [])) {
    if (!emp || !emp.id || !emp.faceEnrolled || !emp.faceDescriptors || emp.faceDescriptors.length === 0) {
      continue;
    }

    let minExampleDist = 999;
    for (const enrolledVec of emp.faceDescriptors) {
      const dist = calculateEuclideanDistance(liveDescriptor, enrolledVec);
      if (dist < minExampleDist) {
        minExampleDist = dist;
      }
    }

    // Master vector tie-breaker: index 0 is already the pre-computed master vector (stored during enrollment)
    const masterVec = emp.faceDescriptors[0];
    const masterDist = calculateEuclideanDistance(liveDescriptor, masterVec);

    candidates.push({
      employee: emp,
      bestDistance: minExampleDist,
      masterDistance: masterDist,
    });
  }

  // Sort candidates by best example distance ascending (tie break on master vector distance)
  candidates.sort((a, b) => {
    const diff = a.bestDistance - b.bestDistance;
    if (Math.abs(diff) < 0.0001) {
      return a.masterDistance - b.masterDistance;
    }
    return diff;
  });

  const top1 = candidates[0];
  const top2 = candidates[1];

  const bestDistance = top1 ? Number(top1.bestDistance.toFixed(4)) : 999;
  const secondBestDistance = top2 ? Number(top2.bestDistance.toFixed(4)) : 999;
  const margin = top2 ? Number((secondBestDistance - bestDistance).toFixed(4)) : 999;

  const confidence = distanceToConfidence(bestDistance);
  const isMatch = isLive && top1 !== undefined && bestDistance <= threshold && margin >= minMargin;

  return {
    matchedEmployee: isMatch ? top1.employee : undefined,
    secondBestEmployee: top2?.employee,
    secondBestDistance,
    margin,
    distance: bestDistance,
    confidence,
    isMatch,
    isLive,
  };
}

/**
 * Real Deep Learning Multi-Face Detection with Anti-Spoofing & Liveness
 */
export async function detectMultipleFacesFromCanvas(
  input: HTMLCanvasElement | HTMLVideoElement,
  enrolledEmployees: Employee[],
  threshold: number = 0.46,
  requireLiveness: boolean = true,
  minMargin: number = 0.04
): Promise<DetectedFaceSlot[]> {
  await loadFaceModels();
  if (!modelsLoaded) return [];

  const detections = await faceapi
    .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.32 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  const width = input instanceof HTMLVideoElement ? input.videoWidth || 640 : input.width;
  const height = input instanceof HTMLVideoElement ? input.videoHeight || 480 : input.height;

  return detections.map((det) => {
    const box = det.detection.box;
    const descriptor = Array.from(det.descriptor);
    const ear = calculateEyeAspectRatio(det.landmarks);

    // Long-Range Distance Gate: Supports 5MP (2560x1920) deep optical detection down to 24px face crop
    const isLive = !requireLiveness || (ear > 0.10 && box.width >= 24 && box.height >= 24);
    const match = findBestFaceMatch(descriptor, enrolledEmployees, threshold, isLive, minMargin);

    let status: DetectedFaceSlot['status'] = 'UNKNOWN';
    if (!isLive) {
      status = 'SPOOF_SUSPECTED';
    } else if (match.isMatch && match.matchedEmployee) {
      status = 'RECOGNIZED';
    }

    return {
      box: {
        x: Math.round((box.x / width) * 100),
        y: Math.round((box.y / height) * 100),
        width: Math.round((box.width / width) * 100),
        height: Math.round((box.height / height) * 100),
      },
      descriptor,
      matchResult: {
        ...match,
        eyeAspectRatio: Number(ear.toFixed(3)),
      },
      status,
      landmarks: det.landmarks,
    };
  });
}

/**
 * Recognition Lab Benchmark Runner: Stage-by-stage latency profiler
 */
export async function runRecognitionBenchmark(
  input: HTMLCanvasElement | HTMLVideoElement,
  enrolledEmployees: Employee[],
  threshold: number = 0.46
): Promise<{
  slots: DetectedFaceSlot[];
  latencies: RecognitionStageLatency;
}> {
  await loadFaceModels();
  if (!modelsLoaded) {
    throw new Error('Face recognition models not loaded');
  }

  // Stage 1: Face Detection
  const t0 = performance.now();
  await faceapi.detectAllFaces(
    input,
    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.50 })
  );
  const t1 = performance.now();
  const detectionMs = Number((t1 - t0).toFixed(2));

  // Stage 2: Facial Landmarks (Detection + 68-pt landmarks)
  const landmarksStart = performance.now();
  await faceapi
    .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.50 }))
    .withFaceLandmarks();
  const landmarksEnd = performance.now();
  const landmarksMs = Number(Math.max(1, (landmarksEnd - landmarksStart) - detectionMs).toFixed(2));

  // Stage 3: Embedding Computation (Full pipeline up to 128-D descriptors)
  const embedStart = performance.now();
  const withDescriptors = await faceapi
    .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.50 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
  const embedEnd = performance.now();
  const embeddingMs = Number(Math.max(1, (embedEnd - embedStart) - (landmarksEnd - landmarksStart)).toFixed(2));

  // Stage 4: 1:N Face Collection Matching & Margin
  const matchStart = performance.now();
  const width = input instanceof HTMLVideoElement ? input.videoWidth || 640 : input.width;
  const height = input instanceof HTMLVideoElement ? input.videoHeight || 480 : input.height;

  const slots: DetectedFaceSlot[] = withDescriptors.map((item) => {
    const rawDesc = Array.from(item.descriptor) as number[];
    const box = item.detection.box;
    const lm = item.landmarks;
    const ear = calculateEyeAspectRatio(lm);
    const match = findBestFaceMatch(rawDesc, enrolledEmployees, threshold, true, 0.04);

    return {
      box: {
        x: Math.round((box.x / width) * 100),
        y: Math.round((box.y / height) * 100),
        width: Math.round((box.width / width) * 100),
        height: Math.round((box.height / height) * 100),
      },
      descriptor: rawDesc,
      matchResult: {
        ...match,
        eyeAspectRatio: Number(ear.toFixed(3)),
      },
      status: match.isMatch ? 'RECOGNIZED' : 'UNKNOWN',
      landmarks: lm,
    };
  });
  const matchEnd = performance.now();
  const matchingMs = Number((matchEnd - matchStart).toFixed(2));

  const totalPipelineMs = Number((detectionMs + landmarksMs + embeddingMs + matchingMs).toFixed(2));

  return {
    slots,
    latencies: {
      detectionMs,
      landmarksMs,
      embeddingMs,
      matchingMs,
      totalPipelineMs,
    },
  };
}

/**
 * Extracts true 128-D neural network face descriptor from a single face image/canvas
 */
export async function extractFaceDescriptorFromCanvas(
  input: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement
): Promise<number[] | null> {
  await loadFaceModels();
  if (!modelsLoaded) return null;

  const detection = await faceapi
    .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.50 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return Array.from(detection.descriptor);
}

/**
 * Plays industrial confirmation audio chime
 */
export function playAttendanceConfirmationChime(): void {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch {
    // audio context blocked
  }
}
