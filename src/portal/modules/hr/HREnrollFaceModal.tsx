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
  Zap,
  Play,
  AlertTriangle
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

export const HREnrollFaceModal: React.FC<HREnrollFaceModalProps> = ({
  employee,
  allEmployees = [],
  isOpen,
  onClose,
  onSaveFaceDescriptors,
}) => {
  const [activeTab, setActiveTab] = useState<'BURST' | 'STEP' | 'UPLOAD'>('BURST');
  const [capturedPoses, setCapturedPoses] = useState<{ label: string; descriptor: number[]; imgDataUrl: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBurstActive, setIsBurstActive] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{ name: string; id: string; confidence: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const burstIntervalRef = useRef<number | null>(null);

  const TARGET_BURST_PHOTOS = 20;

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
      if (burstIntervalRef.current) {
        clearInterval(burstIntervalRef.current);
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Single Frame Capture Helper
  const captureFrame = async (): Promise<{ descriptor: number[]; imgDataUrl: string } | null> => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (video.readyState !== 4) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const descriptor = await extractFaceDescriptorFromCanvas(canvas);
    if (!descriptor) return null;

    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.80);
    return { descriptor, imgDataUrl };
  };

  // Start Automatic 20-Photo Rapid Burst Capture
  const handleStartRapidBurst = async () => {
    if (isBurstActive || !videoRef.current) return;
    setIsBurstActive(true);
    setDuplicateWarning(null);
    setCapturedPoses([]);
    setBurstCount(0);

    const collected: { label: string; descriptor: number[]; imgDataUrl: string }[] = [];
    let count = 0;

    burstIntervalRef.current = window.setInterval(async () => {
      if (count >= TARGET_BURST_PHOTOS) {
        if (burstIntervalRef.current) clearInterval(burstIntervalRef.current);
        setIsBurstActive(false);

        // Check duplicate face against existing company profiles
        if (collected.length > 0 && allEmployees.length > 0) {
          const sampleVec = collected[0].descriptor;
          const dup = checkDuplicateFace(sampleVec, allEmployees, employee.id);
          if (dup.isDuplicate && dup.matchedEmployee) {
            setDuplicateWarning({
              name: dup.matchedEmployee.name,
              id: dup.matchedEmployee.id,
              confidence: Math.round((1 - dup.distance / 0.6) * 100),
            });
          }
        }
        return;
      }

      const res = await captureFrame();
      if (res) {
        count++;
        setBurstCount(count);
        collected.push({
          label: `Frame ${count}`,
          descriptor: res.descriptor,
          imgDataUrl: res.imgDataUrl,
        });
        setCapturedPoses([...collected]);
      }
    }, 180); // Captures 1 frame every 180ms (~3.5 seconds total)
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

    // Compute Master Vector from up to 20 vectors
    const masterVector = computeMasterVector(rawDescriptors);
    const combinedDescriptors = [masterVector, ...rawDescriptors];

    const avatarUrl = capturedPoses[0].imgDataUrl;
    onSaveFaceDescriptors(employee.id, combinedDescriptors, avatarUrl);
    onClose();
  };

  const handleReset = () => {
    if (burstIntervalRef.current) clearInterval(burstIntervalRef.current);
    setIsBurstActive(false);
    setCapturedPoses([]);
    setBurstCount(0);
    setDuplicateWarning(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#17191c]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] border border-[#ececec] shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#ececec] flex items-center justify-between bg-[#fafafb]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">
                In-House AI Biometrics
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] font-semibold border border-[#f4e5be]">
                20-Photo Rapid Burst Engine
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
              setActiveTab('BURST');
              handleReset();
            }}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'BURST'
                ? 'border-[#c09748] text-[#17191c]'
                : 'border-transparent text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            <Zap size={14} className={activeTab === 'BURST' ? 'text-[#c09748]' : 'text-[#979799]'} />
            <span>Auto 20-Photo Rapid Scan (3 Sec)</span>
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

        {/* Duplicate Face Warning Banner */}
        {duplicateWarning && (
          <div className="m-5 mb-0 p-3.5 rounded-[16px] bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] text-xs flex items-start gap-2.5 animate-in slide-in-from-top">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#e11d48]" />
            <div>
              <span className="font-bold block">Duplicate Face Detected!</span>
              <span>
                This face is {duplicateWarning.confidence}% identical to existing employee: {' '}
                <strong>{duplicateWarning.name} ({duplicateWarning.id})</strong>. 
                Please ensure you are not enrolling the same person under multiple profiles.
              </span>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {activeTab === 'BURST' ? (
            <div>
              {cameraError ? (
                <div className="p-4 rounded-[16px] bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239] text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{cameraError}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  
                  {/* Progress Pill Bar */}
                  <div className="flex items-center justify-between bg-[#fafafb] p-3 rounded-[16px] border border-[#ececec]">
                    <div>
                      <span className="text-[10px] font-semibold text-[#c09748] uppercase tracking-wider block">
                        {isBurstActive ? 'Capturing 20 Facial Angles...' : capturedPoses.length === 20 ? '20 Photos Successfully Captured!' : 'Rapid Multi-Angle Enrollment'}
                      </span>
                      <p className="text-xs text-[#17191c] font-medium mt-0.5">
                        {isBurstActive ? 'Slowly rotate head slightly while laser scans' : 'Click "Start Rapid Scan" for automatic 3-second 20-photo capture.'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-[#c09748]">
                        {burstCount} / {TARGET_BURST_PHOTOS}
                      </span>
                    </div>
                  </div>

                  {/* Video Viewport with HUD Overlay */}
                  <div className="relative rounded-[20px] overflow-hidden bg-[#17191c] h-[260px] flex items-center justify-center border border-[#ececec]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* Central Gold Oval Target Guide */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className={`w-[160px] h-[200px] rounded-[50%] border-2 transition-all ${
                        isBurstActive 
                          ? 'border-emerald-400 border-solid animate-pulse scale-105' 
                          : 'border-[#c09748] border-dashed opacity-80'
                      } flex items-center justify-center`}>
                        <span className="text-[10px] text-white/90 bg-[#17191c]/70 px-2 py-0.5 rounded-full font-mono">
                          {isBurstActive ? `Scanning ${burstCount}/20...` : 'Keep Face in Oval'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Overlay during Burst */}
                    {isBurstActive && (
                      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
                        <div 
                          className="h-full bg-emerald-400 transition-all duration-150"
                          style={{ width: `${(burstCount / TARGET_BURST_PHOTOS) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1.5 text-xs text-[#777b86] hover:text-[#17191c] flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>Retake Scan</span>
                    </button>

                    {capturedPoses.length < TARGET_BURST_PHOTOS ? (
                      <button
                        type="button"
                        onClick={handleStartRapidBurst}
                        disabled={isBurstActive}
                        className="px-5 py-2.5 bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer active:scale-95 flex items-center gap-2"
                      >
                        <Zap size={15} className="text-[#c09748]" />
                        <span>{isBurstActive ? 'Capturing 20 Angles...' : 'Start 20-Photo Rapid Scan'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8a6521] bg-[#faf3e0] px-3 py-1.5 rounded-full border border-[#f4e5be]">
                        <Check size={14} className="text-[#c09748]" />
                        <span>20 Biometric Angles Ready!</span>
                      </div>
                    )}
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

          {/* Captured Thumbnails Strip (Up to 20 Photos) */}
          {capturedPoses.length > 0 && (
            <div className="pt-2 border-t border-[#f2f2f3]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#979799]">
                  Captured Biometric Frames ({capturedPoses.length} Photos)
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Synthesizing Master Profile
                </span>
              </div>
              
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {capturedPoses.slice(0, 15).map((p, idx) => (
                  <div key={idx} className="relative rounded-[10px] overflow-hidden border border-[#ececec] w-12 h-12 bg-[#fafafb] shrink-0">
                    <img src={p.imgDataUrl} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-[#17191c]/70 text-[7px] text-white text-center py-0.5">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
                {capturedPoses.length > 15 && (
                  <div className="rounded-[10px] border border-[#ececec] w-12 h-12 bg-[#faf3e0] text-[#8a6521] flex items-center justify-center text-[10px] font-bold shrink-0">
                    +{capturedPoses.length - 15}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#ececec] flex items-center justify-between bg-[#fafafb]">
          <div className="flex items-center gap-1.5 text-[11px] text-[#777b86]">
            <ShieldCheck size={14} className="text-[#c09748]" />
            <span>20-Vector Noise Reduction L2 Norm</span>
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
              <span>Save & Complete Master Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
