import * as faceapi from '@vladmandic/face-api';
import { Employee } from '../types/hrAttendanceTypes';

export interface FaceMatchResult {
  matchedEmployee?: Employee;
  distance: number;
  confidence: number; // 0% - 100%
  isMatch: boolean;
  isLive: boolean; // Anti-spoofing check
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
 * Normalizes Euclidean distance into confidence percentage (FaceNet ResNet-34)
 */
export function distanceToConfidence(distance: number): number {
  if (distance <= 0) return 100;
  if (distance >= 0.70) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - distance / 0.60) * 100)));
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

  for (const emp of existingEmployees) {
    if (emp.id === currentEmployeeId || !emp.faceEnrolled || !emp.faceDescriptors) {
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
 * Searches enrolled employees to find best match using Strict/Normal/Fast thresholds
 */
export function findBestFaceMatch(
  liveDescriptor: number[],
  enrolledEmployees: Employee[],
  threshold: number = 0.46,
  isLive: boolean = true
): FaceMatchResult {
  let bestDistance = 999;
  let bestMatch: Employee | undefined = undefined;

  for (const emp of enrolledEmployees) {
    if (!emp.faceEnrolled || !emp.faceDescriptors || emp.faceDescriptors.length === 0) {
      continue;
    }

    for (const enrolledVec of emp.faceDescriptors) {
      const dist = calculateEuclideanDistance(liveDescriptor, enrolledVec);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestMatch = emp;
      }
    }
  }

  const confidence = distanceToConfidence(bestDistance);
  const isMatch = isLive && bestDistance <= threshold && bestMatch !== undefined;

  return {
    matchedEmployee: isMatch ? bestMatch : undefined,
    distance: Number(bestDistance.toFixed(4)),
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
  requireLiveness: boolean = true
): Promise<DetectedFaceSlot[]> {
  await loadFaceModels();
  if (!modelsLoaded) return [];

  const detections = await faceapi
    .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.50 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  const width = input instanceof HTMLVideoElement ? input.videoWidth || 640 : input.width;
  const height = input instanceof HTMLVideoElement ? input.videoHeight || 480 : input.height;

  return detections.map((det) => {
    const box = det.detection.box;
    const descriptor = Array.from(det.descriptor);
    const ear = calculateEyeAspectRatio(det.landmarks);

    const isLive = !requireLiveness || (ear > 0.14 && box.width > 50 && box.height > 50);
    const match = findBestFaceMatch(descriptor, enrolledEmployees, threshold, isLive);

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
