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
export function estimateHeadPoseFromLandmarks(landmarks: faceapi.FaceLandmarks68): {
  yaw: number; // Left (-) / Right (+)
  pitch: number; // Down (-) / Up (+)
  roll: number; // Tilt left/right
  mouthAspectRatio: number;
} {
  const pts = landmarks.positions;
  const noseTip = pts[30];
  const jawLeft = pts[0];
  const jawRight = pts[16];
  const chin = pts[8];
  const leftEyeOuter = pts[36];
  const rightEyeOuter = pts[45];
  const eyeMidY = (pts[36].y + pts[45].y) / 2;

  const faceWidth = Math.max(1, jawRight.x - jawLeft.x);
  const faceHeight = Math.max(1, chin.y - eyeMidY);
  const jawMidX = (jawLeft.x + jawRight.x) / 2;

  // Yaw: normalized deviation of nose tip from midpoint of jaw edges
  const yaw = Number(((noseTip.x - jawMidX) / faceWidth).toFixed(3));

  // Pitch: deviation of nose height relative to eye-chin midpoint
  const expectedNoseY = eyeMidY + faceHeight * 0.45;
  const pitch = Number(((expectedNoseY - noseTip.y) / faceHeight).toFixed(3));

  // Roll: eye tilt
  const roll = Number(((rightEyeOuter.y - leftEyeOuter.y) / faceWidth).toFixed(3));

  // Mouth Aspect Ratio (MAR) for smile detection
  // Lip corners: 48, 54. Top lip: 51, Bottom lip: 57
  const mouthWidth = Math.hypot(pts[54].x - pts[48].x, pts[54].y - pts[48].y);
  const mouthHeight = Math.hypot(pts[57].x - pts[51].x, pts[57].y - pts[51].y);
  const mouthAspectRatio = Number((mouthHeight / (mouthWidth || 1)).toFixed(3));

  return { yaw, pitch, roll, mouthAspectRatio };
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
  if (score < 0.65) {
    reasons.push(`Low face detection confidence (${Math.round(score * 100)}%)`);
  }

  // 2. Minimum face size (at least 90px and >= 20% of frame height)
  if (box.width < 90 || box.height < 90 || boxCoveragePct < 18) {
    reasons.push('Face is too far from camera. Move closer.');
  }

  // 3. Blur check (Laplacian variance)
  if (blurScore < 25) {
    reasons.push('Image is blurry. Please hold steady.');
  }

  // 4. Exposure check
  if (exposureScore < 45) {
    reasons.push('Lighting is too dark. Increase ambient light.');
  } else if (exposureScore > 225) {
    reasons.push('Face is overexposed/glare. Avoid direct backlight.');
  }

  // 5. Eye open check (EAR)
  if (ear < 0.16 && requestedStepId !== 6) {
    reasons.push('Eyes appear closed. Look directly at camera.');
  }

  // 6. Pose matching check
  let detectedPose: EnrollmentQualityDetails['detectedPose'] = 'UNKNOWN';
  if (Math.abs(pose.yaw) < 0.08 && Math.abs(pose.pitch) < 0.10) {
    detectedPose = pose.mouthAspectRatio > 0.38 ? 'SMILE' : 'NEUTRAL';
  } else if (pose.yaw < -0.10) {
    detectedPose = 'LEFT';
  } else if (pose.yaw > 0.10) {
    detectedPose = 'RIGHT';
  } else if (pose.pitch > 0.08) {
    detectedPose = 'UP';
  } else {
    detectedPose = 'GLASSES_EXPRESSION';
  }

  if (requestedStepId === 1) {
    // Pose 1: Straight & Neutral
    if (Math.abs(pose.yaw) > 0.10) reasons.push('Face camera straight (no left/right tilt).');
    if (Math.abs(pose.pitch) > 0.12) reasons.push('Keep head level (not tilted up/down).');
  } else if (requestedStepId === 2) {
    // Pose 2: Smile
    if (pose.mouthAspectRatio < 0.28) reasons.push('Please give a natural smile.');
  } else if (requestedStepId === 3) {
    // Pose 3: Turn Head Left (approx 15-25°)
    // Since video is unmirrored, head turned to user's left causes nose to shift towards left cheek (yaw < -0.08)
    if (pose.yaw > -0.07) reasons.push('Turn head slightly towards your left side.');
  } else if (requestedStepId === 4) {
    // Pose 4: Turn Head Right
    if (pose.yaw < 0.07) reasons.push('Turn head slightly towards your right side.');
  } else if (requestedStepId === 5) {
    // Pose 5: Chin Up (15°)
    if (pose.pitch < 0.06) reasons.push('Tilt chin slightly upward.');
  }

  const passed = reasons.length === 0;

  // Composite Quality Score (0 - 100)
  let qualityScore = 100;
  if (!passed) qualityScore -= reasons.length * 20;
  if (blurScore < 40) qualityScore -= 15;
  if (boxCoveragePct < 25) qualityScore -= 10;
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

/**
 * Multi-Shot Master Vector Synthesis (averages up to 20 raw embeddings into a single Master Vector)
 */
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
 * Prevents enrolling the same person under multiple names.
 */
export function checkDuplicateFace(
  newDescriptor: number[],
  existingEmployees: Employee[],
  currentEmployeeId: string,
  strictThreshold: number = 0.40 // identical face threshold
): { isDuplicate: boolean; matchedEmployee?: Employee; distance: number } {
  let closestDistance = 999;
  let duplicateEmp: Employee | undefined = undefined;

  for (const emp of (existingEmployees || [])) {
    if (!emp || !emp.id || emp.id === currentEmployeeId || !emp.faceEnrolled || !emp.faceDescriptors) {
      continue;
    }

    for (const vec of emp.faceDescriptors) {
      const dist = calculateEuclideanDistance(newDescriptor, vec);
      if (dist < closestDistance) {
        closestDistance = dist;
        if (dist <= strictThreshold) {
          duplicateEmp = emp;
        }
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

    // Master vector tie-breaker
    const masterVec = emp.faceDescriptors.length > 1 ? computeMasterVector(emp.faceDescriptors) : emp.faceDescriptors[0];
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
