import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Camera,
  X, 
  Check, 
  RefreshCw, 
  RotateCw,
  Upload, 
  Smile, 
  Glasses, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown,
  CornerDownLeft,
  CornerDownRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  UserCheck, 
  Sparkles, 
  Sun,
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
  playAttendanceConfirmationChime,
  extractBiometricBaseline,
  estimateHeadPoseFromLandmarks,
  EnrollmentBaseline,
  generateFaceEmbedding512
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
  category?: 'STANDARD' | 'SPECTACLES' | 'APPEARANCE';
}

export const HREnrollFaceModal: React.FC<HREnrollFaceModalProps> = ({
  employee,
  allEmployees = [],
  isOpen,
  onClose,
  onSaveFaceDescriptors,
}) => {
  if (!employee || !employee.id) return null;

  const [wearsGlasses, setWearsGlasses] = useState<boolean>(() => {
    return employee.wearsGlasses ?? false;
  });
  const [cameraRotation, setCameraRotation] = useState<0 | 90 | 180 | 270>(0);

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

  // Real-time quality gate & visual tracker
  const [qualityDetails, setQualityDetails] = useState<EnrollmentQualityDetails | null>(null);
  const [detectedBox, setDetectedBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [topErrorMessage, setTopErrorMessage] = useState<string | null>(null);

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
  const isProcessingRef = useRef<boolean>(false);
  const bypassDuplicateCheckRef = useRef<boolean>(false);
  const baselineRef = useRef<EnrollmentBaseline | null>(null);

  const ALL_20_POSE_STEPS: PoseInstruction[] = [
    {
      id: 1,
      title: 'Straight Front',
      subtitle: 'Look directly at camera (Yaw 0°, Pitch 0°)',
      hindiInstruction: 'सीधा कैमरे की तरफ देखें (Straight Front)',
      icon: <UserCheck size={24} className="text-[#c09748]" />,
      guideVisual: 'CENTER',
      category: 'STANDARD',
    },
    {
      id: 2,
      title: 'Slight Left',
      subtitle: 'Turn head slightly left (~10°)',
      hindiInstruction: 'थोड़ा बायीं तरफ घुमाएं (Slight Left ~10°)',
      icon: <ArrowLeft size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_LEFT',
      category: 'STANDARD',
    },
    {
      id: 3,
      title: 'Slight Right',
      subtitle: 'Turn head slightly right (~10°)',
      hindiInstruction: 'थोड़ा दायीं तरफ घुमाएं (Slight Right ~10°)',
      icon: <ArrowRight size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_RIGHT',
      category: 'STANDARD',
    },
    {
      id: 4,
      title: 'Left',
      subtitle: 'Turn head further left (~15°)',
      hindiInstruction: 'बायीं तरफ घुमाएं (Turn Left ~15°)',
      icon: <ArrowLeft size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_LEFT',
      category: 'STANDARD',
    },
    {
      id: 5,
      title: 'Right',
      subtitle: 'Turn head further right (~15°)',
      hindiInstruction: 'दायीं तरफ घुमाएं (Turn Right ~15°)',
      icon: <ArrowRight size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_RIGHT',
      category: 'STANDARD',
    },
    {
      id: 6,
      title: 'Looking Up',
      subtitle: 'Tilt chin slightly upward (~10°)',
      hindiInstruction: 'ठोड़ी को थोड़ा ऊपर उठाएं (Look Up ~10°)',
      icon: <ArrowUp size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_UP',
      category: 'STANDARD',
    },
    {
      id: 7,
      title: 'Looking Down',
      subtitle: 'Tilt chin slightly downward (~10°)',
      hindiInstruction: 'ठोड़ी को थोड़ा नीचे झुकाएं (Look Down ~10°)',
      icon: <ArrowDown size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_DOWN',
      category: 'STANDARD',
    },
    {
      id: 8,
      title: 'Head Tilt Left',
      subtitle: 'Tilt head slightly to left shoulder (~10°)',
      hindiInstruction: 'सिर को बायीं तरफ झुकाएं (Tilt Left ~10°)',
      icon: <CornerDownLeft size={24} className="text-[#c09748]" />,
      guideVisual: 'TILT_LEFT',
      category: 'STANDARD',
    },
    {
      id: 9,
      title: 'Head Tilt Right',
      subtitle: 'Tilt head slightly to right shoulder (~10°)',
      hindiInstruction: 'सिर को दायीं तरफ झुकाएं (Tilt Right ~10°)',
      icon: <CornerDownRight size={24} className="text-[#c09748]" />,
      guideVisual: 'TILT_RIGHT',
      category: 'STANDARD',
    },
    {
      id: 10,
      title: 'Left + Up',
      subtitle: 'Turn slightly left and tilt chin up',
      hindiInstruction: 'थोड़ा बायीं ओर ऊपर देखें (Left + Up)',
      icon: <ArrowUpLeft size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_LEFT_UP',
      category: 'STANDARD',
    },
    {
      id: 11,
      title: 'Right + Up',
      subtitle: 'Turn slightly right and tilt chin up',
      hindiInstruction: 'थोड़ा दायीं ओर ऊपर देखें (Right + Up)',
      icon: <ArrowUpRight size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_RIGHT_UP',
      category: 'STANDARD',
    },
    {
      id: 12,
      title: 'Left + Down',
      subtitle: 'Turn slightly left and look downward',
      hindiInstruction: 'थोड़ा बायीं ओर नीचे देखें (Left + Down)',
      icon: <ArrowDownLeft size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_LEFT_DOWN',
      category: 'STANDARD',
    },
    {
      id: 13,
      title: 'Glasses – Straight Front',
      subtitle: 'Straight front with everyday spectacles',
      hindiInstruction: 'चश्मे के साथ सीधा देखें (Glasses Straight)',
      icon: <Glasses size={24} className="text-[#c09748]" />,
      guideVisual: 'CENTER_GLASSES',
      category: 'SPECTACLES',
    },
    {
      id: 14,
      title: 'Glasses – Left',
      subtitle: 'Turn head left with spectacles',
      hindiInstruction: 'चश्मे के साथ बायीं तरफ घुमाएं (Glasses Left)',
      icon: <Glasses size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_LEFT_GLASSES',
      category: 'SPECTACLES',
    },
    {
      id: 15,
      title: 'Glasses – Right',
      subtitle: 'Turn head right with spectacles',
      hindiInstruction: 'चश्मे के साथ दायीं तरफ घुमाएं (Glasses Right)',
      icon: <Glasses size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_RIGHT_GLASSES',
      category: 'SPECTACLES',
    },
    {
      id: 16,
      title: 'Glasses – Looking Up',
      subtitle: 'Tilt chin up with spectacles',
      hindiInstruction: 'चश्मे के साथ ऊपर देखें (Glasses Up)',
      icon: <Glasses size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_UP_GLASSES',
      category: 'SPECTACLES',
    },
    {
      id: 17,
      title: 'Glasses – Looking Down',
      subtitle: 'Tilt chin down with spectacles',
      hindiInstruction: 'चश्मे के साथ नीचे देखें (Glasses Down)',
      icon: <Glasses size={24} className="text-[#c09748]" />,
      guideVisual: 'ARROW_DOWN_GLASSES',
      category: 'SPECTACLES',
    },
    {
      id: 18,
      title: 'Glasses – Head Tilt',
      subtitle: 'Tilt head with spectacles',
      hindiInstruction: 'चश्मे के साथ सिर झुकाएं (Glasses Tilt)',
      icon: <Glasses size={24} className="text-[#c09748]" />,
      guideVisual: 'TILT_GLASSES',
      category: 'SPECTACLES',
    },
    {
      id: 19,
      title: 'Alternate Lighting',
      subtitle: 'Front-facing under ambient / diffuse light',
      hindiInstruction: 'हल्की अलग रोशनी में सीधा देखें (Alternate Light)',
      icon: <Sun size={24} className="text-[#c09748]" />,
      guideVisual: 'CENTER_LIGHT',
      category: 'APPEARANCE',
    },
    {
      id: 20,
      title: 'Natural Appearance',
      subtitle: 'Everyday normal hairstyle and expression',
      hindiInstruction: 'सामान्य प्राकृतिक रूप (Natural Appearance)',
      icon: <Sparkles size={24} className="text-[#c09748]" />,
      guideVisual: 'CENTER_NATURAL',
      category: 'APPEARANCE',
    },
  ];

  const POSE_STEPS = useMemo(() => {
    if (!wearsGlasses) {
      return ALL_20_POSE_STEPS.filter((p) => p.category !== 'SPECTACLES');
    }
    return ALL_20_POSE_STEPS;
  }, [wearsGlasses]);

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

    // Final security gate: Check master vector against existing enrolled staff (strict 0.35 threshold)
    if (!bypassDuplicateCheckRef.current && allEmployees.length > 0) {
      const dup = checkDuplicateFace(masterVector, allEmployees, employee.id, 0.35);
      if (dup.isDuplicate && dup.matchedEmployee) {
        const similarity = Math.round(Math.max(70, Math.min(99, (1 - dup.distance / 0.40) * 30 + 70)));
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

  // One-click Reassign & Overwrite biometrics to current employee (handles test profiles / re-enrollment cleanly)
  const handleForceReassignToCurrent = () => {
    bypassDuplicateCheckRef.current = true;
    setDuplicateError(null);
    setTopErrorMessage(null);

    if (duplicateError?.pendingPose) {
      const pending = duplicateError.pendingPose;
      const currentList = capturedPosesRef.current;
      const updatedPoses = [...currentList.filter((p) => p.stepId !== pending.stepId), pending];
      setCapturedPoses(updatedPoses);

      if (currentStepIndexRef.current >= POSE_STEPS.length - 1) {
        finalizeEnrollment(updatedPoses);
      } else {
        setCurrentStepIndex((prev) => prev + 1);
      }
    }
  };

  // Authorize Admin Override for duplicate face
  const handleAdminOverrideConfirm = () => {
    if (!adminOverrideReason.trim() || !duplicateError) return;
    handleForceReassignToCurrent();
    setAdminOverrideReason('');
    setShowOverridePanel(false);
  };

  // Canvas drawing helper respecting camera mounting rotation (0, 90, 180, 270)
  const drawFrameToCanvas = useCallback(
    (video: HTMLVideoElement, targetCanvas: HTMLCanvasElement) => {
      const isSideways = cameraRotation === 90 || cameraRotation === 270;
      const vW = video.videoWidth || 640;
      const vH = video.videoHeight || 480;
      targetCanvas.width = isSideways ? vH : vW;
      targetCanvas.height = isSideways ? vW : vH;
      const ctx = targetCanvas.getContext('2d');
      if (!ctx) return null;

      if (cameraRotation !== 0) {
        ctx.save();
        ctx.translate(targetCanvas.width / 2, targetCanvas.height / 2);
        ctx.rotate((cameraRotation * Math.PI) / 180);
        ctx.drawImage(video, -vW / 2, -vH / 2, vW, vH);
        ctx.restore();
      } else {
        ctx.drawImage(video, 0, 0, targetCanvas.width, targetCanvas.height);
      }
      return ctx;
    },
    [cameraRotation]
  );

  // Manual Pose Capture Trigger (operator or employee clicks the button)
  const handleCapturePose = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    setTopErrorMessage(null);

    try {
      const activeIdx = currentStepIndexRef.current;
      const targetPose = POSE_STEPS[Math.min(activeIdx, POSE_STEPS.length - 1)] || POSE_STEPS[0];

      const video = videoRef.current;
      if (!video) {
        setTopErrorMessage('कैमरा उपलब्ध नहीं है (Camera not available).');
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = drawFrameToCanvas(video, canvas);
      if (!ctx) {
        setTopErrorMessage('कैमरा फ्रेम कैप्चर नहीं हो सका (Frame capture failed).');
        return;
      }

      let detection = await faceapi
        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.18 }))
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptor();

      if (!detection) {
        // Fallback with lower threshold to ensure budget webcams are never dropped
        detection = await faceapi
          .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.12 }))
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptor();
      }

      if (!detection) {
        setTopErrorMessage('चेहरा नहीं दिखा (Face not detected). कृपया कैमरे के ठीक सामने आएं और दोबारा क्लिक करें।');
        return;
      }

      // Explicit Quality & Pose Verification
      const quality = assessEnrollmentQuality(
        detection,
        ctx,
        canvas.width,
        canvas.height,
        targetPose.id,
        baselineRef.current
      );

      if (!quality.passed) {
        const errReason = quality.reasons.length > 0
          ? quality.reasons[0]
          : 'Pose match nahi hua. Kripya instruction ke mutabiq pose banayein aur retry karein.';
        setTopErrorMessage(errReason);
        return;
      }

      // Pose Approved! Generate 512-D embedding
      const base128 = Array.from(detection.descriptor);
      const descriptor = await generateFaceEmbedding512(canvas, detection.detection.box, base128);
      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const newPose = {
        stepId: targetPose.id,
        label: targetPose.title,
        descriptor,
        imgDataUrl,
      };

      // Strict Duplicate Face Check on Step 1 (Frontal Neutral): Blocks early if face belongs to another employee
      if (!bypassDuplicateCheckRef.current && allEmployees.length > 0 && activeIdx === 0) {
        const dup = checkDuplicateFace(descriptor, allEmployees, employee.id, 0.35);
        if (dup.isDuplicate && dup.matchedEmployee) {
          const similarity = Math.round(Math.max(70, Math.min(99, (1 - dup.distance / 0.40) * 30 + 70)));
          setDuplicateError({
            matchedEmployee: dup.matchedEmployee,
            distance: dup.distance,
            similarity,
            pendingPose: newPose,
          });
          return; // Strictly abort and block saving!
        }
      }

      // Store facial baseline from Step 1 (Neutral Frontal) or Step 3 Turn Sign
      if (activeIdx === 0 && detection.landmarks) {
        baselineRef.current = extractBiometricBaseline(detection.landmarks);
      } else if (activeIdx === 2 && detection.landmarks) {
        const p = estimateHeadPoseFromLandmarks(detection.landmarks, undefined, baselineRef.current);
        const effectiveYaw = p.eyeNoseYaw - (baselineRef.current?.restingYaw || 0);
        const sign = Math.sign(effectiveYaw || p.jawYaw) || 1;
        if (baselineRef.current) {
          baselineRef.current.step3YawSign = sign;
        } else {
          baselineRef.current = {
            ...extractBiometricBaseline(detection.landmarks),
            step3YawSign: sign,
          };
        }
      }

      // Approved! Flash feedback & audio chime
      playAttendanceConfirmationChime();
      setJustCapturedFlash(true);
      setTimeout(() => setJustCapturedFlash(false), 300);

      const currentList = capturedPosesRef.current;
      const updatedPoses = [...currentList.filter((p) => p.stepId !== targetPose.id), newPose];
      setCapturedPoses(updatedPoses);
      setTopErrorMessage(null);

      // Check if all poses are now completed
      const allRequiredCaptured = POSE_STEPS.every((s) =>
        updatedPoses.some((p) => p.stepId === s.id)
      );

      if (allRequiredCaptured) {
        finalizeEnrollment(updatedPoses);
      } else {
        // Move to next pose!
        const nextMissingIndex = POSE_STEPS.findIndex(
          (s) => !updatedPoses.some((p) => p.stepId === s.id)
        );
        if (nextMissingIndex !== -1) {
          setCurrentStepIndex(nextMissingIndex);
        } else if (activeIdx < POSE_STEPS.length - 1) {
          setCurrentStepIndex(activeIdx + 1);
        }
      }
    } catch (err) {
      console.warn('Capture pose error:', err);
      setTopErrorMessage('प्रक्रिया में त्रुटि (Processing error). कृपया दोबारा प्रयास करें।');
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [allEmployees, employee.id, POSE_STEPS, drawFrameToCanvas]);

  // Live Face Detection Tracker Loop (runs every 180ms - purely visual tracking, NEVER auto-captures)
  useEffect(() => {
    if (!isOpen || isSuccessModalOpen || duplicateError) {
      return;
    }

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4 || isProcessingRef.current) return;

      try {
        const offscreen = document.createElement('canvas');
        const ctx = drawFrameToCanvas(video, offscreen);
        if (!ctx) return;

        const activeIdx = currentStepIndexRef.current;
        const targetPose = POSE_STEPS[Math.min(activeIdx, POSE_STEPS.length - 1)] || POSE_STEPS[0];

        const det = await faceapi
          .detectSingleFace(offscreen, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.18 }))
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptor();

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
            targetPose.id,
            baselineRef.current
          );
          setQualityDetails(quality);
        } else {
          setDetectedBox(null);
          setQualityDetails(null);
        }
      } catch {
        // scan frame glitch ignored
      }
    }, 180);

    return () => clearInterval(interval);
  }, [isOpen, isSuccessModalOpen, duplicateError, POSE_STEPS, drawFrameToCanvas]);

  const handleReset = () => {
    baselineRef.current = null;
    setCapturedPoses([]);
    setCurrentStepIndex(0);
    isProcessingRef.current = false;
    bypassDuplicateCheckRef.current = false;
    setDuplicateError(null);
    setAdminOverrideReason('');
    setShowOverridePanel(false);
    setTopErrorMessage(null);
  };

  const getPoseLabel = (poseType?: string) => {
    switch (poseType) {
      case 'SMILE': return 'Smiling (मुस्कान)';
      case 'LEFT': return 'Turned Left (बाएं)';
      case 'RIGHT': return 'Turned Right (दाएं)';
      case 'UP': return 'Chin Up (ठोड़ी ऊपर)';
      case 'DOWN': return 'Looking Down (नीचे)';
      case 'TILT': return 'Head Tilt (झुका हुआ)';
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
          style={{
            transform: `scaleX(-1) rotate(${cameraRotation}deg)`,
          }}
          className={`w-full h-full object-cover transition-all duration-200 ${
            justCapturedFlash ? 'opacity-40' : 'opacity-100'
          }`}
        />

        {/* TOP BAR: Clean & Minimal - Name, Step Counter, Orientation, Spectacles, AI Live Pose & Close */}
        <div className="absolute top-0 inset-x-0 p-3 sm:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between z-20 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
              {employee.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-bold text-sm sm:text-base drop-shadow-md leading-tight truncate">
                  {employee.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono hidden sm:inline-block">
                  Manual Mode
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/60 font-mono truncate">
                {employee.id} • Pose {currentPose.id} ({currentStepIndex + 1}/{POSE_STEPS.length})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Camera Rotation Switcher (0, 90, 180, 270) */}
            <button
              type="button"
              onClick={() => {
                setCameraRotation((prev) => {
                  if (prev === 0) return 90;
                  if (prev === 90) return 180;
                  if (prev === 180) return 270;
                  return 0;
                });
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs text-white/90 hover:text-white hover:bg-black/70 transition cursor-pointer select-none"
              title="Camera Orientation: 0°, 90°, 180°, 270°"
            >
              <RotateCw size={12} className="text-[#c09748]" />
              <span className="font-mono text-[11px]">{cameraRotation}°</span>
            </button>

            {/* Wears Spectacles Toggle */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs text-white cursor-pointer select-none hover:bg-black/70 transition">
              <Glasses size={13} className="text-[#c09748]" />
              <span className="text-white/80 hidden xs:inline text-[11px] font-medium">Glasses</span>
              <input
                type="checkbox"
                checked={wearsGlasses}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setWearsGlasses(checked);
                  setCurrentStepIndex(0);
                  setCapturedPoses([]);
                  setTopErrorMessage(null);
                }}
                className="w-3.5 h-3.5 accent-[#c09748] rounded cursor-pointer"
              />
            </label>

            {/* Live AI Detected Pose Badge */}
            {qualityDetails && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs text-white">
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
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center bg-black/40 text-white/80 hover:text-white border border-white/15 backdrop-blur-md cursor-pointer active:scale-95 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* SCREEN TOP VALIDATION ERROR BANNER */}
        {topErrorMessage && (
          <div className="absolute top-16 sm:top-20 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 max-w-md z-30 bg-rose-600/95 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-rose-400 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle size={18} className="shrink-0 text-amber-300" />
              <div className="text-xs sm:text-sm font-semibold leading-snug">
                {topErrorMessage}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTopErrorMessage(null)}
              className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )}

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
            className={`relative w-[210px] h-[280px] sm:w-[260px] sm:h-[340px] rounded-[50%] border-2 transition-all duration-300 flex items-center justify-center ${
              qualityDetails?.passed
                ? 'border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.45)]'
                : 'border-white/40 border-dashed'
            }`}
          >
            {/* Guide Visuals for Turn / Tilt / Direction / Extras */}
            {(currentPose.guideVisual === 'ARROW_LEFT' || currentPose.guideVisual === 'ARROW_LEFT_GLASSES') && (
              <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce shadow-lg">
                <ArrowLeft size={16} />
                <span>Turn Left</span>
              </div>
            )}

            {(currentPose.guideVisual === 'ARROW_RIGHT' || currentPose.guideVisual === 'ARROW_RIGHT_GLASSES') && (
              <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce shadow-lg">
                <span>Turn Right</span>
                <ArrowRight size={16} />
              </div>
            )}

            {(currentPose.guideVisual === 'ARROW_UP' || currentPose.guideVisual === 'ARROW_UP_GLASSES') && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce shadow-lg">
                <ArrowUp size={16} />
                <span>Chin Up</span>
              </div>
            )}

            {(currentPose.guideVisual === 'ARROW_DOWN' || currentPose.guideVisual === 'ARROW_DOWN_GLASSES') && (
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce shadow-lg">
                <ArrowDown size={16} />
                <span>Look Down</span>
              </div>
            )}

            {currentPose.guideVisual === 'TILT_LEFT' && (
              <div className="absolute -left-16 top-1/3 -translate-y-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce shadow-lg">
                <CornerDownLeft size={16} />
                <span>Tilt Left</span>
              </div>
            )}

            {(currentPose.guideVisual === 'TILT_RIGHT' || currentPose.guideVisual === 'TILT_GLASSES') && (
              <div className="absolute -right-16 top-1/3 -translate-y-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce shadow-lg">
                <span>Tilt Right</span>
                <CornerDownRight size={16} />
              </div>
            )}

            {currentPose.guideVisual === 'ARROW_LEFT_UP' && (
              <div className="absolute -left-14 -top-8 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce shadow-lg">
                <ArrowUpLeft size={16} />
                <span>Left + Up</span>
              </div>
            )}

            {currentPose.guideVisual === 'ARROW_RIGHT_UP' && (
              <div className="absolute -right-14 -top-8 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce shadow-lg">
                <span>Right + Up</span>
                <ArrowUpRight size={16} />
              </div>
            )}

            {currentPose.guideVisual === 'ARROW_LEFT_DOWN' && (
              <div className="absolute -left-14 -bottom-8 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce shadow-lg">
                <ArrowDownLeft size={16} />
                <span>Left + Down</span>
              </div>
            )}

            {(currentPose.guideVisual === 'CENTER_GLASSES' || currentPose.category === 'SPECTACLES') && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-cyan-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-cyan-400 animate-pulse shadow-lg">
                <Glasses size={16} />
                <span>Wear Glasses</span>
              </div>
            )}

            {currentPose.guideVisual === 'CENTER_LIGHT' && (
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce shadow-lg">
                <Sun size={16} />
                <span>Diffuse Light</span>
              </div>
            )}

            {currentPose.guideVisual === 'CENTER_NATURAL' && (
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-amber-300 font-bold text-xs bg-black/85 px-3 py-1.5 rounded-full border border-amber-400 animate-bounce shadow-lg">
                <Sparkles size={16} />
                <span>Natural Look</span>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: Pose Instruction Text + Exactly 1 Capture Button */}
        <div className="absolute bottom-0 inset-x-0 p-4 pb-6 sm:pb-8 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col items-center z-20">
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-3">
            {/* Pose Instruction Text */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11px] text-white/80 font-mono mb-1">
                <span>Pose {currentStepIndex + 1} of {POSE_STEPS.length}:</span>
                <span className="text-[#c09748] font-bold">{currentPose.title}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide drop-shadow-md">
                {currentPose.hindiInstruction}
              </h2>
              <p className="text-xs text-white/70 mt-0.5 font-medium">
                {currentPose.subtitle}
              </p>
            </div>

            {/* Exactly 1 Single Manual Capture Button */}
            <button
              type="button"
              onClick={() => handleCapturePose()}
              disabled={isProcessing}
              className="w-full py-3.5 px-6 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-sm sm:text-base font-bold shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Camera size={18} className="text-[#c09748]" />
              <span>{isProcessing ? 'Verifying Pose...' : `Capture Pose ${currentStepIndex + 1}`}</span>
            </button>
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
            <div className="mt-5 flex flex-col gap-2.5 w-full max-w-sm">
              <button
                onClick={handleForceReassignToCurrent}
                className="w-full py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>Reassign / Overwrite to {employee.name}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDuplicateError(null);
                    handleReset();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RefreshCw size={13} />
                  <span>Try Another Person</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  Cancel & Close
                </button>
              </div>
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
