import {
  IFaceEngineProvider,
  IFaceCollection,
  RecognitionOptions,
  RecognitionPrediction,
  VerificationResult,
  FaceDetectionResult,
} from './types';

export interface RemoteCompreFaceConfig {
  baseUrl: string; // e.g. http://localhost:8000
  apiKey: string;  // CompreFace service API key
}

/**
 * RemoteCompreFaceProvider: REST adapter for actual CompreFace container deployments.
 * Implements /api/v1/recognition/recognize, /api/v1/recognition/verify, /api/v1/recognition/faces
 */
export class RemoteCompreFaceProvider implements IFaceEngineProvider {
  name = 'RemoteCompreFaceProvider';
  private config: RemoteCompreFaceConfig;
  private collection: IFaceCollection;

  constructor(config: RemoteCompreFaceConfig, collection: IFaceCollection) {
    this.config = config;
    this.collection = collection;
  }

  isReady(): boolean {
    return Boolean(this.config.baseUrl && this.config.apiKey);
  }

  async initialize(): Promise<void> {
    // Health check ping
    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/recognition/subjects`, {
        headers: { 'x-api-key': this.config.apiKey },
      });
      if (!res.ok) {
        console.warn('CompreFace service responded with status:', res.status);
      }
    } catch (e) {
      console.warn('CompreFace service ping failed:', e);
    }
  }

  getCollection(): IFaceCollection {
    return this.collection;
  }

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas blob generation failed'));
      }, 'image/jpeg', 0.90);
    });
  }

  async detect(
    image: HTMLCanvasElement | HTMLVideoElement,
    options?: RecognitionOptions
  ): Promise<FaceDetectionResult[]> {
    // CompreFace detection endpoint /api/v1/detection/detect
    const canvas = image instanceof HTMLCanvasElement ? image : document.createElement('canvas');
    if (image instanceof HTMLVideoElement) {
      canvas.width = image.videoWidth || 640;
      canvas.height = image.videoHeight || 480;
      canvas.getContext('2d')?.drawImage(image, 0, 0);
    }

    const blob = await this.canvasToBlob(canvas);
    const formData = new FormData();
    formData.append('file', blob);

    const detProb = options?.det_prob_threshold ?? 0.50;
    const res = await fetch(
      `${this.config.baseUrl}/api/v1/detection/detect?det_prob_threshold=${detProb}&limit=${options?.limit || 10}`,
      {
        method: 'POST',
        headers: { 'x-api-key': this.config.apiKey },
        body: formData,
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const w = canvas.width;
    const h = canvas.height;

    return (data.result || []).map((r: any) => ({
      box: {
        x: Math.round((r.box.x_min / w) * 100),
        y: Math.round((r.box.y_min / h) * 100),
        width: Math.round(((r.box.x_max - r.box.x_min) / w) * 100),
        height: Math.round(((r.box.y_max - r.box.y_min) / h) * 100),
      },
      probability: r.box.probability,
      landmarks: r.landmarks,
    }));
  }

  async recognize(
    image: HTMLCanvasElement | HTMLVideoElement,
    options?: RecognitionOptions
  ): Promise<RecognitionPrediction[]> {
    const canvas = image instanceof HTMLCanvasElement ? image : document.createElement('canvas');
    if (image instanceof HTMLVideoElement) {
      canvas.width = image.videoWidth || 640;
      canvas.height = image.videoHeight || 480;
      canvas.getContext('2d')?.drawImage(image, 0, 0);
    }

    const blob = await this.canvasToBlob(canvas);
    const formData = new FormData();
    formData.append('file', blob);

    const detProb = options?.det_prob_threshold ?? 0.50;
    const predCount = options?.prediction_count ?? 1;

    const res = await fetch(
      `${this.config.baseUrl}/api/v1/recognition/recognize?det_prob_threshold=${detProb}&prediction_count=${predCount}`,
      {
        method: 'POST',
        headers: { 'x-api-key': this.config.apiKey },
        body: formData,
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const w = canvas.width;
    const h = canvas.height;

    const list: RecognitionPrediction[] = [];
    for (const r of data.result || []) {
      const topSubject = r.subjects?.[0];
      if (topSubject) {
        list.push({
          subject: topSubject.subject,
          similarity: topSubject.similarity,
          distance: Number((Math.sqrt(2 * (1 - topSubject.similarity))).toFixed(4)),
          box: {
            x: Math.round((r.box.x_min / w) * 100),
            y: Math.round((r.box.y_min / h) * 100),
            width: Math.round(((r.box.x_max - r.box.x_min) / w) * 100),
            height: Math.round(((r.box.y_max - r.box.y_min) / h) * 100),
          },
          det_prob: r.box.probability,
        });
      }
    }
    return list;
  }

  async verify(
    image: HTMLCanvasElement | HTMLVideoElement,
    targetSubjectId: string,
    options?: RecognitionOptions
  ): Promise<VerificationResult> {
    const canvas = image instanceof HTMLCanvasElement ? image : document.createElement('canvas');
    if (image instanceof HTMLVideoElement) {
      canvas.width = image.videoWidth || 640;
      canvas.height = image.videoHeight || 480;
      canvas.getContext('2d')?.drawImage(image, 0, 0);
    }

    const blob = await this.canvasToBlob(canvas);
    const formData = new FormData();
    formData.append('file', blob);

    const detProb = options?.det_prob_threshold ?? 0.50;
    const res = await fetch(
      `${this.config.baseUrl}/api/v1/recognition/faces/${targetSubjectId}/verify?det_prob_threshold=${detProb}`,
      {
        method: 'POST',
        headers: { 'x-api-key': this.config.apiKey },
        body: formData,
      }
    );

    if (!res.ok) return { result: [] };
    const data = await res.json();
    const w = canvas.width;
    const h = canvas.height;

    return {
      result: (data.result || []).map((r: any) => ({
        box: {
          x: Math.round((r.box.x_min / w) * 100),
          y: Math.round((r.box.y_min / h) * 100),
          width: Math.round(((r.box.x_max - r.box.x_min) / w) * 100),
          height: Math.round(((r.box.y_max - r.box.y_min) / h) * 100),
        },
        similarity: r.similarity,
        distance: Number((Math.sqrt(2 * (1 - r.similarity))).toFixed(4)),
        match: r.similarity >= 0.85,
      })),
    };
  }
}
