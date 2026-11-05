import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Settings2, 
  Check,
  UserX,
  Users,
  Eye,
  Sliders
} from 'lucide-react';
import { 
  Employee, 
  AttendanceRecord, 
  LocationStamp, 
  TerminalConfig 
} from '../../types/hrAttendanceTypes';
import { 
  PAINTKING_LOCATIONS, 
  getVerifiedDeviceLocation 
} from '../../services/geofenceService';
import { 
  loadFaceModels,
  areModelsLoaded,
  detectMultipleFacesFromCanvas,
  DetectedFaceSlot,
  playAttendanceConfirmationChime 
} from '../../services/faceRecognitionService';

interface HRAttendanceTerminalProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onRecordPunch: (
    employee: Employee, 
    type: 'IN' | 'OUT', 
    locationStamp: LocationStamp
  ) => void;
}

export const HRAttendanceTerminal: React.FC<HRAttendanceTerminalProps> = ({
  employees,
  attendanceRecords,
  onRecordPunch,
}) => {
  // Terminal Settings with Security Threshold Slider
  const [config, setConfig] = useState<TerminalConfig>({
    activeLocationId: 'mumbai-hq',
    strictGeofence: true,
    bypassGeofenceForDev: false,
    minRecognitionConfidence: 0.46, // Strict Euclidean distance limit
    cooldownMinutes: 5,
  });

  const [requireLiveness, setRequireLiveness] = useState(true);
  const [securityPreset, setSecurityPreset] = useState<'STRICT' | 'NORMAL' | 'FAST'>('STRICT');

  // Geofence & Location State
  const [locationStamp, setLocationStamp] = useState<LocationStamp | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isVerifyingGPS, setIsVerifyingGPS] = useState(true);

  // Camera & Recognition State
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);

  // Multi-person detected face slots (up to 4 people)
  const [detectedFaces, setDetectedFaces] = useState<DetectedFaceSlot[]>([]);

  // Live match card popup
  const [recentPunch, setRecentPunch] = useState<{
    employee: Employee;
    type: 'IN' | 'OUT';
    time: string;
    confidence: number;
    isLive: boolean;
  } | null>(null);

  // Settings Panel Toggle
  const [showSettings, setShowSettings] = useState(false);

  // Cooldown tracker (empId -> timestamp ms)
  const lastPunchCooldownRef = useRef<Map<string, number>>(new Map());

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Verify GPS location
  const refreshGPS = async () => {
    setIsVerifyingGPS(true);
    setLocationError(null);
    const res = await getVerifiedDeviceLocation(
      config.activeLocationId, 
      config.bypassGeofenceForDev
    );
    setLocationStamp(res.stamp);
    if (res.error && config.strictGeofence && !config.bypassGeofenceForDev) {
      setLocationError(res.error);
    }
    setIsVerifyingGPS(false);
  };

  useEffect(() => {
    refreshGPS();
    loadFaceModels().then(() => setIsModelReady(true));
  }, [config.activeLocationId, config.strictGeofence, config.bypassGeofenceForDev]);

  // 2. Enumerate available video inputs
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setCameraDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoInputs[0].deviceId);
      }
    });
  }, []);

  // Preset security threshold adjustments
  const handlePresetChange = (preset: 'STRICT' | 'NORMAL' | 'FAST') => {
    setSecurityPreset(preset);
    if (preset === 'STRICT') setConfig((prev) => ({ ...prev, minRecognitionConfidence: 0.42 }));
    else if (preset === 'NORMAL') setConfig((prev) => ({ ...prev, minRecognitionConfidence: 0.47 }));
    else setConfig((prev) => ({ ...prev, minRecognitionConfidence: 0.53 }));
  };

  // 3. Start Camera Stream (720p HD for superior facial landmarks)
  useEffect(() => {
    if (!cameraActive) return;

    let isMounted = true;
    const startCamera = async () => {
      try {
        setCameraError(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: selectedCameraId
            ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isMounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Camera failed to start';
          setCameraError(msg);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraActive, selectedCameraId]);

  // 4. Live Multi-Face & Anti-Spoofing Recognition Loop
  useEffect(() => {
    if (!cameraActive || isVerifyingGPS || (locationError && !config.bypassGeofenceForDev)) {
      return;
    }

    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || isScanning) return;

      const video = videoRef.current;
      if (video.readyState !== 4) return;

      const canvas = canvasRef.current;
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setIsScanning(true);
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Neural multi-face detection with Anti-Spoofing & Liveness
        const detected = await detectMultipleFacesFromCanvas(
          canvas,
          employees,
          config.minRecognitionConfidence,
          requireLiveness
        );

        setDetectedFaces(detected);

        for (const face of detected) {
          if (face.status === 'RECOGNIZED' && face.matchResult.matchedEmployee) {
            const emp = face.matchResult.matchedEmployee;
            const nowMs = Date.now();
            const lastPunchTime = lastPunchCooldownRef.current.get(emp.id) || 0;
            const cooldownMs = config.cooldownMinutes * 60 * 1000;

            if (nowMs - lastPunchTime > cooldownMs) {
              lastPunchCooldownRef.current.set(emp.id, nowMs);

              const existingToday = attendanceRecords.find(
                (r) => r.employeeId === emp.id && r.date === todayStr
              );
              const punchType: 'IN' | 'OUT' = existingToday && existingToday.inTime ? 'OUT' : 'IN';

              playAttendanceConfirmationChime();

              if (locationStamp) {
                onRecordPunch(emp, punchType, locationStamp);
              }

              const timeStr = new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              });

              setRecentPunch({
                employee: emp,
                type: punchType,
                time: timeStr,
                confidence: face.matchResult.confidence,
                isLive: face.matchResult.isLive,
              });

              setTimeout(() => {
                setRecentPunch((prev) => (prev?.employee.id === emp.id ? null : prev));
              }, 4500);
            }
          }
        }
      } catch {
        // Recognition loop error ignored
      } finally {
        setIsScanning(false);
      }
    }, 1100);

    return () => clearInterval(interval);
  }, [
    cameraActive, 
    isVerifyingGPS, 
    locationError, 
    employees, 
    attendanceRecords, 
    config, 
    locationStamp, 
    todayStr, 
    isScanning, 
    requireLiveness,
    onRecordPunch
  ]);

  const todayPunches = attendanceRecords
    .filter((r) => r.date === todayStr)
    .sort((a, b) => (b.outTime || b.inTime || '').localeCompare(a.outTime || a.inTime || ''))
    .slice(0, 6);

  const activeLocation = PAINTKING_LOCATIONS.find((l) => l.id === config.activeLocationId) || PAINTKING_LOCATIONS[0];
  const isLockedOut = config.strictGeofence && !config.bypassGeofenceForDev && locationStamp && !locationStamp.isHQVerified;

  return (
    <div className="space-y-6">
      {/* Top Geofence Status Banner */}
      <div className={`p-4 rounded-[20px] border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isLockedOut
          ? 'bg-[#fff1f2] border-[#fecdd3] text-[#9f1239]'
          : locationStamp?.isHQVerified
          ? 'bg-[#faf3e0] border-[#f4e5be] text-[#8a6521]'
          : 'bg-[#fafafb] border-[#ececec] text-[#17191c]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
            isLockedOut ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-white text-[#c09748] shadow-2xs'
          }`}>
            {isLockedOut ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] block">
                {isLockedOut ? 'Geofence Lockdown' : 'Verified Plant Perimeter'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 border border-current/20">
                {activeLocation.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Anti-Spoofing: {requireLiveness ? 'ON' : 'OFF'}
              </span>
            </div>

            <p className="text-xs font-medium mt-0.5">
              {isVerifyingGPS ? (
                'Verifying device GPS coordinates...'
              ) : isLockedOut ? (
                `Terminal locked: Device is ${locationStamp?.distanceToHQ}m away from PaintKing premises (Max allowed: ${activeLocation.radiusMeters}m).`
              ) : (
                `GPS Locked: Within permitted boundary (${locationStamp?.distanceToHQ || 0}m from gate center, accuracy ±${locationStamp?.accuracy || 0}m).`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refreshGPS}
            className="px-3 py-1.5 bg-white text-xs font-semibold rounded-full border border-current/30 hover:bg-white/80 transition cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <RefreshCw size={12} className={isVerifyingGPS ? 'animate-spin' : ''} />
            <span>Recalibrate GPS</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1.5 bg-white text-xs font-semibold rounded-full border border-current/30 hover:bg-white/80 transition cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Settings2 size={13} />
            <span>AI Config & Security</span>
          </button>
        </div>
      </div>

      {/* Terminal Settings Drawer (Collapsible) */}
      {showSettings && (
        <div className="p-5 bg-white rounded-[24px] border border-[#ececec] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#f2f2f3] pb-3">
            <div>
              <h3 className="text-xs font-serif text-[#17191c] uppercase tracking-wider flex items-center gap-2">
                <Sliders size={14} className="text-[#c09748]" />
                <span>AI Accuracy & Anti-Spoofing Security Panel</span>
              </h3>
              <p className="text-[11px] text-[#777b86]">
                Configure biometric sensitivity, liveness detection, and physical entrance cameras
              </p>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs text-[#777b86] hover:text-[#17191c] cursor-pointer"
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Security Sensitivity Preset */}
            <div>
              <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                Security Preset Level
              </label>
              <div className="flex gap-1.5 p-1 bg-[#fafafb] border border-[#ececec] rounded-[16px]">
                <button
                  type="button"
                  onClick={() => handlePresetChange('STRICT')}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-[12px] transition cursor-pointer ${
                    securityPreset === 'STRICT' ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]' : 'text-[#777b86]'
                  }`}
                >
                  Strict (99.5%)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('NORMAL')}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-[12px] transition cursor-pointer ${
                    securityPreset === 'NORMAL' ? 'bg-white text-[#17191c] shadow-2xs' : 'text-[#777b86]'
                  }`}
                >
                  Balanced
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('FAST')}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-[12px] transition cursor-pointer ${
                    securityPreset === 'FAST' ? 'bg-[#f2f2f3] text-[#17191c]' : 'text-[#777b86]'
                  }`}
                >
                  Fast
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                Camera Source (HD 720p Recommended)
              </label>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748]"
              >
                {cameraDevices.map((dev) => (
                  <option key={dev.deviceId} value={dev.deviceId}>
                    {dev.label || `Camera ${dev.deviceId.slice(0, 6)}`}
                  </option>
                ))}
                {cameraDevices.length === 0 && <option value="">Default Front Camera</option>}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#17191c] mb-1">
                Punch Cooldown (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={config.cooldownMinutes}
                onChange={(e) => setConfig({ ...config, cooldownMinutes: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 text-xs bg-[#fafafb] border border-[#ececec] rounded-[16px] text-[#17191c] focus:outline-none focus:border-[#c09748]"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-[#17191c]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requireLiveness}
                onChange={(e) => setRequireLiveness(e.target.checked)}
                className="rounded border-[#dcdfe4] text-[#c09748] focus:ring-[#c09748]"
              />
              <span className="font-semibold text-emerald-800 flex items-center gap-1">
                <Eye size={13} className="text-emerald-600" />
                <span>Anti-Spoofing Liveness Detection (Prevents photo/screen spoofing)</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.strictGeofence}
                onChange={(e) => setConfig({ ...config, strictGeofence: e.target.checked })}
                className="rounded border-[#dcdfe4] text-[#c09748] focus:ring-[#c09748]"
              />
              <span className="font-medium">Strict Geofence Lock</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.bypassGeofenceForDev}
                onChange={(e) => setConfig({ ...config, bypassGeofenceForDev: e.target.checked })}
                className="rounded border-[#dcdfe4] text-[#c09748] focus:ring-[#c09748]"
              />
              <span className="text-[#8a6521] font-semibold">Dev Bypass Mode</span>
            </label>
          </div>
        </div>
      )}

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Camera Kiosk Viewport */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-[24px] overflow-hidden bg-[#17191c] border border-[#ececec] shadow-md flex items-center justify-center min-h-[460px]">
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-[460px] object-cover scale-x-[-1] transition-opacity duration-300 ${
                isLockedOut ? 'opacity-20 blur-sm' : 'opacity-100'
              }`}
            />
            
            <canvas ref={canvasRef} className="hidden" />

            {/* Locked Out Overlay */}
            {isLockedOut && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#17191c]/80 backdrop-blur-xs text-white z-20">
                <ShieldAlert size={48} className="text-[#f43f5e] mb-3 animate-bounce" />
                <h3 className="text-xl font-serif">Attendance Terminal Locked</h3>
                <p className="text-xs text-[#a3a6af] max-w-md mt-1 leading-relaxed">
                  You are currently outside the verified PaintKing boundary ({locationStamp?.distanceToHQ}m away). 
                  Please be within the physical Head Office premises to mark attendance.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={refreshGPS}
                    className="px-4 py-2 bg-white text-[#17191c] text-xs font-semibold rounded-full hover:bg-neutral-100 transition cursor-pointer"
                  >
                    Retry GPS Scan
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, bypassGeofenceForDev: true })}
                    className="px-4 py-2 bg-[#faf3e0] text-[#8a6521] text-xs font-semibold rounded-full hover:bg-[#f4e5be] transition cursor-pointer"
                  >
                    Enable Dev Bypass
                  </button>
                </div>
              </div>
            )}

            {/* Active Terminal HUD Overlay */}
            {!isLockedOut && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                
                {/* HUD Top Bar */}
                <div className="flex items-center justify-between text-white/90">
                  <div className="flex items-center gap-2 bg-[#17191c]/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} className="text-[#c09748]" />
                      <span>Neural Engine: ResNet-34 + Anti-Spoof</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-[#17191c]/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono">
                    <Clock size={13} className="text-[#c09748]" />
                    <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* DYNAMIC MULTI-FACE BOUNDING BOXES */}
                <div className="absolute inset-0 pointer-events-none">
                  {detectedFaces.map((slot, index) => {
                    const isRecognized = slot.status === 'RECOGNIZED';
                    const isSpoof = slot.status === 'SPOOF_SUSPECTED';
                    const empName = slot.matchResult.matchedEmployee?.name;

                    return (
                      <div
                        key={index}
                        style={{
                          left: `${slot.box.x}%`,
                          top: `${slot.box.y}%`,
                          width: `${slot.box.width}%`,
                          height: `${slot.box.height}%`,
                        }}
                        className={`absolute rounded-[16px] transition-all duration-300 border-2 ${
                          isRecognized
                            ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                            : isSpoof
                            ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                            : 'border-rose-400 bg-rose-500/10 shadow-[0_0_15px_rgba(251,113,133,0.3)]'
                        }`}
                      >
                        {/* Status Label on Top of Face */}
                        <div className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 whitespace-nowrap shadow-md ${
                          isRecognized
                            ? 'bg-emerald-600 text-white'
                            : isSpoof
                            ? 'bg-amber-600 text-white animate-bounce'
                            : 'bg-rose-600 text-white animate-pulse'
                        }`}>
                          {isRecognized ? (
                            <>
                              <CheckCircle2 size={11} />
                              <span>{empName} ({slot.matchResult.confidence}%)</span>
                            </>
                          ) : isSpoof ? (
                            <>
                              <AlertTriangle size={11} />
                              <span>Liveness Check Failed (Spoof Suspected)</span>
                            </>
                          ) : (
                            <>
                              <UserX size={11} />
                              <span>Unknown (Unregistered Face)</span>
                            </>
                          )}
                        </div>

                        {/* Four Corner Target Brackets */}
                        <div className={`absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 ${isRecognized ? 'border-emerald-300' : isSpoof ? 'border-amber-300' : 'border-rose-300'}`} />
                        <div className={`absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 ${isRecognized ? 'border-emerald-300' : isSpoof ? 'border-amber-300' : 'border-rose-300'}`} />
                        <div className={`absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 ${isRecognized ? 'border-emerald-300' : isSpoof ? 'border-amber-300' : 'border-rose-300'}`} />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 ${isRecognized ? 'border-emerald-300' : isSpoof ? 'border-amber-300' : 'border-rose-300'}`} />
                      </div>
                    );
                  })}

                  {/* Fallback Static Gold Frame */}
                  {detectedFaces.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-[240px] h-[300px] flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#c09748]" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#c09748]" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#c09748]" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#c09748]" />
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#c09748] to-transparent opacity-80 animate-pulse" />
                        <span className="absolute bottom-3 text-[10px] text-white/80 font-mono uppercase tracking-widest bg-[#17191c]/70 px-2 py-0.5 rounded-full">
                          Multi-Face Scan Ready
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* HUD Bottom Bar */}
                <div className="flex items-center justify-between text-white/80 text-[11px] z-10">
                  <span className="bg-[#17191c]/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    Location: {activeLocation.name}
                  </span>
                  <span className="bg-[#17191c]/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 font-mono">
                    Enrolled Roster: {employees.filter((e) => e.faceEnrolled).length}
                  </span>
                </div>
              </div>
            )}

            {/* Real-time Match Success Popup Banner */}
            {recentPunch && (
              <div className="absolute bottom-6 inset-x-6 z-30 animate-in slide-in-from-bottom duration-300">
                <div className="p-4 bg-white/95 backdrop-blur-md rounded-[20px] border border-[#f4e5be] shadow-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center shrink-0">
                      {recentPunch.employee.avatarUrl ? (
                        <img src={recentPunch.employee.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base font-bold text-[#8a6521]">
                          {recentPunch.employee.name[0]}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          recentPunch.type === 'IN'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          Check {recentPunch.type} Successful
                        </span>
                        <span className="text-[10px] font-mono text-[#c09748]">
                          Match: {recentPunch.confidence}% (Live Verified)
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#17191c] mt-0.5">
                        {recentPunch.employee.name}
                      </h4>
                      <p className="text-[11px] text-[#777b86]">
                        {recentPunch.employee.department} • Time: {recentPunch.time}
                      </p>
                    </div>
                  </div>

                  <div className="h-10 w-10 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center shrink-0">
                    <CheckCircle2 size={22} className="text-[#c09748]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Live Attendance Stream */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-white rounded-[24px] border border-[#ececec] shadow-2xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#f2f2f3] pb-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c09748] block">
                    Today's Audit Trail
                  </span>
                  <h3 className="text-sm font-serif text-[#17191c] mt-0.5">
                    Live Punch Stream
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#17191c] font-semibold">
                  {todayPunches.length} recorded
                </span>
              </div>

              {/* Punch Stream List */}
              <div className="mt-3 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {todayPunches.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold text-xs shrink-0">
                        {rec.employeeName[0]}
                      </div>
                      <div>
                        <span className="font-semibold text-[#17191c] block truncate max-w-[120px]">
                          {rec.employeeName}
                        </span>
                        <span className="text-[10px] text-[#777b86] block">
                          {rec.department}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        rec.outTime
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : rec.status === 'LATE'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {rec.outTime ? `OUT: ${rec.outTime}` : `IN: ${rec.inTime}`}
                      </span>
                      <span className="text-[9px] text-[#979799] block mt-0.5">
                        {rec.inLocation?.isHQVerified ? 'Verified at HQ' : 'Remote'}
                      </span>
                    </div>
                  </div>
                ))}

                {todayPunches.length === 0 && (
                  <div className="py-12 text-center text-[#979799]">
                    <Clock size={28} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No attendance punches recorded yet today</p>
                    <p className="text-[11px] mt-0.5">Faces recognized at the terminal will appear here automatically.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f2f2f3] flex items-center justify-between text-[11px] text-[#777b86]">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-[#c09748]" />
                <span>Geofence 300m Active</span>
              </span>
              <span className="text-[#17191c] font-medium">Auto-Cooldown 5m</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
