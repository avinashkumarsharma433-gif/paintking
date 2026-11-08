import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera,
  X, 
  Check, 
  RefreshCw, 
  Upload, 
  Smile, 
  Glasses, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  UserCheck, 
  Sparkles, 
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { Employee, EnrollmentQualityDetails } from '../../types/hrAttendanceTypes';
import { 
  loadFaceModels,
  computeMasterVector,
  checkDuplicateFace,
  assessEnrollmentQuality,
  playAttendanceConfirmationChime
} from '../../services/faceRecognitionService';
import * as faceapi from '@vladmandic/face-api';

interface HREnrollFaceModalProps {
  employee: Employee;
  allEmployees?: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onSaveFaceDescriptors: (empId: string, descriptors: number[][], avatarUrl?: string) => void;
}

interface PoseInstruction {
  id: number;
  title: string;
  subtitle: string;
  hindiInstruction: string;
  icon: React.ReactNode;
  guideVisual: string;
}

export const HREnrollFaceModal: React.FC<HREnrollFaceModalProps> = ({
  employee,
  allEmployees = [],
  isOpen,
  onClose,
  onSaveFaceDescriptors,
}) => {
  if (!employee || !employee.id) return null;

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const currentStepIndexRef = useRef<number>(0);
  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  const [capturedPoses, setCapturedPoses] = useState<{ stepId: number; label: string; descriptor: number[]; imgDataUrl: string }[]>([]);
  const capturedPosesRef = useRef<{ stepId: number; label: string; descriptor: number[]; imgDataUrl: string }[]>([]);
  useEffect(() => {
    capturedPosesRef.current = capturedPoses;
  }, [capturedPoses]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [justCapturedFlash, setJustCapturedFlash] = useState(false);

  // Real-time quality gate & auto-capture
  const [qualityDetails, setQualityDetails] = useState<EnrollmentQualityDetails | null>(null);
  const [steadyHoldProgress, setSteadyHoldProgress] = useState<number>(0);
  const [detectedBox, setDetectedBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Duplicate face block error
  const [duplicateError, setDuplicateError] = useState<{
    matchedEmployee: Employee;
    distance: number;
    similarity: number;
    pendingPose?: { stepId: number; label: string; descriptor: number[]; imgDataUrl: string };
  } | null>(null);
  const [adminOverrideReason, setAdminOverrideReason] = useState<string>('');
  const [showOverridePanel, setShowOverridePanel] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const POSE_STEPS: PoseInstruction[] = [
    {
      id: 1,
      title: 'Straight & Neutral',
      subtitle: 'Look directly at camera',
      hindiInstruction: 'सीधा कैमरे की तरफ देखें (Look Straight)',
      icon: <UserCheck size={24} className="text-[#c09748]" />,
      guideVisual: 'CENTER',
    },
    {
      id: 2,
      title: 'Natural Smile',
      subtitle: 'Smile naturally with eyes open',
      hindiInstruction: 'हल्की मुस्कान दें (Smile Naturally)',
      icon: <Smile size={24} className="text-[#c09748]" />,
      guideVisual: 'CENTER_SMILE',
    },
    {
      id: 3,
      title: 'Turn Head Left',
      subtitle: 'Turn head slightly left (15°)',
      hindiInstruction: 'चेहरे को थोड़ा बायीं तरफ घुमाएं (Turn Left)',
      icon: <ArrowLeft size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_LEFT',
    },
    {
      id: 4,
      title: 'Turn Head Right',
      subtitle: 'Turn head slightly right (15°)',
      hindiInstruction: 'चेहरे को थोड़ा दायीं तरफ घुमाएं (Turn Right)',
      icon: <ArrowRight size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_RIGHT',
    },
    {
      id: 5,
      title: 'Chin Slightly Up',
      subtitle: 'Tilt chin slightly upward',
      hindiInstruction: 'ठोड़ी (Chin) को थोड़ा ऊपर उठाएं (Tilt Up)',
      icon: <ArrowUp size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_UP',
    },
    {
      id: 6,
      title: 'Final Verification',
      subtitle: 'Look straight to finalize master profile',
      hindiInstruction: 'सीधा देखें - अंतिम सत्यापन (Final Verification)',
      icon: <Glasses size={24} className="text-[#c09748]" />,
      guideVisual: 'CENTER_GLASSES',
    },
  ];

  const currentPose = POSE_STEPS[Math.min(currentStepIndex, POSE_STEPS.length - 1)] || POSE_STEPS[0];

  useEffect(() => {
    loadFaceModels();
  }, []);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const startCamera = async () => {
      try {
        setCameraError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera permission not available.');
        }

        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (isMounted && stream) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            await videoRef.current.play().catch(() => {});
          }
        }
      } catch (err) {
        if (isMounted) {
          setCameraError(err instanceof Error ? err.message : 'Unable to access camera.');
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Complete and save enrollment
  const finalizeEnrollment = (allPoses: typeof capturedPoses) => {
    if (allPoses.length === 0) return;
    const rawDescriptors = allPoses.map((p) => p.descriptor);
    const masterVector = computeMasterVector(rawDescriptors);

    // Final security gate: Check master vector against existing enrolled staff (strict 0.38 threshold)
    if (allEmployees.length > 0) {
      const dup = checkDuplicateFace(masterVector, allEmployees, employee.id, 0.38);
      if (dup.isDuplicate && dup.matchedEmployee) {
        const similarity = Math.round(Math.max(65, Math.min(99, (1 - dup.distance / 0.45) * 45 + 55)));
        setDuplicateError({
          matchedEmployee: dup.matchedEmployee,
          distance: dup.distance,
          similarity,
        });
        return; // Abort saving!
      }
    }

    const combinedDescriptors = [masterVector, ...rawDescriptors];
    const avatarUrl = allPoses[0].imgDataUrl;

    setIsSuccessModalOpen(true);
    playAttendanceConfirmationChime();

    setTimeout(() => {
      onSaveFaceDescriptors(employee.id, combinedDescriptors, avatarUrl);
      onClose();
    }, 2000);
  };

  // Authorize Admin Override for duplicate face
  const handleAdminOverrideConfirm = () => {
    if (!adminOverrideReason.trim() || !duplicateError) return;
    if (duplicateError.pendingPose) {
      const pending = duplicateError.pendingPose;
      const currentList = capturedPosesRef.current;
      const updatedPoses = [...currentList.filter((p) => p.stepId !== pending.stepId), pending];
      setCapturedPoses(updatedPoses);
      setDuplicateError(null);
      setAdminOverrideReason('');
      setShowOverridePanel(false);

      if (currentStepIndexRef.current >= POSE_STEPS.length - 1) {
        const rawDescriptors = updatedPoses.map((p) => p.descriptor);
        const masterVector = computeMasterVector(rawDescriptors);
        const combinedDescriptors = [masterVector, ...rawDescriptors];
        const avatarUrl = updatedPoses[0].imgDataUrl;

        setIsSuccessModalOpen(true);
        playAttendanceConfirmationChime();

        setTimeout(() => {
          onSaveFaceDescriptors(employee.id, combinedDescriptors, avatarUrl);
          onClose();
        }, 2000);
      } else {
        setCurrentStepIndex((prev) => prev + 1);
      }
    } else {
      setDuplicateError(null);
    }
  };

  // Capture Current Step Pose (called automatically when hold progress reaches 100%)
  const handleCapturePose = useCallback(async () => {
    if (!videoRef.current || isProcessing) return;
    setIsProcessing(true);

    try {
      const activeIdx = currentStepIndexRef.current;
      const targetPose = POSE_STEPS[Math.min(activeIdx, POSE_STEPS.length - 1)] || POSE_STEPS[0];

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.40 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return;

      const descriptor = Array.from(detection.descriptor);
      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const newPose = {
        stepId: targetPose.id,
        label: targetPose.title,
        descriptor,
        imgDataUrl,
      };

      // Strict Duplicate Face Check on Step 1 (Frontal Neutral): Blocks early if face belongs to another employee
      if (allEmployees.length > 0 && activeIdx === 0) {
        const dup = checkDuplicateFace(descriptor, allEmployees, employee.id, 0.38);
        if (dup.isDuplicate && dup.matchedEmployee) {
          const similarity = Math.round(Math.max(65, Math.min(99, (1 - dup.distance / 0.45) * 45 + 55)));
          setDuplicateError({
            matchedEmployee: dup.matchedEmployee,
            distance: dup.distance,
            similarity,
            pendingPose: newPose,
          });
          setSteadyHoldProgress(0);
          return; // Strictly abort and block saving!
        }
      }

      // Flash feedback & audio chime on auto-capture
      playAttendanceConfirmationChime();
      setJustCapturedFlash(true);
      setTimeout(() => setJustCapturedFlash(false), 300);

      const currentList = capturedPosesRef.current;
      const updatedPoses = [...currentList.filter((p) => p.stepId !== targetPose.id), newPose];
      setCapturedPoses(updatedPoses);
      setSteadyHoldProgress(0);

      // Check if this was the last pose (Step 6)
      if (activeIdx >= POSE_STEPS.length - 1) {
        finalizeEnrollment(updatedPoses);
      } else {
        setCurrentStepIndex(activeIdx + 1);
      }
    } catch (err) {
      console.warn('Capture pose error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [allEmployees, employee.id, isProcessing]);

  // Live Auto-Pose Detection & Auto-Capture Loop (runs every 200ms)
  useEffect(() => {
    if (!isOpen || isProcessing || isSuccessModalOpen || duplicateError) {
      return;
    }

    let isCapturing = false;

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4 || isProcessing || isCapturing) return;

      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = video.videoWidth || 640;
        offscreen.height = video.videoHeight || 480;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height);

        const activeIdx = currentStepIndexRef.current;
        const targetPose = POSE_STEPS[Math.min(activeIdx, POSE_STEPS.length - 1)] || POSE_STEPS[0];

        const det = await faceapi
          .detectSingleFace(offscreen, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.40 }))
          .withFaceLandmarks();

        if (det) {
          const box = det.detection.box;
          const pctX = (box.x / offscreen.width) * 100;
          const pctY = (box.y / offscreen.height) * 100;
          const pctW = (box.width / offscreen.width) * 100;
          const pctH = (box.height / offscreen.height) * 100;
          setDetectedBox({ x: pctX, y: pctY, width: pctW, height: pctH });

          const quality = assessEnrollmentQuality(
            det,
            ctx,
            offscreen.width,
            offscreen.height,
            targetPose.id
          );
          setQualityDetails(quality);

          // AUTO-CAPTURE: When pose matches and quality passed, fill progress bar and trigger
          if (quality.passed) {
            setSteadyHoldProgress((prev) => {
              const next = prev + 25; // Reaches 100% in 4 frames (~800ms hold)
              if (next >= 100 && !isCapturing) {
                isCapturing = true;
                handleCapturePose().finally(() => {
                  isCapturing = false;
                });
                return 100;
              }
              return Math.min(100, next);
            });
          } else {
            // Smooth decay instead of sudden reset
            setSteadyHoldProgress((prev) => Math.max(0, prev - 15));
          }
        } else {
          setDetectedBox(null);
          setQualityDetails(null);
          setSteadyHoldProgress((prev) => Math.max(0, prev - 20));
        }
      } catch {
        // scan frame glitch ignored
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen, isProcessing, isSuccessModalOpen, handleCapturePose]);

  const handleReset = () => {
    setCapturedPoses([]);
    setCurrentStepIndex(0);
    setSteadyHoldProgress(0);
    setDuplicateError(null);
    setAdminOverrideReason('');
    setShowOverridePanel(false);
  };

  const getPoseLabel = (poseType?: string) => {
    switch (poseType) {
      case 'SMILE': return 'Smiling (मुस्कान)';
      case 'LEFT': return 'Turned Left (बाएं)';
      case 'RIGHT': return 'Turned Right (दाएं)';
      case 'UP': return 'Chin Up (ठोड़ी ऊपर)';
      case 'NEUTRAL': return 'Straight (सीधा)';
      default: return 'Positioning...';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col justify-between overflow-hidden select-none">
      
      {/* FULL SCREEN CAMERA PREVIEW */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-150 ${
            justCapturedFlash ? 'opacity-40' : 'opacity-100'
          }`}
        />

        {/* TOP BAR: Clean & Minimal - Name, Step Counter, AI Live Pose & Close */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white font-bold text-sm">
              {employee.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base sm:text-lg drop-shadow-md leading-tight">
                  {employee.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  Auto-Capture Active
                </span>
              </div>
              <p className="text-xs text-white/60 font-mono">
                {employee.id} • Step {currentPose.id} of {POSE_STEPS.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live AI Detected Pose Badge */}
            {qualityDetails && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs text-white">
                <Zap size={13} className="text-[#c09748]" />
                <span className="text-white/60">AI Sees:</span>
                <span className="font-semibold text-emerald-400">
                  {getPoseLabel(qualityDetails.detectedPose)}
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              aria-label="Close"
              className="h-10 w-10 rounded-full flex items-center justify-center bg-black/40 text-white/80 hover:text-white border border-white/15 backdrop-blur-md cursor-pointer active:scale-95 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* DYNAMIC FACE DETECTION TRACKER (Corner Brackets) */}
        {detectedBox && (
          <div
            style={{
              left: `${Math.max(0, Math.min(100, 100 - detectedBox.x - detectedBox.width))}%`,
              top: `${detectedBox.y}%`,
              width: `${detectedBox.width}%`,
              height: `${detectedBox.height}%`,
            }}
            className={`absolute pointer-events-none transition-all duration-150 z-15 ${
              qualityDetails?.passed
                ? 'shadow-[0_0_25px_rgba(52,211,153,0.45)]'
                : 'shadow-[0_0_15px_rgba(192,151,72,0.25)]'
            }`}
          >
            {/* Corner Brackets */}
            <div className={`absolute top-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-l-2 rounded-tl-lg transition-colors duration-200 ${
              qualityDetails?.passed ? 'border-emerald-400' : 'border-[#c09748]'
            }`} />
            <div className={`absolute top-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-r-2 rounded-tr-lg transition-colors duration-200 ${
              qualityDetails?.passed ? 'border-emerald-400' : 'border-[#c09748]'
            }`} />
            <div className={`absolute bottom-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-l-2 rounded-bl-lg transition-colors duration-200 ${
              qualityDetails?.passed ? 'border-emerald-400' : 'border-[#c09748]'
            }`} />
            <div className={`absolute bottom-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-r-2 rounded-br-lg transition-colors duration-200 ${
              qualityDetails?.passed ? 'border-emerald-400' : 'border-[#c09748]'
            }`} />

            {/* Glowing Face Tint */}
            <div className={`absolute inset-0 rounded-xl transition-colors duration-200 ${
              qualityDetails?.passed
                ? 'bg-emerald-500/10 border border-emerald-400/30'
                : 'bg-[#c09748]/5 border border-[#c09748]/20'
            }`} />
          </div>
        )}

        {/* CENTRAL OVAL GUIDE WITH DYNAMIC GLOW */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div
            className={`relative w-[220px] h-[290px] sm:w-[260px] sm:h-[340px] rounded-[50%] border-2 transition-all duration-300 flex items-center justify-center ${
              qualityDetails?.passed
                ? 'border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.45)]'
                : 'border-white/40 border-dashed'
            }`}
          >
            {/* Guide Arrows for Turn Pose */}
            {currentPose.guideVisual === 'ARROW_LEFT' && (
              <div className="absolute -left-14 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/80 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce">
                <ArrowLeft size={16} />
                <span>Turn Left</span>
              </div>
            )}

            {currentPose.guideVisual === 'ARROW_RIGHT' && (
              <div className="absolute -right-14 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/80 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce">
                <span>Turn Right</span>
                <ArrowRight size={16} />
              </div>
            )}

            {currentPose.guideVisual === 'ARROW_UP' && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/80 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce">
                <ArrowUp size={16} />
                <span>Chin Up</span>
              </div>
            )}

            {currentPose.guideVisual === 'CENTER_SMILE' && (
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/80 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce">
                <Smile size={16} />
                <span>Smile Naturally</span>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM INSTRUCTION OVERLAY */}
        <div className="absolute bottom-0 inset-x-0 p-5 pb-8 sm:pb-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col items-center z-20">
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-3">
            {/* Main Instruction */}
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide drop-shadow-md">
                {currentPose.hindiInstruction}
              </h2>
              <p className="text-xs sm:text-sm text-white/70 mt-0.5 font-medium">
                {qualityDetails?.passed ? (
                  <span className="text-emerald-400 font-bold animate-pulse">
                    ✓ Pose Matched! Hold steady to auto-capture...
                  </span>
                ) : (
                  currentPose.subtitle
                )}
              </p>
            </div>

            {/* Auto-Capture Steady Hold Progress Bar */}
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden p-0.5 backdrop-blur-sm border border-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-150 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                style={{ width: `${steadyHoldProgress}%` }}
              />
            </div>

            {/* Manual Backup Trigger Button (Guarantees user is NEVER stuck!) */}
            <div className="pt-1 w-full flex items-center justify-between gap-3">
              <button
                onClick={handleReset}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1 cursor-pointer transition active:scale-95"
              >
                <RefreshCw size={13} />
                <span>Reset</span>
              </button>

              <button
                onClick={() => handleCapturePose()}
                disabled={isProcessing}
                className="px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold backdrop-blur-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="Manual snapshot if you do not want to wait for auto-capture"
              >
                <Camera size={13} className="text-[#c09748]" />
                <span>Capture Now</span>
              </button>

              <div className="flex items-center gap-1.5">
                {POSE_STEPS.map((s, idx) => {
                  const isDone = capturedPoses.some((p) => p.stepId === s.id);
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div
                      key={s.id}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isDone
                          ? 'w-5 bg-emerald-400'
                          : isCurrent
                          ? 'w-5 bg-amber-400'
                          : 'w-2 bg-white/30'
                      }`}
                    />
                  );
                })}
              </div>

              <span className="text-xs font-mono text-white/50">
                {capturedPoses.length}/6
              </span>
            </div>
          </div>
        </div>

        {/* DUPLICATE FACE ERROR MODAL OVERLAY */}
        {duplicateError && (
          <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-20 w-20 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mb-3 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.35)] animate-pulse">
              <ShieldAlert size={42} />
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              चेहरा पहले से रजिस्टर्ड है!
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold mt-1">
              <AlertTriangle size={13} />
              <span>Duplicate Face Detected ({duplicateError.similarity}% Match)</span>
            </div>

            <p className="text-xs text-white/70 mt-2 max-w-sm">
              Yeh chehra company ke database me pehle se registered employee se match karta hai:
            </p>

            {/* Matched Employee Details Box */}
            <div className="mt-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-left w-full max-w-sm">
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                Enrolled Profile Match
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-base font-bold text-white">
                  {duplicateError.matchedEmployee.name}
                </span>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-[#c09748] border border-[#c09748]/30">
                  {duplicateError.matchedEmployee.id}
                </span>
              </div>
              <div className="mt-1 text-xs text-white/70 flex items-center gap-2">
                <span>{duplicateError.matchedEmployee.designation || 'Staff'}</span>
                <span>•</span>
                <span>{duplicateError.matchedEmployee.department}</span>
              </div>
            </div>

            <p className="text-[11px] text-white/50 mt-2.5 max-w-xs leading-relaxed">
              Company policy ke anusaar ek hi chehra do alag employee profiles me register nahi kiya ja sakta.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-5 flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-sm">
              <button
                onClick={() => {
                  setDuplicateError(null);
                  handleReset();
                }}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw size={13} />
                <span>Try Another Person</span>
              </button>
              <button
                onClick={onClose}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition active:scale-95 cursor-pointer"
              >
                Cancel & Close
              </button>
            </div>

            {/* Collapsible Admin Override */}
            <div className="mt-3.5 w-full max-w-sm text-center">
              {!showOverridePanel ? (
                <button
                  onClick={() => setShowOverridePanel(true)}
                  className="text-[11px] text-white/40 hover:text-white/70 underline underline-offset-2 transition cursor-pointer"
                >
                  Admin Override (Special Case)
                </button>
              ) : (
                <div className="mt-2 p-3 rounded-2xl bg-black/70 border border-rose-500/40 text-left space-y-2 animate-in fade-in">
                  <label className="text-[10px] text-rose-300 font-bold block uppercase tracking-wider">
                    Admin Override Reason (Mandatory)
                  </label>
                  <input
                    type="text"
                    value={adminOverrideReason}
                    onChange={(e) => setAdminOverrideReason(e.target.value)}
                    placeholder="Reason (e.g. Updating profile ID or test re-enrollment)..."
                    className="w-full text-xs p-2 rounded-xl bg-black/80 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-rose-400"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowOverridePanel(false)}
                      className="px-3 py-1.5 text-xs text-white/60 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!adminOverrideReason.trim()}
                      onClick={handleAdminOverrideConfirm}
                      className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-40 transition active:scale-95 cursor-pointer"
                    >
                      Authorize Force Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FULL SCREEN SUCCESS MODAL WITH GREEN TICK */}
        {isSuccessModalOpen && (
          <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="h-24 w-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-4 text-emerald-400 animate-bounce">
              <CheckCircle2 size={54} />
            </div>
            <h2 className="text-2xl font-bold text-white">Enrollment Successful!</h2>
            <p className="text-sm text-emerald-300 font-medium mt-1">चेहरा सफलतापूर्वक पंजीकृत हो गया</p>
            <p className="text-xs text-white/70 mt-2 max-w-xs">
              {employee.name} can now punch attendance using AI Face Recognition.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
