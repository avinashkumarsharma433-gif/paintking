import React, { useState, useRef, useEffect } from 'react';
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
  Sun
} from 'lucide-react';
import { Employee } from '../../types/hrAttendanceTypes';
import { 
  extractFaceDescriptorFromCanvas, 
  loadFaceModels,
  computeMasterVector,
  checkDuplicateFace
} from '../../services/faceRecognitionService';

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
  const [duplicateWarning, setDuplicateWarning] = useState<{ name: string; id: string; confidence: number } | null>(null);

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

  // Capture Current Step Pose
  const handleCapturePose = async () => {
    if (!videoRef.current || isProcessing) return;
    setIsProcessing(true);
    setDuplicateWarning(null);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const descriptor = await extractFaceDescriptorFromCanvas(canvas);
      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      if (descriptor) {
        // If step 1, check duplicate face
        if (currentStepIndex === 0 && allEmployees.length > 0) {
          const dup = checkDuplicateFace(descriptor, allEmployees, employee.id);
          if (dup.isDuplicate && dup.matchedEmployee) {
            setDuplicateWarning({
              name: dup.matchedEmployee.name,
              id: dup.matchedEmployee.id,
              confidence: Math.round((1 - dup.distance / 0.6) * 100),
            });
          }
        }

        const newPose = {
          stepId: currentPose.id,
          label: currentPose.title,
          descriptor,
          imgDataUrl,
        };

        const updatedPoses = [...capturedPoses.filter(p => p.stepId !== currentPose.id), newPose];
        setCapturedPoses(updatedPoses);

        // Move to next step if not final
        if (currentStepIndex < POSE_STEPS.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        }
      } else {
        alert('Face not clearly detected. Please ensure your face is well-lit and inside the oval guide.');
      }
    } catch {
      // extraction error
    } finally {
      setIsProcessing(false);
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
    setDuplicateWarning(null);
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

        {/* Duplicate Face Warning */}
        {duplicateWarning && (
          <div className="m-5 mb-0 p-3.5 rounded-[16px] bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] text-xs flex items-start gap-2.5 animate-in slide-in-from-top">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#e11d48]" />
            <div>
              <span className="font-bold block">Duplicate Face Detected!</span>
              <span>
                This face is {duplicateWarning.confidence}% identical to existing employee: {' '}
                <strong>{duplicateWarning.name} ({duplicateWarning.id})</strong>. 
                Please verify identity before saving.
              </span>
            </div>
          </div>
        )}

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
                  
                  {/* Step Stepper Bar with Icons */}
                  <div className="grid grid-cols-6 gap-1.5 bg-[#fafafb] p-2 rounded-[18px] border border-[#ececec]">
                    {POSE_STEPS.map((step, idx) => {
                      const isCompleted = capturedPoses.some(p => p.stepId === step.id);
                      const isCurrent = idx === currentStepIndex;

                      return (
                        <button
                          key={step.id}
                          onClick={() => setCurrentStepIndex(idx)}
                          className={`p-2 rounded-[14px] flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-[#faf3e0] border border-[#c09748] text-[#8a6521] shadow-2xs'
                              : isCompleted
                              ? 'bg-white border border-[#dcdfe4] text-emerald-700'
                              : 'bg-transparent text-[#979799] opacity-60'
                          }`}
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

                  {/* Video Viewport with Interactive Visual Overlay Guidance */}
                  <div className="relative rounded-[20px] overflow-hidden bg-[#17191c] h-[280px] flex items-center justify-center border border-[#ececec]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* Central Face Target Oval Guide */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-[170px] h-[210px] rounded-[50%] border-2 border-dashed border-[#c09748] opacity-80 animate-pulse flex items-center justify-center">
                        <span className="text-[10px] text-white/90 bg-[#17191c]/70 px-2 py-0.5 rounded-full font-mono">
                          Fit Face In Oval
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
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <Check size={12} />
                        <span>Pose {currentPose.id} Captured</span>
                      </div>
                    )}
                  </div>

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

                      {currentStepIndex < POSE_STEPS.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setCurrentStepIndex(prev => prev + 1)}
                          className="px-3 py-2 text-xs text-[#777b86] hover:text-[#17191c] flex items-center gap-1 cursor-pointer"
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
