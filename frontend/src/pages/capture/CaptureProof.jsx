import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, MapPin, CheckCircle2, AlertCircle, Loader2, RotateCcw, Upload } from 'lucide-react';
import { Button } from '../../components/ui/button';
import api from '../../api';

const STEPS = [
  { key: 'right', label: 'Right side', instruction: 'Stand on the RIGHT side of the vehicle and take the photo.' },
  { key: 'left',  label: 'Left side',  instruction: 'Move to the LEFT side of the vehicle and take the photo.' },
  { key: 'back',  label: 'Back angle', instruction: 'Move to the BACK of the vehicle and take the photo.' },
];

// Burn GPS + timestamp text onto image using Canvas API
function stampImage(imageSrc, lat, lng) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const now    = new Date();
      const stamp  = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}  🕒 ${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}`;
      const fontSize = Math.max(18, Math.floor(img.width / 40));

      // Banner background
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, img.height - fontSize * 2.4, img.width, fontSize * 2.4);

      // Stamp text
      ctx.fillStyle   = '#ffffff';
      ctx.font        = `bold ${fontSize}px monospace`;
      ctx.textBaseline = 'middle';
      ctx.fillText(stamp, 12, img.height - fontSize * 1.2);

      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    };
    img.src = imageSrc;
  });
}

export default function CaptureProof() {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const [gps, setGps]           = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [step, setStep]         = useState(0);   // 0,1,2 = photo steps; 3 = done
  const [preview, setPreview]   = useState(null);
  const [photos, setPhotos]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [formData, setFormData] = useState({ vehicle: '', driverName: '', driverPhone: '' });
  const [showForm, setShowForm] = useState(true);

  // Get GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGpsError('GPS permission denied. Please allow location access and refresh.'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setGpsError('Camera permission denied. Please allow camera access and refresh.');
    }
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraReady(false);
  };

  // Capture a frame from the video
  const captureFrame = () => {
    const video  = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleCapture = async () => {
    if (!gps) { alert('Waiting for GPS… please try again in a moment.'); return; }
    const dataUrl = captureFrame();
    const stamped = await stampImage(dataUrl, gps.lat, gps.lng);
    setPreview({ dataUrl, blob: stamped, label: STEPS[step].label });
  };

  const handleRetake = () => setPreview(null);

  const handleAccept = async () => {
    if (!preview) return;
    setUploading(true);
    const formPayload = new FormData();
    formPayload.append('file', preview.blob, `${STEPS[step].key}.jpg`);
    formPayload.append('upload_preset', 'moviq_proofs');   // set this in Cloudinary dashboard

    try {
      // Upload directly to Cloudinary from browser
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formPayload }
      );
      const data = await res.json();
      const newPhotos = [...photos, {
        label:     preview.label,
        url:       data.secure_url,
        capturedAt: new Date().toISOString(),
        gps,
      }];
      setPhotos(newPhotos);
      setPreview(null);

      if (step < 2) {
        setStep(step + 1);
      } else {
        // All 3 done — POST submission to backend
        await api.post('/vehicle-submissions', {
          vehicle:      formData.vehicle,
          driver_name:  formData.driverName,
          driver_phone: formData.driverPhone,
          photos:       newPhotos,
          gps,
        });
        stopCamera();
        setSubmitted(true);
      }
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Submitted screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Submission Complete!</h2>
          <p className="text-slate-500 text-sm mb-4">
            All 3 photos uploaded with GPS stamp. Your supervisor has been notified.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 text-left text-xs space-y-1 mb-6">
            <div className="flex justify-between"><span className="text-slate-500">Vehicle</span><span className="font-semibold">{formData.vehicle.toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Driver</span><span className="font-semibold">{formData.driverName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Photos</span><span className="font-semibold text-emerald-600">3 / 3 ✅</span></div>
            <div className="flex justify-between"><span className="text-slate-500">GPS</span><span className="font-mono">{gps?.lat.toFixed(4)}, {gps?.lng.toFixed(4)}</span></div>
          </div>
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            onClick={() => { setSubmitted(false); setStep(0); setPhotos([]); setShowForm(true); setFormData({ vehicle: '', driverName: '', driverPhone: '' }); }}
          >
            Submit Another Vehicle
          </Button>
        </div>
      </div>
    );
  }

  // ── Vehicle form ─────────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="h-14 w-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Camera className="h-7 w-7 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">MOVIQ Field Capture</h1>
            <p className="text-sm text-slate-500 mt-1">Enter vehicle details before capturing photos</p>
          </div>

          {gpsError && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />{gpsError}
            </div>
          )}
          {!gps && !gpsError && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-700">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />Acquiring GPS location…
            </div>
          )}
          {gps && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-xs text-emerald-700">
              <MapPin className="h-4 w-4 shrink-0" />GPS ready: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Number *</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="KA-05-AB-1234"
                value={formData.vehicle}
                onChange={e => setFormData(f => ({ ...f, vehicle: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Driver Name *</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ramesh Kumar"
                value={formData.driverName}
                onChange={e => setFormData(f => ({ ...f, driverName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Driver Phone *</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="+91 98765 43210"
                value={formData.driverPhone}
                onChange={e => setFormData(f => ({ ...f, driverPhone: e.target.value }))}
              />
            </div>
          </div>

          <Button
            className="w-full mt-5 bg-red-600 hover:bg-red-700 text-white"
            disabled={!formData.vehicle || !formData.driverName || !formData.driverPhone || !gps}
            onClick={() => { setShowForm(false); startCamera(); }}
          >
            <Camera className="h-4 w-4 mr-2" />
            {!gps ? 'Waiting for GPS…' : 'Start Photo Capture'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Camera viewfinder ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Progress bar */}
      <div className="flex gap-1 p-3 pt-safe">
        {STEPS.map((s, i) => (
          <div key={s.key} className={`flex-1 h-1.5 rounded-full ${i < step ? 'bg-emerald-500' : i === step ? 'bg-red-500' : 'bg-white/20'}`} />
        ))}
      </div>

      {/* GPS badge */}
      <div className="flex items-center gap-2 px-4 pb-2">
        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-emerald-400 text-xs font-mono">{gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : 'Acquiring GPS…'}</span>
      </div>

      {/* Instruction */}
      <div className="px-4 pb-3">
        <p className="text-white text-sm font-medium">📷 Photo {step + 1} of 3 — <span className="text-red-400">{STEPS[step].label}</span></p>
        <p className="text-white/60 text-xs mt-0.5">{STEPS[step].instruction}</p>
      </div>

      {/* Viewfinder / Preview */}
      <div className="flex-1 relative overflow-hidden">
        {preview ? (
          <img src={preview.dataUrl} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
        {/* GPS overlay on viewfinder */}
        {!preview && gps && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1.5 text-[10px] font-mono text-white/80">
            📍 {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)} &nbsp;|&nbsp; 🕒 {new Date().toLocaleTimeString('en-IN')}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 flex items-center justify-center gap-6">
        {preview ? (
          <>
            <Button variant="outline" size="lg" onClick={handleRetake} className="flex-1 border-white/30 text-white bg-white/10 hover:bg-white/20">
              <RotateCcw className="h-4 w-4 mr-2" /> Retake
            </Button>
            <Button size="lg" onClick={handleAccept} disabled={uploading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? 'Uploading…' : step < 2 ? 'Use Photo' : 'Submit All'}
            </Button>
          </>
        ) : (
          <button
            onClick={handleCapture}
            disabled={!cameraReady || !gps}
            className="h-20 w-20 rounded-full bg-white border-4 border-red-500 flex items-center justify-center shadow-lg disabled:opacity-40 active:scale-95 transition-transform"
          >
            <Camera className="h-8 w-8 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
}
