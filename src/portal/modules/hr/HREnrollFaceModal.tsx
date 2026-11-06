import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Check, 
  RefreshCw, 
  AlertCircle,
  Smile,
  Glasses,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  UserCheck,
  ShieldAlert,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Employee, EnrollmentQualityDetails } from '../../types/hrAttendanceTypes';
import { 
  loadFaceModels,
  computeMasterVector,
  checkDuplicateFace,
  assessEnrollmentQuality
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

  // Real-time quality gate & auto-capture
  const [qualityDetails, setQualityDetails] = useState<EnrollmentQualityDetails | null>(null);
  const [steadyHoldProgress, setSteadyHoldProgress] = useState<number>(0);

  // Duplicate face block state
  const [duplicateBlock, setDuplicateBlock] = useState<{
    matchedEmployee: Employee;
    distance: number;
    pendingPose: { stepId: number; label: string; descriptor: number[]; imgDataUrl: string };
  } | null>(null);
  const [overrideReason, setOverrideReason] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const POSE_STEPS: PoseInstruction[] = [
    {
      id: 1,
      title: 'Straight & Neutral',
      subtitle: 'Look directly at camera',
      hindiInstruction: 'सीधा कैमरे की तरफ देखें',
      icon: <UserCheck size={24} className="text-[#c09748]" />,
      guideVisual: 'CENTER',
    },
    {
      id: 2,
      title: 'Natural Smile',
      subtitle: 'Smile naturally with eyes open',
      hindiInstruction: 'हल्की मुस्कान दें (Smile)',
      icon: <Smile size={24} className="text-[#c09748]" />,
      guideVisual: 'CENTER_SMILE',
    },
    {
      id: 3,
      title: 'Turn Head Left',
      subtitle: 'Turn head slightly left (20°)',
      hindiInstruction: 'चेहरे को थोड़ा बायीं तरफ घुमाएं',
      icon: <ArrowLeft size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_LEFT',
    },
    {
      id: 4,
      title: 'Turn Head Right',
      subtitle: 'Turn head slightly right (20°)',
      hindiInstruction: 'चेहरे को थोड़ा दायीं तरफ घुमाएं',
      icon: <ArrowRight size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_RIGHT',
    },
    {
      id: 5,
      title: 'Chin Slightly Up',
      subtitle: 'Tilt chin slightly upward',
      hindiInstruction: 'ठोड़ी (Chin) को थोड़ा ऊपर उठाएं',
      icon: <ArrowUp size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_UP',
    },
    {
      id: 6,
      title: 'Final Verification',
      subtitle: 'Look straight with daily glasses or expression',
      hindiInstruction: 'सीधा देखें - अंतिम सत्यापन',
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
    const combinedDescriptors = [masterVector, ...rawDescriptors];
    const avatarUrl = allPoses[0].imgDataUrl;

    setIsSuccessModalOpen(true);

    setTimeout(() => {
      onSaveFaceDescriptors(employee.id, combinedDescriptors, avatarUrl);
      onClose();
    }, 2200);
  };

  // Capture Current Step Pose
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
        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.50 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return;

      const quality = assessEnrollmentQuality(
        detection,
        ctx,
        canvas.width,
        canvas.height,
        targetPose.id
      );

      if (!quality.passed) return;

      const descriptor = Array.from(detection.descriptor);
      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const newPose = {
        stepId: targetPose.id,
        label: targetPose.title,
        descriptor,
        imgDataUrl,
      };

      // Duplicate Check
      if (allEmployees.length > 0) {
        const dup = checkDuplicateFace(descriptor, allEmployees, employee.id, 0.40);
        if (dup.isDuplicate && dup.matchedEmployee) {
          setDuplicateBlock({
            matchedEmployee: dup.matchedEmployee,
            distance: dup.distance,
            pendingPose: newPose,
          });
          return;
        }
      }

      const currentList = capturedPosesRef.current;
      const updatedPoses = [...currentList.filter((p) => p.stepId !== targetPose.id), newPose];
      setCapturedPoses(updatedPoses);
      setSteadyHoldProgress(0);

      // Check if this was the last pose
      if (activeIdx >= POSE_STEPS.length - 1) {
        finalizeEnrollment(updatedPoses);
      } else {
        setCurrentStepIndex(activeIdx + 1);
      }
    } catch {
      // extraction fail ignored
    } finally {
      setIsProcessing(false);
    }
  }, [allEmployees, employee.id, isProcessing]);

  // Live Auto-Capture Loop
  useEffect(() => {
    if (!isOpen || isProcessing || duplicateBlock || isSuccessModalOpen) {
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
          .detectSingleFace(offscreen, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.50 }))
          .withFaceLandmarks();

        if (det) {
          const quality = assessEnrollmentQuality(
            det,
            ctx,
            offscreen.width,
            offscreen.height,
            targetPose.id
          );
          setQualityDetails(quality);

          if (quality.passed) {
            setSteadyHoldProgress((prev) => {
              const next = prev + 25;
              if (next >= 100 && !isCapturing) {
                isCapturing = true;
                handleCapturePose().finally(() => {
                  isCapturing = false;
                });
                return 0;
              }
              return next;
            });
          } else {
            setSteadyHoldProgress(0);
          }
        } else {
          setQualityDetails(null);
          setSteadyHoldProgress(0);
        }
      } catch {
        // scan frame glitch ignored
      }
    }, 280);

    return () => clearInterval(interval);
  }, [isOpen, isProcessing, duplicateBlock, isSuccessModalOpen, currentStepIndex, handleCapturePose]);

  const handleAdminOverrideConfirm = () => {
    if (!duplicateBlock || !overrideReason.trim()) return;
    const updatedPoses = [
      ...capturedPoses.filter((p) => p.stepId !== duplicateBlock.pendingPose.stepId),
      duplicateBlock.pendingPose,
    ];
    setCapturedPoses(updatedPoses);
    setDuplicateBlock(null);
    setOverrideReason('');

    const activeIdx = currentStepIndexRef.current;
    if (activeIdx >= POSE_STEPS.length - 1) {
      finalizeEnrollment(updatedPoses);
    } else {
      setCurrentStepIndex(activeIdx + 1);
    }
  };

  const handleReset = () => {
    setCapturedPoses([]);
    setCurrentStepIndex(0);
    setDuplicateBlock(null);
    setSteadyHoldProgress(0);
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
          className="w-full h-full object-cover scale-x-[-1]"
        />

        {/* TOP BAR: Clean & Minimal - Name, Step Counter & Close */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white font-bold text-sm">
              {employee.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg drop-shadow-md leading-tight">
                {employee.name}
              </h3>
              <p className="text-xs text-white/60 font-mono">
                {employee.id} • Step {currentPose.id} of {POSE_STEPS.length}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="h-10 w-10 rounded-full flex items-center justify-center bg-black/40 text-white/80 hover:text-white border border-white/15 backdrop-blur-md cursor-pointer active:scale-95 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* CENTRAL OVAL GUIDE */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div
            className={`relative w-[220px] h-[290px] sm:w-[260px] sm:h-[340px] rounded-[50%] border-2 transition-all duration-300 flex items-center justify-center ${
              qualityDetails?.passed
                ? 'border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.35)]'
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

        {/* BOTTOM INSTRUCTION OVERLAY (Directly over camera stream) */}
        <div className="absolute bottom-0 inset-x-0 p-5 pb-8 sm:pb-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center z-20">
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-3">
            {/* Main Instruction */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide drop-shadow-md">
                {currentPose.hindiInstruction}
              </h2>
              <p className="text-sm text-white/70 mt-0.5 font-medium">
                {currentPose.subtitle}
              </p>
            </div>

            {/* Hold Progress Bar */}
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden p-0.5 backdrop-blur-sm border border-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-150 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                style={{ width: `${steadyHoldProgress}%` }}
              />
            </div>

            {/* Simple Step Dots & Reset */}
            <div className="flex items-center justify-between w-full pt-1 px-1">
              <button
                onClick={handleReset}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <RefreshCw size={13} />
                <span>Reset</span>
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

        {/* DUPLICATE WARNING MODAL OVERLAY */}
        {duplicateBlock && (
          <div className="absolute inset-x-4 top-20 z-30 p-5 rounded-[22px] bg-rose-950/95 border border-rose-500 text-white shadow-2xl backdrop-blur-md animate-in fade-in space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert size={22} className="text-rose-400 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-rose-200">Duplicate Face Match</h4>
                <p className="text-xs text-rose-300/90 mt-0.5">
                  Matches: <strong>{duplicateBlock.matchedEmployee.name} ({duplicateBlock.matchedEmployee.id})</strong>.
                </p>
              </div>
            </div>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Admin override reason..."
              className="w-full text-xs p-2.5 rounded-xl bg-black/40 border border-white/20 text-white focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setDuplicateBlock(null)}
                className="px-3 py-1.5 text-xs text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={!overrideReason.trim()}
                onClick={handleAdminOverrideConfirm}
                className="px-4 py-1.5 text-xs font-semibold rounded-full bg-rose-600 text-white disabled:opacity-50"
              >
                Authorize Override
              </button>
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
