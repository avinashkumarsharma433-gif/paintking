import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Camera,
  X, 
  Check, 
  RefreshCw, 
  RotateCw, 
  Glasses, 
  UserCheck, 
  Sparkles, 
  Eye, 
  Sun, 
  Sliders, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Activity,
  Maximize2,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { 
  Employee, 
  CameraOrientation, 
  PoseDefinition, 
  PoseCaptureRecord, 
  PoseCategory 
} from '../../types/hrAttendanceTypes';
import { 
  loadFaceModels,
  computeMasterVector,
  checkDuplicateFace,
  playAttendanceConfirmationChime,
  generateFaceEmbedding512,
  extractBiometricBaseline,
  estimateHeadPoseDegrees,
  validatePoseMatch,
  computeLaplacianVariance,
  computeExposureScore,
  calculateEyeAspectRatio,
  ENROLLMENT_20_POSES,
  EnrollmentBaseline
} from '../../services/faceRecognitionService';
import { 
  drawOrientedFrame, 
  getStoredCameraOrientation, 
  setStoredCameraOrientation 
} from '../../services/cameraOrientationService';
import * as faceapi from '@vladmandic/face-api';

interface HREnrollFaceModalProps {
  employee: Employee;
  allEmployees?: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onSaveFaceDescriptors: (
    empId: string, 
    descriptors: number[][], 
    avatarUrl?: string, 
    poseRecords?: Record<string, PoseCaptureRecord>
  ) => void;
}

