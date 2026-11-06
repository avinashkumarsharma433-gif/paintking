import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  Check, 
  RefreshCw, 
  Upload, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  AlertTriangle,
  Smile,
  Glasses,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Sun,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { Employee, EnrollmentQualityDetails } from '../../types/hrAttendanceTypes';
import { 
  extractFaceDescriptorFromCanvas, 
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

// 6 Guided Professional Poses for Maximum Biometric Accuracy
interface PoseInstruction {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  guideVisual: string; // Arrow / Target hint
  tip: string;
}

export const HREnrollFaceModal: React.FC<HREnrollFaceModalProps> = ({
  employee,
  allEmployees = [],
  isOpen,
  onClose,
  onSaveFaceDescriptors,
}) => {
  const [activeTab, setActiveTab] = useState<'GUIDED' | 'UPLOAD'>('GUIDED');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [capturedPoses, setCapturedPoses] = useState<{ stepId: number; label: string; descriptor: number[]; imgDataUrl: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Real-time quality gate & auto-capture
  const [qualityDetails, setQualityDetails] = useState<EnrollmentQualityDetails | null>(null);
  const [steadyHoldProgress, setSteadyHoldProgress] = useState<number>(0); // 0 to 100%
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState<boolean>(true);

  // Duplicate face block state (requires HR Admin written override)
  const [duplicateBlock, setDuplicateBlock] = useState<{
    matchedEmployee: Employee;
    distance: number;
    pendingPose: { stepId: number; label: string; descriptor: number[]; imgDataUrl: string };
  } | null>(null);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideHistory, setOverrideHistory] = useState<{ poseId: number; reason: string; timestamp: string }[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const POSE_STEPS: PoseInstruction[] = [
    {
      id: 1,
      title: 'Pose 1: Straight & Neutral',
      subtitle: 'Look directly into camera lens without smiling',
      icon: <UserCheck size={28} className="text-[#c09748]" />,
      guideVisual: 'CENTER',
      tip: 'Keep your chin level and look directly at the center oval.',
    },
    {
      id: 2,
      title: 'Pose 2: Natural Smile',
      subtitle: 'Smile naturally while keeping eyes open',
      icon: <Smile size={28} className="text-[#c09748]" />,
      guideVisual: 'CENTER_SMILE',
      tip: 'Helps recognize when greeting colleagues or expressing emotion.',
    },
    {
      id: 3,
      title: 'Pose 3: Turn Head Left (20°)',
      subtitle: 'Slightly turn head to your left side, eyes towards camera',
      icon: <ArrowLeft size={28} className="text-[#c09748]" />,
      guideVisual: 'ARROW_LEFT',
      tip: 'Turn your nose towards the left indicator.',
    },
    {
      id: 4,
      title: 'Pose 4: Turn Head Right (20°)',
      subtitle: 'Slightly turn head to your right side, eyes towards camera',
      icon: <ArrowRight size={28} className="text-[#c09748]" />,
      guideVisual: 'ARROW_RIGHT',
      tip: 'Turn your nose towards the right indicator.',
    },
    {
      id: 5,
      title: 'Pose 5: Chin Slightly Up (15°)',
      subtitle: 'Tilt chin slightly upward for biometric jawline angle',
      icon: <ArrowUp size={28} className="text-[#c09748]" />,
      guideVisual: 'ARROW_UP',
      tip: 'Raise chin slightly to capture bottom jaw contours.',
    },
    {
      id: 6,
      title: 'Pose 6: Glasses or Expression Check',
      subtitle: 'Wear glasses if you use them daily, or blink & look straight',
      icon: <Glasses size={28} className="text-[#c09748]" />,
      guideVisual: 'CENTER_GLASSES',
      tip: 'Final verification pose for daily work wear compatibility.',
    },
  ];

  const currentPose = POSE_STEPS[currentStepIndex];

  useEffect(() => {
    loadFaceModels();
  }, []);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen || activeTab === 'UPLOAD') return;

    let isMounted = true;
    const startCamera = async () => {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });

        if (isMounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errMsg = err instanceof Error ? err.message : 'Camera access denied';
          setCameraError(`Camera error: ${errMsg}. Check device permissions.`);
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
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Capture Current Step Pose (Strictly Non-Mirrored Image)
  const handleCapturePose = useCallback(async () => {
    if (!videoRef.current || isProcessing) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw original non-mirrored frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.50 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        alert('Face not clearly detected. Ensure face is well-lit and inside the oval guide.');
        return;
      }

      // Quality Gate Assessment
      const quality = assessEnrollmentQuality(
        detection,
        ctx,
        canvas.width,
        canvas.height,
        currentPose.id
      );

      if (!quality.passed) {
        alert(`Quality Check Failed:\n• ${quality.reasons.join('\n• ')}`);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const newPose = {
        stepId: currentPose.id,
        label: currentPose.title,
        descriptor,
        imgDataUrl,
      };

      // Duplicate Face Check on EVERY pose (Strict 0.40 threshold)
      if (allEmployees.length > 0) {
        const dup = checkDuplicateFace(descriptor, allEmployees, employee.id, 0.40);
        if (dup.isDuplicate && dup.matchedEmployee) {
          // Block enrollment until admin provides written authorization
          setDuplicateBlock({
            matchedEmployee: dup.matchedEmployee,
            distance: dup.distance,
            pendingPose: newPose,
          });
          return;
        }
      }

      const updatedPoses = [...capturedPoses.filter((p) => p.stepId !== currentPose.id), newPose];
      setCapturedPoses(updatedPoses);
      setSteadyHoldProgress(0);

      // Move to next step if not final
      if (currentStepIndex < POSE_STEPS.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      }
    } catch {
      // extraction error
    } finally {
      setIsProcessing(false);
    }
  }, [allEmployees, capturedPoses, currentPose, currentStepIndex, employee.id, isProcessing]);

  // Live Quality Gate & Auto-Capture Loop
  useEffect(() => {
    if (!isOpen || activeTab !== 'GUIDED' || isProcessing || duplicateBlock) {
      return;
    }

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4 || isProcessing) return;

      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = video.videoWidth || 640;
        offscreen.height = video.videoHeight || 480;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;

        // Draw original raw frame
        ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height);

        const det = await faceapi
          .detectSingleFace(offscreen, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.50 }))
          .withFaceLandmarks();

        if (det) {
          const quality = assessEnrollmentQuality(
            det,
            ctx,
            offscreen.width,
            offscreen.height,
            currentPose.id
          );
          setQualityDetails(quality);

          if (quality.passed && autoCaptureEnabled) {
            setSteadyHoldProgress((prev) => {
              const next = prev + 25; // 4 ticks of 250ms = 1000ms steady hold
              if (next >= 100) {
                // Auto capture trigger
                setTimeout(() => handleCapturePose(), 10);
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
        // Frame processing glitch ignored
      }
    }, 280);

    return () => clearInterval(interval);
  }, [isOpen, activeTab, isProcessing, duplicateBlock, currentPose.id, autoCaptureEnabled, handleCapturePose]);

  // HR Admin Duplicate Override Handler
  const handleAdminOverrideConfirm = () => {
    if (!duplicateBlock || !overrideReason.trim()) return;

    setOverrideHistory((prev) => [
      ...prev,
      {
        poseId: duplicateBlock.pendingPose.stepId,
        reason: overrideReason.trim(),
        timestamp: new Date().toISOString(),
      },
    ]);

    const updatedPoses = [
      ...capturedPoses.filter((p) => p.stepId !== duplicateBlock.pendingPose.stepId),
      duplicateBlock.pendingPose,
    ];
    setCapturedPoses(updatedPoses);
    setDuplicateBlock(null);
    setOverrideReason('');

    if (currentStepIndex < POSE_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const descriptor = await extractFaceDescriptorFromCanvas(canvas);
        if (descriptor) {
          setCapturedPoses([
            {
              stepId: 1,
              label: 'Uploaded Photo Profile',
              descriptor,
              imgDataUrl: event.target?.result as string,
            },
          ]);
        } else {
          alert('Face not detected. Please upload a clear front-facing portrait.');
        }
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAndEnroll = () => {
    if (capturedPoses.length === 0) return;
    const rawDescriptors = capturedPoses.map((p) => p.descriptor);

    // Compute Master Vector from all captured poses
    const masterVector = computeMasterVector(rawDescriptors);
    const combinedDescriptors = [masterVector, ...rawDescriptors];

    const avatarUrl = capturedPoses[0].imgDataUrl;
    onSaveFaceDescriptors(employee.id, combinedDescriptors, avatarUrl);
    onClose();
  };

  const handleReset = () => {
    setCapturedPoses([]);
    setCurrentStepIndex(0);
    setDuplicateBlock(null);
    setSteadyHoldProgress(0);
  };

  const isAllPosesDone = capturedPoses.length >= POSE_STEPS.length;

  return (
    <div className="fixed inset-0 z-50 bg-[#17191c]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] border border-[#ececec] shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#ececec] flex items-center justify-between bg-[#fafafb]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">
                Interactive Biometric Trainer
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] font-semibold border border-[#f4e5be]">
                6 Guided Master Poses
              </span>
            </div>
            <h3 className="text-lg font-serif text-[#17191c] mt-0.5">
              Enroll Face: {employee.name} ({employee.id})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center bg-white border border-[#ececec] text-[#777b86] hover:text-[#17191c] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3 flex gap-2 border-b border-[#f2f2f3]">
          <button
            onClick={() => {
              setActiveTab('GUIDED');
              handleReset();
            }}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'GUIDED'
                ? 'border-[#c09748] text-[#17191c]'
                : 'border-transparent text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            <Camera size={14} className={activeTab === 'GUIDED' ? 'text-[#c09748]' : 'text-[#979799]'} />
            <span>Interactive Guided Pose Calibration</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('UPLOAD');
              handleReset();
            }}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'UPLOAD'
                ? 'border-[#c09748] text-[#17191c]'
                : 'border-transparent text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            <Upload size={14} className={activeTab === 'UPLOAD' ? 'text-[#c09748]' : 'text-[#979799]'} />
            <span>Upload Photo File</span>
          </button>
        </div>


        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {activeTab === 'GUIDED' ? (
            <div>
              {cameraError ? (
                <div className="p-4 rounded-[16px] bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{cameraError}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Step Stepper Bar with Icons (Strict Sequential Navigation) */}
                  <div className="grid grid-cols-6 gap-1.5 bg-[#fafafb] p-2 rounded-[18px] border border-[#ececec]">
                    {POSE_STEPS.map((step, idx) => {
                      const isCompleted = capturedPoses.some(p => p.stepId === step.id);
                      const isCurrent = idx === currentStepIndex;
                      // Step can only be visited if it's Pose 1 or all preceding poses are captured
                      const canNavigate = idx === 0 || POSE_STEPS.slice(0, idx).every(s => capturedPoses.some(p => p.stepId === s.id));

                      return (
                        <button
                          key={step.id}
                          type="button"
                          disabled={!canNavigate}
                          onClick={() => {
                            if (canNavigate) {
                              setCurrentStepIndex(idx);
                            }
                          }}
                          className={`p-2 rounded-[14px] flex flex-col items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-[#faf3e0] border border-[#c09748] text-[#8a6521] shadow-2xs cursor-pointer'
                              : isCompleted
                              ? 'bg-white border border-[#dcdfe4] text-emerald-700 cursor-pointer hover:bg-slate-50'
                              : canNavigate
                              ? 'bg-transparent text-[#17191c] hover:bg-[#ececec] cursor-pointer'
                              : 'bg-transparent text-[#979799] opacity-40 cursor-not-allowed'
                          }`}
                          title={!canNavigate ? `Capture Pose ${POSE_STEPS[idx - 1].id} first` : undefined}
                        >
                          <div className="text-xs mb-1">
                            {isCompleted ? <Check size={14} className="text-emerald-600" /> : step.icon}
                          </div>
                          <span className="text-[10px] font-bold">Pose {step.id}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ACTIVE POSE INSTRUCTION HERO CARD */}
                  <div className="p-3.5 bg-[#faf3e0] border border-[#f4e5be] rounded-[20px] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-white border border-[#f4e5be] flex items-center justify-center shrink-0 shadow-2xs">
                        {currentPose.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#8a6521] text-white uppercase tracking-wider">
                            Step {currentPose.id} of {POSE_STEPS.length}
                          </span>
                          <span className="text-xs font-bold text-[#17191c]">
                            {currentPose.title}
                          </span>
                        </div>
                        <p className="text-xs text-[#8a6521] font-medium mt-0.5">
                          {currentPose.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block text-right text-[11px] text-[#777b86] max-w-[170px] leading-tight">
                      Tip: {currentPose.tip}
                    </div>
                  </div>

                  {/* Video Viewport with Interactive Visual Overlay Guidance & Live Quality Gate */}
                  <div className="relative rounded-[20px] overflow-hidden bg-[#17191c] h-[300px] flex items-center justify-center border border-[#ececec]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* Quality Gate Live Feedback Header */}
                    <div className="absolute top-3 inset-x-3 pointer-events-none flex items-center justify-between">
                      {qualityDetails ? (
                        <div
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-md ${
                            qualityDetails.passed
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {qualityDetails.passed ? (
                            <>
                              <Check size={12} className="text-emerald-400" />
                              <span>Quality Gate: Optimal ({qualityDetails.qualityScore}%)</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} className="text-amber-400" />
                              <span>{qualityDetails.reasons[0] || 'Adjust pose & lighting'}</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#17191c]/70 text-[#a3a6af] border border-white/10">
                          Detecting face...
                        </div>
                      )}

                      {/* Auto-Capture Steady Indicator */}
                      {steadyHoldProgress > 0 && (
                        <div className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#c09748] text-white flex items-center gap-1.5 shadow-md animate-pulse">
                          <Sparkles size={12} />
                          <span>Hold Steady: Auto-capturing ({steadyHoldProgress}%)</span>
                        </div>
                      )}
                    </div>

                    {/* Central Face Target Oval Guide */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div
                        className={`relative w-[170px] h-[210px] rounded-[50%] border-2 border-dashed transition-colors duration-300 flex items-center justify-center ${
                          qualityDetails?.passed ? 'border-emerald-400 opacity-90' : 'border-[#c09748] opacity-75'
                        }`}
                      >
                        <span className="text-[10px] text-white/90 bg-[#17191c]/70 px-2 py-0.5 rounded-full font-mono">
                          {qualityDetails?.passed ? 'Hold Steady' : 'Fit Face In Oval'}
                        </span>

                        {/* Interactive Directional Arrows based on Pose */}
                        {currentPose.guideVisual === 'ARROW_LEFT' && (
                          <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#c09748] font-bold text-xs bg-[#17191c]/80 px-2 py-1 rounded-full animate-bounce">
                            <ArrowLeft size={16} />
                            <span>Turn Left</span>
                          </div>
                        )}

                        {currentPose.guideVisual === 'ARROW_RIGHT' && (
                          <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#c09748] font-bold text-xs bg-[#17191c]/80 px-2 py-1 rounded-full animate-bounce">
                            <span>Turn Right</span>
                            <ArrowRight size={16} />
                          </div>
                        )}

                        {currentPose.guideVisual === 'ARROW_UP' && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[#c09748] font-bold text-xs bg-[#17191c]/80 px-2 py-1 rounded-full animate-bounce">
                            <ArrowUp size={16} />
                            <span>Tilt Chin Up</span>
                          </div>
                        )}

                        {currentPose.guideVisual === 'CENTER_SMILE' && (
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[#c09748] font-bold text-xs bg-[#17191c]/80 px-2.5 py-1 rounded-full">
                            <Smile size={14} />
                            <span>Smile Naturally</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pose Completion Pill Indicator */}
                    {capturedPoses.some(p => p.stepId === currentPose.id) && (
                      <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <Check size={12} />
                        <span>Pose {currentPose.id} Captured</span>
                      </div>
                    )}
                  </div>

                  {/* Steady Hold Progress Bar */}
                  {steadyHoldProgress > 0 && (
                    <div className="w-full bg-[#f2f2f3] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#c09748] h-full transition-all duration-200"
                        style={{ width: `${steadyHoldProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Duplicate Block Warning Modal */}
                  {duplicateBlock && (
                    <div className="p-4 rounded-[20px] bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <ShieldAlert size={20} className="shrink-0 text-[#e11d48] mt-0.5" />
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-[#9f1239]">
                            Enrollment Blocked: Duplicate Face Detected
                          </h4>
                          <p className="text-xs text-[#9f1239] mt-0.5 leading-relaxed">
                            This face matches enrolled employee <strong>{duplicateBlock.matchedEmployee.name} ({duplicateBlock.matchedEmployee.id})</strong> with Euclidean distance {duplicateBlock.distance}. Duplicate enrollments are prohibited by default.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-[14px] border border-[#fecdd3] space-y-2">
                        <label className="block text-[11px] font-semibold text-[#17191c]">
                          HR Administrator Override Reason (Mandatory for bypass):
                        </label>
                        <input
                          type="text"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="e.g. Identity reverification or documented look-alike authorized by HR Head"
                          className="w-full text-xs p-2 rounded-[10px] border border-[#dcdfe4] focus:outline-none focus:ring-1 focus:ring-[#c09748]"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDuplicateBlock(null);
                              setOverrideReason('');
                            }}
                            className="px-3 py-1.5 text-xs text-[#777b86] hover:text-[#17191c] cursor-pointer"
                          >
                            Cancel & Retake
                          </button>
                          <button
                            type="button"
                            disabled={!overrideReason.trim()}
                            onClick={handleAdminOverrideConfirm}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer ${
                              overrideReason.trim()
                                ? 'bg-[#9f1239] text-white hover:bg-[#881337]'
                                : 'bg-[#f2f2f3] text-[#979799] cursor-not-allowed'
                            }`}
                          >
                            Authorize Admin Override
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pose Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1.5 text-xs text-[#777b86] hover:text-[#17191c] flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>Retake All</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCapturePose}
                        disabled={isProcessing}
                        className="px-5 py-2.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95 flex items-center gap-2"
                      >
                        <Camera size={15} className="text-[#c09748]" />
                        <span>{isProcessing ? 'Analyzing Facial Vectors...' : `Click to Capture Pose ${currentPose.id}`}</span>
                      </button>

                      {currentStepIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => setCurrentStepIndex(prev => prev - 1)}
                          className="px-3 py-2 text-xs text-[#777b86] hover:text-[#17191c] flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft size={14} />
                          <span>Back</span>
                        </button>
                      )}

                      {currentStepIndex < POSE_STEPS.length - 1 && (
                        <button
                          type="button"
                          disabled={!capturedPoses.some(p => p.stepId === currentPose.id)}
                          onClick={() => {
                            if (capturedPoses.some(p => p.stepId === currentPose.id)) {
                              setCurrentStepIndex(prev => prev + 1);
                            }
                          }}
                          className={`px-3 py-2 text-xs flex items-center gap-1 transition ${
                            capturedPoses.some(p => p.stepId === currentPose.id)
                              ? 'text-[#17191c] hover:text-[#c09748] cursor-pointer font-semibold'
                              : 'text-[#979799] opacity-40 cursor-not-allowed'
                          }`}
                          title={!capturedPoses.some(p => p.stepId === currentPose.id) ? `Pose ${currentPose.id} must be captured before moving forward` : undefined}
                        >
                          <span>Next</span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* UPLOAD TAB */
            <div className="space-y-4">
              <label className="border-2 border-dashed border-[#dcdfe4] hover:border-[#c09748] rounded-[20px] p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-[#fafafb] transition">
                <Upload size={32} className="text-[#c09748] mb-2" />
                <span className="text-xs font-semibold text-[#17191c]">Click to upload employee face photo</span>
                <span className="text-[11px] text-[#777b86] mt-0.5">JPEG or PNG under 5MB. Must be front-facing with clear lighting.</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Captured Poses Thumbnails Strip */}
          {capturedPoses.length > 0 && (
            <div className="pt-2 border-t border-[#f2f2f3]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#979799] block mb-2">
                Captured Pose Thumbnails ({capturedPoses.length} / {POSE_STEPS.length})
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {capturedPoses.map((p) => (
                  <div key={p.stepId} className="relative rounded-[12px] overflow-hidden border border-[#ececec] w-16 h-16 bg-[#fafafb] shrink-0">
                    <img src={p.imgDataUrl} alt={p.label} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-[#17191c]/70 text-[8px] text-white text-center py-0.5 truncate">
                      P{p.stepId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#ececec] flex items-center justify-between bg-[#fafafb]">
          <div className="flex items-center gap-1.5 text-[11px] text-[#777b86]">
            <ShieldCheck size={14} className="text-[#c09748]" />
            <span>Master Profile: {capturedPoses.length} poses calibrated</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#777b86] hover:text-[#17191c] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndEnroll}
              disabled={capturedPoses.length === 0}
              className={`px-5 py-2.5 text-xs font-semibold rounded-full shadow-2xs transition flex items-center gap-1.5 cursor-pointer ${
                capturedPoses.length > 0
                  ? 'bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] active:scale-95'
                  : 'bg-[#ececec] text-[#979799] cursor-not-allowed border border-[#e5e7eb]'
              }`}
            >
              <Sparkles size={14} className={capturedPoses.length > 0 ? 'text-[#c09748]' : 'text-[#979799]'} />
              <span>Save & Complete Master Enrollment</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
