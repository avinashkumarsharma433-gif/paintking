import * as faceapi from '@vladmandic/face-api';
import {
  IFaceEngineProvider,
  IFaceCollection,
  RecognitionOptions,
  RecognitionPrediction,
  VerificationResult,
  FaceDetectionResult,
} from './types';
import { LocalFaceCollection } from './LocalFaceCollection';

/**
 * LegacyProvider wraps @vladmandic/face-api behind the CompreFace Engine interface.
 * Implements:
 * - CompreFace similarity: Cosine calculation (1 - D^2/2) normalized to 0.0 - 1.0
 * - Multi-example subject scoring
 * - Configurable det_prob_threshold and prediction_count
 */
export class LegacyFaceApiProvider implements IFaceEngineProvider {
  name = 'LegacyBrowserProvider';
  private collection: IFaceCollection;
  private initialized = false;

  constructor(collection?: IFaceCollection) {
    this.collection = collection || new LocalFaceCollection();
  }

  isReady(): boolean {
    return this.initialized;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    const MODEL_PATH = '/models';
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
    ]);
    this.initialized = true;
  }

  getCollection(): IFaceCollection {
    return this.collection;
  }

  async detect(
    image: HTMLCanvasElement | HTMLVideoElement,
    options?: RecognitionOptions
  ): Promise<FaceDetectionResult[]> {
    await this.initialize();
    const threshold = options?.det_prob_threshold ?? 0.50;
    const detections = await faceapi
      .detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: threshold }))
      .withFaceLandmarks();

    const w = image instanceof HTMLVideoElement ? image.videoWidth || 640 : image.width;
    const h = image instanceof HTMLVideoElement ? image.videoHeight || 480 : image.height;

    return detections.map((det) => ({
      box: {
        x: Math.round((det.detection.box.x / w) * 100),
        y: Math.round((det.detection.box.y / h) * 100),
        width: Math.round((det.detection.box.width / w) * 100),
        height: Math.round((det.detection.box.height / h) * 100),
      },
      probability: Number(det.detection.score.toFixed(4)),
      landmarks: det.landmarks.positions,
    }));
  }

  async recognize(
    image: HTMLCanvasElement | HTMLVideoElement,
    options?: RecognitionOptions
  ): Promise<RecognitionPrediction[]> {
    await this.initialize();
    const detProbThreshold = options?.det_prob_threshold ?? 0.50;
    const detections = await faceapi
      .detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: detProbThreshold }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) return [];

    const w = image instanceof HTMLVideoElement ? image.videoWidth || 640 : image.width;
    const h = image instanceof HTMLVideoElement ? image.videoHeight || 480 : image.height;

    const subjects = await this.collection.listSubjects();
    const predictions: RecognitionPrediction[] = [];

    for (const det of detections) {
      const descriptor = Array.from(det.descriptor);
      const candidates: { subjectId: string; bestDist: number; similarity: number }[] = [];

      for (const sub of subjects) {
        if (!sub.examples || sub.examples.length === 0) continue;
        let bestDist = 999;
        for (const ex of sub.examples) {
          const dist = faceapi.euclideanDistance(descriptor, ex.embedding);
          if (dist < bestDist) bestDist = dist;
        }
        // Cosine similarity mapping: sim = 1 - (dist^2)/2
        const sim = Math.max(0, Math.min(1, 1 - (bestDist * bestDist) / 2));
        candidates.push({ subjectId: sub.subject_id, bestDist, similarity: Number(sim.toFixed(4)) });
      }

      candidates.sort((a, b) => b.similarity - a.similarity);
      const topCount = options?.prediction_count ?? 1;
      const topMatches = candidates.slice(0, topCount);

      for (const match of topMatches) {
        predictions.push({
          subject: match.subjectId,
          similarity: match.similarity,
          distance: Number(match.bestDist.toFixed(4)),
          box: {
            x: Math.round((det.detection.box.x / w) * 100),
            y: Math.round((det.detection.box.y / h) * 100),
            width: Math.round((det.detection.box.width / w) * 100),
            height: Math.round((det.detection.box.height / h) * 100),
          },
          det_prob: Number(det.detection.score.toFixed(4)),
        });
      }
    }

    return predictions;
  }

  async verify(
    image: HTMLCanvasElement | HTMLVideoElement,
    targetSubjectId: string,
    options?: RecognitionOptions
  ): Promise<VerificationResult> {
    await this.initialize();
    const detProbThreshold = options?.det_prob_threshold ?? 0.50;
    const subject = await this.collection.getSubject(targetSubjectId);
    if (!subject || subject.examples.length === 0) {
      return { result: [] };
    }

    const detections = await faceapi
      .detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: detProbThreshold }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    const w = image instanceof HTMLVideoElement ? image.videoWidth || 640 : image.width;
    const h = image instanceof HTMLVideoElement ? image.videoHeight || 480 : image.height;

    const result = detections.map((det) => {
      const descriptor = Array.from(det.descriptor);
      let bestDist = 999;
      for (const ex of subject.examples) {
        const dist = faceapi.euclideanDistance(descriptor, ex.embedding);
        if (dist < bestDist) bestDist = dist;
      }
      const sim = Math.max(0, Math.min(1, 1 - (bestDist * bestDist) / 2));
      const match = sim >= 0.85; // CompreFace default verification threshold

      return {
        box: {
          x: Math.round((det.detection.box.x / w) * 100),
          y: Math.round((det.detection.box.y / h) * 100),
          width: Math.round((det.detection.box.width / w) * 100),
          height: Math.round((det.detection.box.height / h) * 100),
        },
        similarity: Number(sim.toFixed(4)),
        distance: Number(bestDist.toFixed(4)),
        match,
      };
    });

    return { result };
  }
}