export const HREnrollFaceModal: React.FC<HREnrollFaceModalProps> = ({
  employee,
  allEmployees = [],
  isOpen,
  onClose,
  onSaveFaceDescriptors,
}) => {
  if (!employee || !employee.id) return null;

  // Selected pose being targeted
  const [selectedPoseId, setSelectedPoseId] = useState<string>('01');

  // Spectacles User Toggle (False by default for non-glasses employees)
  const [wearsGlasses, setWearsGlasses] = useState<boolean>(() => {
    return employee.wearsGlasses ?? false;
  });

  // Stored 20-Pose Records (resumable from employee.poseRecords if present)
  const [poseRecords, setPoseRecords] = useState<Record<string, PoseCaptureRecord>>(() => {
    return employee.poseRecords || {};
  });

  // Camera Orientation (0, 90, 180, 270)
  const [cameraOrientation, setCameraOrientation] = useState<CameraOrientation>(() => {
    return getStoredCameraOrientation();
  });

  // Mirror display toggle
  const [mirror, setMirror] = useState<boolean>(true);

  // Landmark mesh toggle
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);

  // Filter category in pose list
  const [activeCategory, setActiveCategory] = useState<PoseCategory | 'ALL'>('ALL');

  // Loading & Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [capturingPoseId, setCapturingPoseId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [justCapturedFlash, setJustCapturedFlash] = useState<boolean>(false);

  // Failure toast/banner
  const [lastFailure, setLastFailure] = useState<{ poseId: string; reason: string } | null>(null);

  // Duplicate face block error
  const [duplicateError, setDuplicateError] = useState<{
    matchedEmployee: Employee;
    distance: number;
    similarity: number;
    pendingPoseId: string;
  } | null>(null);
  const bypassDuplicateCheckRef = useRef<boolean>(false);

  // Live HUD telemetry
  const [liveTelemetry, setLiveTelemetry] = useState<{
    detected: boolean;
    faceCount: number;
    angles: { yaw: number; pitch: number; roll: number; interEyePixels: number };
    quality: { blurScore: number; exposureScore: number; ear: number };
    isTargetMatch: boolean;
    reasons: string[];
    box?: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // Video and Canvas Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const streamRef = useRef<MediaStream | null>(null);
  const baselineRef = useRef<EnrollmentBaseline | null>(null);

  const selectedPose = useMemo(() => {
    return ENROLLMENT_20_POSES.find((p) => p.id === selectedPoseId) || ENROLLMENT_20_POSES[0];
  }, [selectedPoseId]);

  // Load Neural Network Models on Mount
  useEffect(() => {
    loadFaceModels();
  }, []);

  // Sync orientation changes to persistent storage
  const handleOrientationChange = (deg: CameraOrientation) => {
    setCameraOrientation(deg);
    setStoredCameraOrientation(deg);
  };

  // Mark all spectacles poses as N/A if employee does not wear glasses
  const handleToggleGlasses = (checked: boolean) => {
    setWearsGlasses(checked);
    if (!checked) {
      setPoseRecords((prev) => {
        const updated = { ...prev };
        ENROLLMENT_20_POSES.filter((p) => p.category === 'SPECTACLES').forEach((p) => {
          if (!updated[p.id] || updated[p.id].status !== 'COMPLETED') {
            updated[p.id] = {
              poseId: p.id,
              poseTitle: p.title,
              category: 'SPECTACLES',
              status: 'NOT_APPLICABLE',
            };
          }
        });
        return updated;
      });
    } else {
      setPoseRecords((prev) => {
        const updated = { ...prev };
        ENROLLMENT_20_POSES.filter((p) => p.category === 'SPECTACLES').forEach((p) => {
          if (updated[p.id]?.status === 'NOT_APPLICABLE') {
            delete updated[p.id];
          }
        });
        return updated;
      });
    }
  };

  // Start Camera Stream with HD resolution
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const startCamera = async () => {
      try {
        setCameraError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera permissions not available on this browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
          };
        }
      } catch (err: unknown) {
        console.error('Camera error:', err);
        setCameraError(err instanceof Error ? err.message : 'Unable to access camera.');
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  // Real-time live HUD loop with oriented frame processing (runs every 120ms)
  useEffect(() => {
    if (!isOpen || isSuccessModalOpen || duplicateError) return;

    let animationId: number;
    let isProcessingFrame = false;

    const processLiveFrame = async () => {
      const video = videoRef.current;
      const displayCanvas = displayCanvasRef.current;
      const procCanvas = processingCanvasRef.current;

      if (!video || video.readyState !== 4 || !displayCanvas) {
        animationId = requestAnimationFrame(processLiveFrame);
        return;
      }

      // Draw oriented frame onto processing canvas
      const drawn = drawOrientedFrame(video, procCanvas, cameraOrientation, mirror);
      if (!drawn) {
        animationId = requestAnimationFrame(processLiveFrame);
        return;
      }

      // Synchronize display canvas dimensions to oriented frame
      if (displayCanvas.width !== procCanvas.width || displayCanvas.height !== procCanvas.height) {
        displayCanvas.width = procCanvas.width;
        displayCanvas.height = procCanvas.height;
      }

      const dCtx = displayCanvas.getContext('2d');
      if (dCtx) {
        // Draw oriented video frame
        dCtx.drawImage(procCanvas, 0, 0);
      }

      // Run face detection on oriented canvas every ~120ms without stacking
      if (!isProcessingFrame) {
        isProcessingFrame = true;
        try {
          const detections = await faceapi
            .detectAllFaces(procCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.18 }))
            .withFaceLandmarks()
            .withFaceExpressions();

          if (detections && detections.length > 0) {
            const primaryDet = detections[0];
            const pCtx = procCanvas.getContext('2d');

            const actualAngles = estimateHeadPoseDegrees(primaryDet.landmarks, baselineRef.current);
            const blurScore = pCtx ? computeLaplacianVariance(pCtx, primaryDet.detection.box) : 35;
            const exposureScore = pCtx ? computeExposureScore(pCtx, primaryDet.detection.box) : 120;
            const ear = calculateEyeAspectRatio(primaryDet.landmarks);

            const matchValidation = validatePoseMatch(actualAngles, selectedPose, {
              blurScore,
              exposureScore,
              ear,
              faceCount: detections.length,
            });

            setLiveTelemetry({
              detected: true,
              faceCount: detections.length,
              angles: actualAngles,
              quality: { blurScore, exposureScore, ear: Number(ear.toFixed(3)) },
              isTargetMatch: matchValidation.isMatch,
              reasons: matchValidation.reasons,
              box: {
                x: (primaryDet.detection.box.x / procCanvas.width) * 100,
                y: (primaryDet.detection.box.y / procCanvas.height) * 100,
                width: (primaryDet.detection.box.width / procCanvas.width) * 100,
                height: (primaryDet.detection.box.height / procCanvas.height) * 100,
              },
            });

            // Draw bounding box & landmarks on display canvas overlay
            if (dCtx) {
              const box = primaryDet.detection.box;
              dCtx.save();
              dCtx.lineWidth = 3;
              dCtx.strokeStyle = matchValidation.isMatch ? '#34d399' : '#f59e0b';
              dCtx.strokeRect(box.x, box.y, box.width, box.height);

              // Draw corners styling
              const cornerLen = 16;
              dCtx.lineWidth = 4;
              dCtx.strokeStyle = matchValidation.isMatch ? '#10b981' : '#c09748';
              // Top-left
              dCtx.beginPath();
              dCtx.moveTo(box.x, box.y + cornerLen);
              dCtx.lineTo(box.x, box.y);
              dCtx.lineTo(box.x + cornerLen, box.y);
              dCtx.stroke();
              // Top-right
              dCtx.beginPath();
              dCtx.moveTo(box.x + box.width - cornerLen, box.y);
              dCtx.lineTo(box.x + box.width, box.y);
              dCtx.lineTo(box.x + box.width, box.y + cornerLen);
              dCtx.stroke();

              // Draw landmarks if enabled
              if (showLandmarks && primaryDet.landmarks) {
                dCtx.fillStyle = matchValidation.isMatch ? 'rgba(52, 211, 153, 0.85)' : 'rgba(192, 151, 72, 0.85)';
                for (const pt of primaryDet.landmarks.positions) {
                  dCtx.beginPath();
                  dCtx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
                  dCtx.fill();
                }
              }
              dCtx.restore();
            }
          } else {
            setLiveTelemetry({
              detected: false,
              faceCount: 0,
              angles: { yaw: 0, pitch: 0, roll: 0, interEyePixels: 0 },
              quality: { blurScore: 0, exposureScore: 0, ear: 0 },
              isTargetMatch: false,
              reasons: ['Face not detected. Position yourself in front of camera.'],
            });
          }
        } catch {
          // ignore dropped frame
        } finally {
          isProcessingFrame = false;
        }
      }

      animationId = requestAnimationFrame(processLiveFrame);
    };

    animationId = requestAnimationFrame(processLiveFrame);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isOpen, isSuccessModalOpen, duplicateError, cameraOrientation, mirror, selectedPose, showLandmarks]);

  // MANUAL CAPTURE FUNCTION: Triggered only by operator button click
  const handleManualCapture = useCallback(async (targetPoseId: string) => {
    if (isProcessing) return;
    const targetPose = ENROLLMENT_20_POSES.find((p) => p.id === targetPoseId);
    if (!targetPose) return;

    setCapturingPoseId(targetPoseId);
    setIsProcessing(true);
    setLastFailure(null);

    try {
      const video = videoRef.current;
      if (!video) throw new Error('Video stream unavailable.');

      // 1. Capture oriented frame into high-res snapshot canvas
      const snapCanvas = document.createElement('canvas');
      const drawn = drawOrientedFrame(video, snapCanvas, cameraOrientation, mirror);
      if (!drawn) throw new Error('Failed to capture frame from video.');

      const sCtx = snapCanvas.getContext('2d');
      if (!sCtx) throw new Error('Canvas context error.');

      // 2. Detect face on oriented snapshot
      const detections = await faceapi
        .detectAllFaces(snapCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.18 }))
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors();

      // 3. Verify exactly one face is present
      if (!detections || detections.length === 0) {
        throw new Error('Face not detected. Please position face clearly in the camera frame.');
      }
      if (detections.length > 1) {
        throw new Error(`Multiple faces (${detections.length}) detected. Only the enrolling employee must be in view.`);
      }

      const primary = detections[0];
      const actualAngles = estimateHeadPoseDegrees(primary.landmarks, baselineRef.current);
      const blurScore = computeLaplacianVariance(sCtx, primary.detection.box);
      const exposureScore = computeExposureScore(sCtx, primary.detection.box);
      const ear = calculateEyeAspectRatio(primary.landmarks);

      // 4. Validate pose angles and image quality against target pose
      const validation = validatePoseMatch(actualAngles, targetPose, {
        blurScore,
        exposureScore,
        ear,
        faceCount: 1,
      });

      if (!validation.isMatch) {
        const failureReason = validation.reasons[0] || 'Pose angles or image quality did not meet requirements.';
        setLastFailure({ poseId: targetPoseId, reason: failureReason });
        setPoseRecords((prev) => ({
          ...prev,
          [targetPoseId]: {
            poseId: targetPoseId,
            poseTitle: targetPose.title,
            category: targetPose.category,
            status: 'FAILED',
            failureReason,
            actualYaw: actualAngles.yaw,
            actualPitch: actualAngles.pitch,
            actualRoll: actualAngles.roll,
            qualityScore: validation.qualityScore,
          },
        }));
        return;
      }

      // 5. Generate high-fidelity 512-D ArcFace embedding vector
      const base128 = Array.from(primary.descriptor);
      const descriptor512 = await generateFaceEmbedding512(snapCanvas, primary.detection.box, base128);

      // 6. Crop square avatar thumbnail
      const box = primary.detection.box;
      const cropSize = Math.max(box.width, box.height) * 1.25;
      const cropX = Math.max(0, box.x + box.width / 2 - cropSize / 2);
      const cropY = Math.max(0, box.y + box.height / 2 - cropSize / 2);
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = 180;
      cropCanvas.height = 180;
      const cCtx = cropCanvas.getContext('2d');
      if (cCtx) {
        cCtx.drawImage(snapCanvas, cropX, cropY, cropSize, cropSize, 0, 0, 180, 180);
      }
      const imgDataUrl = cropCanvas.toDataURL('image/jpeg', 0.85);

      // 7. Strict duplicate check on Pose 01 Straight Front against other employees
      if (!bypassDuplicateCheckRef.current && targetPoseId === '01' && allEmployees.length > 0) {
        const dup = checkDuplicateFace(descriptor512, allEmployees, employee.id, 0.35);
        if (dup.isDuplicate && dup.matchedEmployee) {
          const similarity = Math.round(Math.max(70, Math.min(99, (1 - dup.distance / 0.40) * 30 + 70)));
          setDuplicateError({
            matchedEmployee: dup.matchedEmployee,
            distance: dup.distance,
            similarity,
            pendingPoseId: targetPoseId,
          });
          return;
        }
      }

      // 8. Store baseline from Pose 01 for relative pitch/jaw calibration
      if (targetPoseId === '01' && primary.landmarks) {
        baselineRef.current = extractBiometricBaseline(primary.landmarks);
      }

      // 9. Save accepted record
      const newRecord: PoseCaptureRecord = {
        poseId: targetPoseId,
        poseTitle: targetPose.title,
        category: targetPose.category,
        status: 'COMPLETED',
        descriptor: descriptor512,
        imgDataUrl,
        actualYaw: actualAngles.yaw,
        actualPitch: actualAngles.pitch,
        actualRoll: actualAngles.roll,
        qualityScore: validation.qualityScore,
        capturedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isSpectacles: targetPose.category === 'SPECTACLES',
      };

      setPoseRecords((prev) => ({
        ...prev,
        [targetPoseId]: newRecord,
      }));

      // Audio and visual success flash
      playAttendanceConfirmationChime();
      setJustCapturedFlash(true);
      setTimeout(() => setJustCapturedFlash(false), 250);

      // Advance selected pose to the next pending pose automatically
      const currentIdx = ENROLLMENT_20_POSES.findIndex((p) => p.id === targetPoseId);
      const nextPending = ENROLLMENT_20_POSES.slice(currentIdx + 1).find((p) => {
        if (!wearsGlasses && p.category === 'SPECTACLES') return false;
        return !poseRecords[p.id] || poseRecords[p.id].status !== 'COMPLETED';
      }) || ENROLLMENT_20_POSES.find((p) => {
        if (!wearsGlasses && p.category === 'SPECTACLES') return false;
        return p.id !== targetPoseId && (!poseRecords[p.id] || poseRecords[p.id].status !== 'COMPLETED');
      });

      if (nextPending) {
        setSelectedPoseId(nextPending.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Capture failed.';
      setLastFailure({ poseId: targetPoseId, reason: msg });
      setPoseRecords((prev) => ({
        ...prev,
        [targetPoseId]: {
          poseId: targetPoseId,
          poseTitle: targetPose.title,
          category: targetPose.category,
          status: 'FAILED',
          failureReason: msg,
        },
      }));
    } finally {
      setIsProcessing(false);
      setCapturingPoseId(null);
    }
  }, [allEmployees, cameraOrientation, employee.id, isProcessing, mirror, poseRecords, wearsGlasses]);

  // Overall Completion Calculation
  const stats = useMemo(() => {
    const applicablePoses = ENROLLMENT_20_POSES.filter((p) => {
      if (!wearsGlasses && p.category === 'SPECTACLES') return false;
      return true;
    });

    const total = applicablePoses.length;
    let completed = 0;
    let failed = 0;

    applicablePoses.forEach((p) => {
      const rec = poseRecords[p.id];
      if (rec?.status === 'COMPLETED') completed++;
      else if (rec?.status === 'FAILED') failed++;
    });

    const pending = Math.max(0, total - completed - failed);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isComplete = completed === total && total > 0;

    return { total, completed, pending, failed, pct, isComplete };
  }, [poseRecords, wearsGlasses]);

  // Save & Finalize Biometrics (Computes 512-D centroid master vector)
  const handleFinalizeSave = () => {
    const records = Object.values(poseRecords) as PoseCaptureRecord[];
    const validRecords = records.filter(
      (r) => r.status === 'COMPLETED' && r.descriptor && r.descriptor.length === 512
    );

    if (validRecords.length === 0) return;

    const rawDescriptors = validRecords.map((r) => r.descriptor as number[]);
    const masterVector = computeMasterVector(rawDescriptors);
    const combinedDescriptors = [masterVector, ...rawDescriptors];

    const avatarUrl = poseRecords['01']?.imgDataUrl || validRecords[0]?.imgDataUrl || employee.avatarUrl;

    setIsSuccessModalOpen(true);
    playAttendanceConfirmationChime();

    setTimeout(() => {
      onSaveFaceDescriptors(employee.id, combinedDescriptors, avatarUrl, poseRecords);
      onClose();
    }, 1800);
  };

  // Reset all captures
  const handleResetAll = () => {
    if (window.confirm('Reset all 20 manual pose captures for this employee?')) {
      setPoseRecords({});
      setSelectedPoseId('01');
      baselineRef.current = null;
      setLastFailure(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#17191c] text-white rounded-[24px] border border-[#30333a] shadow-2xl w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* HEADER BAR */}
        <div className="px-5 py-4 border-b border-[#2d3139] flex flex-wrap items-center justify-between gap-4 bg-[#1e2127]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#c09748]/20 border border-[#c09748]/40 flex items-center justify-center text-[#c09748]">
              <Camera size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">
                  PK-OS Industrial Biometrics
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  20-Pose Manual Protocol
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                  512-D ArcFace
                </span>
              </div>
              <h2 className="text-lg font-serif font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{employee.name}</span>
                <span className="text-xs font-mono text-white/50">({employee.id})</span>
              </h2>
            </div>
          </div>

          {/* Top Progress & Completion Pill */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-[#17191c] px-4 py-2 rounded-full border border-[#30333a]">
              <div className="text-right">
                <span className="text-[10px] uppercase text-white/50 block font-semibold">Progress</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {stats.completed} / {stats.total} Completed ({stats.pct}%)
                </span>
              </div>
              <div className="w-20 bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
            </div>

            {/* Spectacles Toggle */}
            <label className="flex items-center gap-2 text-xs font-medium text-white/80 cursor-pointer bg-[#17191c] px-3 py-2 rounded-full border border-[#30333a] hover:border-[#c09748]/50 transition">
              <Glasses size={15} className={wearsGlasses ? 'text-[#c09748]' : 'text-white/40'} />
              <span>Wears Spectacles</span>
              <input
                type="checkbox"
                checked={wearsGlasses}
                onChange={(e) => handleToggleGlasses(e.target.checked)}
                className="w-4 h-4 accent-[#c09748] rounded cursor-pointer"
              />
            </label>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* MAIN BODY: 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          
          {/* LEFT COLUMN: LIVE ORIENTED CAMERA FEED & REAL-TIME HUD (5 COLS) */}
          <div className="lg:col-span-5 bg-[#121417] p-4 flex flex-col gap-3 border-r border-[#2d3139] overflow-y-auto">
            
            {/* Camera Preview Frame Container */}
            <div className="relative aspect-4/3 w-full bg-black rounded-[20px] overflow-hidden border border-[#30333a] shadow-inner flex items-center justify-center">
              {/* Hidden raw video element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className="hidden"
              />

              {/* Display canvas rendering oriented frame + HUD */}
              <canvas
                ref={displayCanvasRef}
                className={`w-full h-full object-cover transition-opacity duration-150 ${
                  justCapturedFlash ? 'opacity-20 bg-white' : 'opacity-100'
                }`}
              />

              {/* Camera Error Message */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90">
                  <AlertCircle size={32} className="text-rose-400 mb-2" />
                  <p className="text-xs text-rose-300 font-semibold">{cameraError}</p>
                  <p className="text-[11px] text-white/50 mt-1">Please allow camera permissions and reload.</p>
                </div>
              )}

              {/* Orientation Watermark Badge */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-white/80 font-mono">
                <Compass size={11} className="text-[#c09748]" />
                <span>Camera: {cameraOrientation}°</span>
              </div>

              {/* Target Pose Guideline Overlay Banner */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono">
                <span className="text-[#c09748] font-bold">Pose {selectedPose.id}:</span>
                <span className="text-white/80">Y {selectedPose.targetYaw}° | P {selectedPose.targetPitch}° | R {selectedPose.targetRoll}°</span>
              </div>

              {/* Live Match Indicator Bar */}
              <div className="absolute bottom-2.5 inset-x-2.5">
                {liveTelemetry?.detected ? (
                  <div className={`p-2.5 rounded-[14px] backdrop-blur-md border text-xs flex items-center justify-between gap-2 shadow-lg transition-all ${
                    liveTelemetry.isTargetMatch
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200 shadow-emerald-900/30'
                      : 'bg-black/80 border-amber-500/50 text-amber-200'
                  }`}>
                    <div className="flex items-center gap-2 truncate">
                      {liveTelemetry.isTargetMatch ? (
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 animate-pulse" />
                      ) : (
                        <Info size={16} className="text-amber-400 shrink-0" />
                      )}
                      <span className="truncate font-medium">
                        {liveTelemetry.isTargetMatch
                          ? '✓ Ready: Face pose matches target! Click capture below.'
                          : liveTelemetry.reasons[0] || 'Adjust pose to match target angles.'}
                      </span>
                    </div>

                    <div className="shrink-0 font-mono text-[11px] px-2 py-0.5 rounded-full bg-white/10 font-bold">
                      {liveTelemetry.isTargetMatch ? 'READY' : 'ADJUST'}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded-[14px] bg-black/70 border border-white/10 text-white/50 text-xs flex items-center justify-center gap-1.5">
                    <Activity size={14} className="animate-spin text-[#c09748]" />
                    <span>Searching for face in frame...</span>
                  </div>
                )}
              </div>
            </div>

            {/* CAMERA CONTROLS TOOLBAR: Orientation, Mirror, Landmarks */}
            <div className="bg-[#1a1c22] p-3 rounded-[18px] border border-[#2d3139] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-white/50 mr-1 flex items-center gap-1">
                  <RotateCw size={11} className="text-[#c09748]" />
                  <span>Mount Rotation:</span>
                </span>
                {([0, 90, 180, 270] as CameraOrientation[]).map((deg) => (
                  <button
                    key={deg}
                    onClick={() => handleOrientationChange(deg)}
                    className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer border ${
                      cameraOrientation === deg
                        ? 'bg-[#c09748] text-[#17191c] border-[#c09748] shadow-xs'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMirror(!mirror)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                    mirror
                      ? 'bg-white/15 text-white border-white/30'
                      : 'bg-white/5 text-white/50 border-white/10'
                  }`}
                  title="Toggle horizontal mirror display"
                >
                  Mirror {mirror ? 'ON' : 'OFF'}
                </button>

                <button
                  onClick={() => setShowLandmarks(!showLandmarks)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                    showLandmarks
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-white/5 text-white/50 border-white/10'
                  }`}
                  title="Toggle 68 facial landmark mesh"
                >
                  Mesh {showLandmarks ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* LIVE TELEMETRY GAUGES HUD */}
            <div className="bg-[#1a1c22] p-3.5 rounded-[18px] border border-[#2d3139] space-y-2.5">
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5">
                <span className="font-semibold text-white/70 flex items-center gap-1.5">
                  <Activity size={13} className="text-[#c09748]" />
                  <span>Live Geometric HUD</span>
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  Inter-eye: {liveTelemetry?.angles.interEyePixels || 0}px (Min 45px)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {/* YAW GAUGE */}
                <div className="p-2 rounded-[14px] bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/50 block font-semibold uppercase">Yaw (Turn)</span>
                  <div className="text-base font-bold font-mono text-white mt-0.5">
                    {liveTelemetry?.angles ? `${liveTelemetry.angles.yaw > 0 ? '+' : ''}${liveTelemetry.angles.yaw}°` : '--'}
                  </div>
                  <span className="text-[10px] text-[#c09748] font-mono block">
                    Target: {selectedPose.targetYaw}° (±{selectedPose.yawTolerance}°)
                  </span>
                </div>

                {/* PITCH GAUGE */}
                <div className="p-2 rounded-[14px] bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/50 block font-semibold uppercase">Pitch (Tilt)</span>
                  <div className="text-base font-bold font-mono text-white mt-0.5">
                    {liveTelemetry?.angles ? `${liveTelemetry.angles.pitch > 0 ? '+' : ''}${liveTelemetry.angles.pitch}°` : '--'}
                  </div>
                  <span className="text-[10px] text-[#c09748] font-mono block">
                    Target: {selectedPose.targetPitch}° (±{selectedPose.pitchTolerance}°)
                  </span>
                </div>

                {/* ROLL GAUGE */}
                <div className="p-2 rounded-[14px] bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/50 block font-semibold uppercase">Roll (Tilt)</span>
                  <div className="text-base font-bold font-mono text-white mt-0.5">
                    {liveTelemetry?.angles ? `${liveTelemetry.angles.roll > 0 ? '+' : ''}${liveTelemetry.angles.roll}°` : '--'}
                  </div>
                  <span className="text-[10px] text-[#c09748] font-mono block">
                    Target: {selectedPose.targetRoll}° (±{selectedPose.rollTolerance}°)
                  </span>
                </div>
              </div>

              {/* Quality Indicators: Blur, Lighting, Eyes */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-white/60">
                <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 text-center">
                  <span>Sharpness: </span>
                  <strong className={liveTelemetry?.quality.blurScore && liveTelemetry.quality.blurScore >= 20 ? 'text-emerald-400' : 'text-amber-400'}>
                    {liveTelemetry?.quality.blurScore || 0}
                  </strong>
                </div>
                <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 text-center">
                  <span>Lighting: </span>
                  <strong className={liveTelemetry?.quality.exposureScore && liveTelemetry.quality.exposureScore >= 25 && liveTelemetry.quality.exposureScore <= 240 ? 'text-emerald-400' : 'text-amber-400'}>
                    {liveTelemetry?.quality.exposureScore || 0}
                  </strong>
                </div>
                <div className="p-1.5 rounded-lg bg-black/30 border border-white/5 text-center">
                  <span>Eyes: </span>
                  <strong className={liveTelemetry?.quality.ear && liveTelemetry.quality.ear >= 0.12 ? 'text-emerald-400' : 'text-amber-400'}>
                    {liveTelemetry?.quality.ear && liveTelemetry.quality.ear >= 0.12 ? 'OPEN' : 'LOW'}
                  </strong>
                </div>
              </div>
            </div>

            {/* DEDICATED CAPTURE ACTION BUTTON FOR CURRENT SELECTED POSE */}
            <div className="bg-[#1a1c22] p-4 rounded-[20px] border border-[#2d3139] space-y-2 mt-auto">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#c09748] block">Active Pose Target</span>
                  <strong className="text-sm text-white">Pose {selectedPose.id}: {selectedPose.title}</strong>
                </div>
                <span className="text-xs text-white/50">{selectedPose.hindiTitle}</span>
              </div>

              {/* Failure Error Callout if previous attempt failed */}
              {lastFailure && lastFailure.poseId === selectedPose.id && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Validation Rejected:</strong>
                    <span>{lastFailure.reason}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleManualCapture(selectedPose.id)}
                disabled={isProcessing}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-98 ${
                  capturingPoseId === selectedPose.id
                    ? 'bg-amber-500 text-black animate-pulse'
                    : liveTelemetry?.isTargetMatch
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-900/40'
                    : 'bg-[#c09748] hover:bg-[#a97e35] text-[#17191c]'
                }`}
              >
                {capturingPoseId === selectedPose.id ? (
                  <>
                    <Activity size={16} className="animate-spin" />
                    <span>Validating & Capturing...</span>
                  </>
                ) : poseRecords[selectedPose.id]?.status === 'COMPLETED' ? (
                  <>
                    <RefreshCw size={15} />
                    <span>Retake Pose {selectedPose.id}</span>
                  </>
                ) : (
                  <>
                    <Camera size={16} />
                    <span>Capture Pose {selectedPose.id} (Manual Trigger)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: 20-POSE MANUAL CAPTURE PANEL (7 COLS) */}
          <div className="lg:col-span-7 bg-[#17191c] p-4 flex flex-col gap-3 overflow-y-auto">
            
            {/* Category Filter Pills & Batch Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2d3139] pb-3">
              <div className="flex items-center gap-1.5">
                {(['ALL', 'STANDARD', 'SPECTACLES', 'ADDITIONAL'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border ${
                      activeCategory === cat
                        ? 'bg-[#c09748] text-[#17191c] border-[#c09748] shadow-xs'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {cat === 'ALL' && 'All 20 Poses'}
                    {cat === 'STANDARD' && 'Standard (12)'}
                    {cat === 'SPECTACLES' && 'Spectacles (6)'}
                    {cat === 'ADDITIONAL' && 'Appearance (2)'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetAll}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-white/50 hover:text-rose-300 border border-white/10 hover:border-rose-400/40 transition cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>Reset All</span>
                </button>
              </div>
            </div>

            {/* 20 POSES LIST CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 overflow-y-auto max-h-[58vh] pr-1">
              {ENROLLMENT_20_POSES.filter((pose) => {
                if (activeCategory !== 'ALL' && pose.category !== activeCategory) return false;
                return true;
              }).map((pose) => {
                const record = poseRecords[pose.id];
                const isSelected = selectedPoseId === pose.id;
                const isCompleted = record?.status === 'COMPLETED';
                const isFailed = record?.status === 'FAILED';
                const isNA = record?.status === 'NOT_APPLICABLE' || (!wearsGlasses && pose.category === 'SPECTACLES');
                const isCapturing = capturingPoseId === pose.id;

                return (
                  <div
                    key={pose.id}
                    onClick={() => setSelectedPoseId(pose.id)}
                    className={`p-3 rounded-[18px] border transition cursor-pointer relative flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#22252c] border-[#c09748] ring-1 ring-[#c09748]/50 shadow-md'
                        : isCompleted
                        ? 'bg-[#1b2320] border-emerald-500/40 hover:border-emerald-500/70'
                        : isFailed
                        ? 'bg-[#271c1f] border-rose-500/40'
                        : isNA
                        ? 'bg-white/2 border-white/5 opacity-50'
                        : 'bg-[#1a1c22] border-[#2d3139] hover:border-white/20'
                    }`}
                  >
                    {/* Top Row: Pose ID, Title & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-400 text-black'
                            : isSelected
                            ? 'bg-[#c09748] text-black'
                            : 'bg-white/10 text-white/70'
                        }`}>
                          {pose.id}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight">{pose.title}</h4>
                          <span className="text-[10px] text-white/50">{pose.hindiTitle}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono border shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isFailed
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : isNA
                          ? 'bg-white/5 text-white/40 border-white/10'
                          : isSelected && liveTelemetry?.isTargetMatch
                          ? 'bg-emerald-400 text-black border-emerald-400 animate-pulse'
                          : 'bg-white/5 text-white/60 border-white/10'
                      }`}>
                        {isCompleted && '✓ DONE'}
                        {isFailed && 'FAILED'}
                        {isNA && 'N/A'}
                        {!isCompleted && !isFailed && !isNA && (isSelected && liveTelemetry?.isTargetMatch ? 'READY' : 'PENDING')}
                      </span>
                    </div>

                    {/* Middle: Target Angles & Snapshot thumbnail if completed */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[10px] text-white/60">
                      <div className="font-mono">
                        <span>Y:{pose.targetYaw}° </span>
                        <span>P:{pose.targetPitch}° </span>
                        <span>R:{pose.targetRoll}°</span>
                      </div>

                      {record?.imgDataUrl && (
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/50 shrink-0">
                          <img src={record.imgDataUrl} alt={pose.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Bottom: Error reason if failed OR Manual Capture Trigger Button */}
                    {isFailed && record?.failureReason && (
                      <p className="text-[10px] text-rose-300 truncate font-medium">
                        {record.failureReason}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPoseId(pose.id);
                          handleManualCapture(pose.id);
                        }}
                        disabled={isProcessing || isNA}
                        className={`w-full py-1.5 px-3 rounded-full text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isNA
                            ? 'bg-white/5 text-white/30 cursor-not-allowed'
                            : isCompleted
                            ? 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/10'
                            : isSelected && liveTelemetry?.isTargetMatch
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-xs'
                            : 'bg-white/10 hover:bg-[#c09748] hover:text-black text-white border border-white/15'
                        }`}
                      >
                        {isCapturing ? (
                          <>
                            <Activity size={12} className="animate-spin" />
                            <span>Validating...</span>
                          </>
                        ) : isCompleted ? (
                          <>
                            <RefreshCw size={11} />
                            <span>Retake</span>
                          </>
                        ) : (
                          <>
                            <Camera size={11} />
                            <span>Capture {pose.id}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM COMPLETION & FINALIZE ACTION BAR */}
            <div className="mt-auto pt-3 border-t border-[#2d3139] flex flex-wrap items-center justify-between gap-3 bg-[#1e2127] p-3 rounded-[20px]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className={stats.isComplete ? 'text-emerald-400' : 'text-white/40'} />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {stats.isComplete ? 'Enrollment Complete & Ready' : `Incomplete: ${stats.pending} poses remaining`}
                  </span>
                  <span className="text-[10px] text-white/50">
                    {wearsGlasses ? 'Full 20-Pose Standard + Spectacles Model' : '14-Pose Model (Spectacles Marked N/A)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white/70 hover:text-white border border-white/15 hover:bg-white/10 transition cursor-pointer"
                >
                  Save Incomplete & Resume Later
                </button>

                <button
                  onClick={handleFinalizeSave}
                  disabled={!stats.isComplete}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-lg ${
                    stats.isComplete
                      ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-emerald-900/40 animate-bounce'
                      : 'bg-white/10 text-white/30 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>Save & Finalize Biometrics</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DUPLICATE FACE MODAL OVERLAY */}
        {duplicateError && (
          <div className="absolute inset-0 z-40 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="bg-[#1f232b] p-6 rounded-[24px] border border-rose-500/40 max-w-md w-full shadow-2xl space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
                <ShieldAlert size={28} />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Duplicate Biometric Conflict</h3>
                <p className="text-xs text-rose-300 mt-1">
                  This face matches existing employee <strong>{duplicateError.matchedEmployee.name}</strong> ({duplicateError.matchedEmployee.id}) with {duplicateError.similarity}% confidence.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDuplicateError(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                >
                  Cancel & Retry Pose
                </button>

                <button
                  onClick={() => {
                    bypassDuplicateCheckRef.current = true;
                    setDuplicateError(null);
                    handleManualCapture(duplicateError.pendingPoseId);
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
                >
                  Authorize Re-enrollment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS CONFIRMATION MODAL */}
        {isSuccessModalOpen && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="bg-[#1f232b] p-8 rounded-[24px] border border-emerald-500/50 max-w-sm w-full shadow-2xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-white">Biometrics Enrolled!</h3>
                <p className="text-xs text-emerald-300 mt-1 font-mono">
                  {stats.completed} high-resolution poses saved with 512-D ArcFace encryption.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
