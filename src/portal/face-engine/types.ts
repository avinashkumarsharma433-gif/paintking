/**
 * CompreFace-style Face Engine Types & Interfaces
 * Architecture matches enterprise face services (Detection, Recognition, Verification, Collections)
 */

export interface BoundingBox {
  x: number; // percentage (0 - 100) or pixel
  y: number;
  width: number;
  height: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface FaceLandmarks5 {
  leftEye: Point2D;
  rightEye: Point2D;
  nose: Point2D;
  mouthLeft: Point2D;
  mouthRight: Point2D;
}

export interface HeadPoseAngles {
  pitch: number; // up/down
  yaw: number;   // left/right
  roll: number;  // tilt
}

export interface FaceDetectionResult {
  box: BoundingBox;
  probability: number;
  landmarks?: Point2D[] | FaceLandmarks5;
  headPose?: HeadPoseAngles;
  qualityScore?: number;
}

export interface SubjectExample {
  image_id: string;
  embedding: number[];
  model_name: string;
  model_version: string;
  pose_label?: string;
  quality_score?: number;
  created_at: string;
}

export interface Subject {
  subject_id: string; // Employee ID
  name?: string;
  examples: SubjectExample[];
}

export interface RecognitionPrediction {
  subject: string; // subject_id / employee_id
  similarity: number; // 0.0 to 1.0 (cosine or calibrated similarity)
  distance: number;
  box: BoundingBox;
  det_prob: number;
}

export interface RecognitionOptions {
  det_prob_threshold?: number;
  limit?: number; // max faces to detect
  prediction_count?: number; // top N predictions per face
  min_margin?: number; // margin over 2nd best candidate
}

export interface VerificationResult {
  result: {
    box: BoundingBox;
    similarity: number;
    distance: number;
    match: boolean;
  }[];
}

// Core Engine Interfaces
export interface IFaceDetector {
  name: string;
  detect(image: HTMLCanvasElement | ImageData | ImageBitmap, options?: { det_prob_threshold?: number; limit?: number }): Promise<FaceDetectionResult[]>;
}

export interface IEmbeddingCalculator {
  name: string;
  version: string;
  dimensions: number; // 128 or 512
  calculate(faceCrop: HTMLCanvasElement | ImageData | ImageBitmap): Promise<number[]>;
}

export interface IFaceCollection {
  addExample(subjectId: string, embedding: number[], metadata?: { pose?: string; quality?: number; modelName?: string; modelVersion?: string }): Promise<SubjectExample>;
  getSubject(subjectId: string): Promise<Subject | null>;
  listSubjects(): Promise<Subject[]>;
  deleteSubject(subjectId: string): Promise<boolean>;
  deleteExample(subjectId: string, imageId: string): Promise<boolean>;
  clear(): Promise<void>;
}

export interface IFaceEngineProvider {
  name: string;
  isReady(): boolean;
  initialize(): Promise<void>;
  detect(image: HTMLCanvasElement | HTMLVideoElement, options?: RecognitionOptions): Promise<FaceDetectionResult[]>;
  recognize(image: HTMLCanvasElement | HTMLVideoElement, options?: RecognitionOptions): Promise<RecognitionPrediction[]>;
  verify(image: HTMLCanvasElement | HTMLVideoElement, targetSubjectId: string, options?: RecognitionOptions): Promise<VerificationResult>;
  getCollection(): IFaceCollection;
}
