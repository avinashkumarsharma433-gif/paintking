/**
 * PK-OS Industrial Camera Orientation & Frame Transformation Service
 * Corrects camera rotation at pixel level for 0°, 90° (CW), 180° (upside down), and 270° (CCW).
 * Guarantees that face detection, landmark calculation, and embeddings always receive
 * an upright, properly proportioned pixel buffer regardless of camera physical mounting.
 */

import { CameraOrientation } from '../types/hrAttendanceTypes';

const STORAGE_KEY = 'pk_camera_orientation';

export function getStoredCameraOrientation(): CameraOrientation {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === '90' || saved === '180' || saved === '270') {
      return Number(saved) as CameraOrientation;
    }
  } catch {
    // fallback
  }
  return 0;
}

export function setStoredCameraOrientation(orientation: CameraOrientation): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(orientation));
  } catch {
    // fallback
  }
}

/**
 * Draws the source video/canvas onto targetCanvas rotated by orientation (0°, 90°, 180°, 270°)
 * with optional horizontal mirroring for user preview comfort.
 * Automatically adjusts targetCanvas dimensions so the resulting image is upright.
 */
export function drawOrientedFrame(
  source: HTMLVideoElement | HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  orientation: CameraOrientation = 0,
  mirror: boolean = false
): boolean {
  const sourceW = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const sourceH = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

  if (!sourceW || !sourceH) return false;

  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  // Determine target canvas dimensions based on rotation
  if (orientation === 90 || orientation === 270) {
    if (targetCanvas.width !== sourceH || targetCanvas.height !== sourceW) {
      targetCanvas.width = sourceH;
      targetCanvas.height = sourceW;
    }
  } else {
    if (targetCanvas.width !== sourceW || targetCanvas.height !== sourceH) {
      targetCanvas.width = sourceW;
      targetCanvas.height = sourceH;
    }
  }

  const outW = targetCanvas.width;
  const outH = targetCanvas.height;

  ctx.save();
  ctx.clearRect(0, 0, outW, outH);

  switch (orientation) {
    case 0:
      if (mirror) {
        ctx.translate(outW, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, 0, 0, sourceW, sourceH);
      break;

    case 90: // 90° Clockwise
      ctx.translate(outW, 0);
      ctx.rotate((90 * Math.PI) / 180);
      if (mirror) {
        ctx.translate(sourceW, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, 0, 0, sourceW, sourceH);
      break;

    case 180: // 180° Inverted
      ctx.translate(outW, outH);
      ctx.rotate(Math.PI);
      if (mirror) {
        ctx.translate(sourceW, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, 0, 0, sourceW, sourceH);
      break;

    case 270: // 270° (90° Counter-Clockwise)
      ctx.translate(0, outH);
      ctx.rotate((270 * Math.PI) / 180);
      if (mirror) {
        ctx.translate(sourceW, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, 0, 0, sourceW, sourceH);
      break;
  }

  ctx.restore();
  return true;
}
