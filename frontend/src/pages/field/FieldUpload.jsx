import React, { useState, useRef, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://moviq-bwz.onrender.com/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const PHOTO_STEPS = [
  { key: 'right', label: 'Right Side', emoji: '➡️', hint: 'Stand on the RIGHT side of the vehicle' },
  { key: 'left',  label: 'Left Side',  emoji: '⬅️', hint: 'Stand on the LEFT side of the vehicle' },
  { key: 'back',  label: 'Back Angle', emoji: '🔄', hint: 'Stand at the BACK of the vehicle' },
];

// ── Chat Bubble Components ────────────────────────────────────────────────────
function BotBubble({ text, typing = false }) {
  return (
    <div className="flex items-end gap-2 mb-3 animate-fadeIn">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
        M
      </div>
      <div className="max-w-[78%] bg-white rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm border border-slate-100">
        {typing ? (
          <div className="flex gap-1 py-1 px-1">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">{text}</p>
        )}
      </div>
    </div>
  );
}

function UserBubble({ text, image = null }) {
  return (
    <div className="flex items-end gap-2 mb-3 flex-row-reverse animate-fadeIn">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
        U
      </div>
      <div className="max-w-[78%] bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm">
        {image ? (
          <div>
            <img src={image} alt="proof" className="rounded-xl w-full max-w-[220px] object-cover mb-1" />
            {text && <p className="text-white text-xs mt-1 opacity-80">{text}</p>}
          </div>
        ) : (
          <p className="text-white text-sm leading-relaxed">{text}</p>
        )}
      </div>
    </div>
  );
}

function PhotoCapture({ step, onCapture, uploading }) {
  const fileRef = useRef(null);
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="text-4xl">{step.emoji}</div>
      <p className="text-xs text-slate-500 text-center px-4">{step.hint}</p>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileRef}
        onChange={(e) => { if (e.target.files[0]) onCapture(e.target.files[0]); }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg active:scale-95 transition-transform disabled:opacity-60"
      >
        {uploading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Uploading…
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Take {step.label} Photo
          </>
        )}
      </button>
      <p className="text-[11px] text-slate-400">Or tap to pick from gallery</p>
    </div>
  );
}

function TextInput({ placeholder, onSend, disabled, type = 'text', pattern }) {
  const [val, setVal] = useState('');
  const submit = () => {
    if (val.trim()) { onSend(val.trim()); setVal(''); }
  };
  return (
    <div className="flex gap-2">
      <input
        type={type}
        inputMode={type === 'tel' ? 'numeric' : 'text'}
        pattern={pattern}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
      />
      <button
        onClick={submit}
        disabled={disabled || !val.trim()}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow active:scale-90 transition-transform disabled:opacity-40"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}

// ── Step machine ──────────────────────────────────────────────────────────────
const STEPS = ['welcome','vehicle','driver_name','driver_phone','location','photo_0','photo_1','photo_2','done'];

export default function FieldUpload() {
  const [messages, setMessages]         = useState([]);
  const [step, setStep]                 = useState('welcome');
  const [data, setData]                 = useState({ vehicle:'', driver_name:'', driver_phone:'', gps: null, photos:[] });
  const [inputDisabled, setInputDisabled] = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [showInput, setShowInput]       = useState(null); // 'text'|'tel'|'photo'
  const [taskCode, setTaskCode]         = useState(null);
  const bottomRef                       = useRef(null);

  const addBot = useCallback((text) => {
    setMessages(m => [...m, { role: 'bot', text }]);
  }, []);

  const addTyping = useCallback(async (text, delay = 800) => {
    setMessages(m => [...m, { role: 'bot', typing: true }]);
    await sleep(delay);
    setMessages(m => m.slice(0, -1).concat({ role: 'bot', text }));
  }, []);

  const addUser = useCallback((text, image = null) => {
    setMessages(m => [...m, { role: 'user', text, image }]);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Boot sequence
  useEffect(() => {
    (async () => {
      await sleep(400);
      setMessages([{ role: 'bot', typing: true }]);
      await sleep(900);
      setMessages([{
        role: 'bot',
        text: '👋 Hi! I\'m the MOVIQ Field Assistant.\n\nI\'ll guide you through submitting your vehicle branding proof. It takes about 2 minutes! 🚀'
      }]);
      await sleep(600);
      setMessages(m => [...m, { role: 'bot', typing: true }]);
      await sleep(800);
      setMessages(m => [...m.slice(0,-1), { role: 'bot', text: '📋 First, let\'s get your vehicle number.\n\nPlease type your vehicle registration number (e.g. KA-01-AB-1234):' }]);
      setStep('vehicle');
      setShowInput({ type: 'text', placeholder: 'Enter vehicle number…' });
      setInputDisabled(false);
    })();
  }, []);

  const handleTextSend = async (val) => {
    setInputDisabled(true);
    setShowInput(null);

    if (step === 'vehicle') {
      addUser(val);
      setData(d => ({ ...d, vehicle: val.toUpperCase() }));
      await addTyping(`✅ Got it — *${val.toUpperCase()}*\n\nNow, what is your full name?`, 700);
      setStep('driver_name');
      setShowInput({ type: 'text', placeholder: 'Enter your full name…' });
      setInputDisabled(false);

    } else if (step === 'driver_name') {
      addUser(val);
      setData(d => ({ ...d, driver_name: val }));
      await addTyping(`👤 Hello ${val}!\n\nPlease enter your WhatsApp/contact number:`, 700);
      setStep('driver_phone');
      setShowInput({ type: 'tel', placeholder: 'Enter 10-digit mobile number…' });
      setInputDisabled(false);

    } else if (step === 'driver_phone') {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 10) {
        addBot('⚠️ Please enter a valid 10-digit mobile number.');
        setShowInput({ type: 'tel', placeholder: 'Enter 10-digit mobile number…' });
        setInputDisabled(false);
        return;
      }
      addUser(digits);
      setData(d => ({ ...d, driver_phone: digits }));
      await addTyping('📍 Great! Now please share your current location so we can verify your submission.', 700);
      setStep('location');
      setShowInput('location');
      setInputDisabled(false);
    }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      addBot('⚠️ Location not supported on this device. Continuing without GPS…');
      proceedToPhotos();
      return;
    }
    addBot('📡 Fetching your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setData(d => ({ ...d, gps }));
        addUser(`📍 Location shared (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})`);
        proceedToPhotos();
      },
      () => {
        addBot('⚠️ Could not get location. Continuing without GPS…');
        proceedToPhotos();
      },
      { timeout: 8000 }
    );
    setShowInput(null);
  };

  const skipLocation = () => {
    addUser('Skip location');
    proceedToPhotos();
  };

  const proceedToPhotos = async () => {
    setShowInput(null);
    await sleep(200);
    await addTyping(
      '📸 Now let\'s capture 3 photos of the vehicle branding.\n\n📷 *Photo 1 of 3 — Right Side*\nStand on the right side of the vehicle and take the photo.',
      900
    );
    setStep('photo_0');
    setShowInput('photo');
    setInputDisabled(false);
  };

  const handlePhotoCapture = async (file, photoIdx) => {
    const stepMeta = PHOTO_STEPS[photoIdx];
    const previewUrl = URL.createObjectURL(file);
    addUser(`📷 ${stepMeta.label} photo`, previewUrl);
    setUploading(true);
    setShowInput(null);
    setInputDisabled(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('label', stepMeta.label);

      const res = await fetch(`${API_BASE}/field-upload/upload-photo`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const photoData = await res.json();

      const updatedPhotos = [...data.photos, photoData];
      setData(d => ({ ...d, photos: updatedPhotos }));
      setUploading(false);

      if (photoIdx < 2) {
        const next = PHOTO_STEPS[photoIdx + 1];
        await addTyping(
          `✅ *${stepMeta.label}* photo saved!\n\n📷 *Photo ${photoIdx + 2} of 3 — ${next.label}*\n${next.hint}`,
          800
        );
        setStep(`photo_${photoIdx + 1}`);
        setShowInput('photo');
        setInputDisabled(false);
      } else {
        // All 3 photos done — final submit
        await addTyping('✅ All 3 photos uploaded! Submitting your proof now…', 800);
        await finalSubmit(updatedPhotos);
      }
    } catch (err) {
      setUploading(false);
      addBot(`❌ Photo upload failed. Please try again.\n${err.message}`);
      setShowInput('photo');
      setInputDisabled(false);
    }
  };

  const finalSubmit = async (photos) => {
    try {
      const formData = new FormData();
      formData.append('vehicle', data.vehicle);
      formData.append('driver_name', data.driver_name);
      formData.append('driver_phone', data.driver_phone);
      if (data.gps) {
        formData.append('gps_lat', data.gps.lat);
        formData.append('gps_lng', data.gps.lng);
      }
      formData.append('photo_urls', JSON.stringify(photos));

      const res = await fetch(`${API_BASE}/field-upload/submit`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Submission failed');
      const result = await res.json();

      setTaskCode(result.taskCode);
      setStep('done');
      setShowInput(null);
      await addTyping(
        `🎉 *Submission Complete!*\n\nYour vehicle proof has been successfully submitted to MOVIQ.\n\n📋 Task Code: *${result.taskCode}*\n🚗 Vehicle: *${result.vehicle}*\n\nSave your task code for reference. Have a great day! 🙏`,
        1000
      );
    } catch (err) {
      addBot(`❌ Submission failed. Please try again later.\n${err.message}`);
    }
  };

  const photoIdx = step.startsWith('photo_') ? parseInt(step.slice(-1)) : null;

  return (
    <div
      className="flex flex-col h-dvh bg-slate-50 font-sans"
      style={{ maxWidth: 480, margin: '0 auto' }}
    >
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow">
          M
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900 text-sm">MOVIQ Field Assistant</div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
            <span className="text-xs text-emerald-600 font-medium">Online</span>
          </div>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1">
          {STEPS.slice(1, -1).map((s, i) => (
            <div
              key={s}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                STEPS.indexOf(step) > i + 1
                  ? 'bg-indigo-500'
                  : STEPS.indexOf(step) === i + 1
                  ? 'bg-indigo-300'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-2">
        {messages.map((msg, i) =>
          msg.role === 'bot' ? (
            <BotBubble key={i} text={msg.text} typing={msg.typing} />
          ) : (
            <UserBubble key={i} text={msg.text} image={msg.image} />
          )
        )}

        {/* Task code success card */}
        {step === 'done' && taskCode && (
          <div className="mx-2 mb-4 mt-2 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 text-center animate-fadeIn">
            <div className="text-3xl mb-1">🎉</div>
            <div className="font-bold text-emerald-700 text-sm mb-0.5">Proof Submitted!</div>
            <div className="font-mono font-bold text-slate-900 text-lg tracking-wider">{taskCode}</div>
            <div className="text-[11px] text-slate-500 mt-1">Save this Task Code for your records</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div className="bg-white border-t border-slate-100 px-3 py-3 shrink-0 shadow-md">
        {showInput && typeof showInput === 'object' && (
          <TextInput
            placeholder={showInput.placeholder}
            type={showInput.type}
            onSend={handleTextSend}
            disabled={inputDisabled}
          />
        )}

        {showInput === 'location' && (
          <div className="flex gap-2">
            <button
              onClick={handleLocation}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold py-2.5 rounded-full shadow active:scale-95 transition-transform text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Share Location
            </button>
            <button
              onClick={skipLocation}
              className="px-4 py-2.5 rounded-full border border-slate-200 text-slate-500 text-sm font-medium active:bg-slate-50"
            >
              Skip
            </button>
          </div>
        )}

        {showInput === 'photo' && photoIdx !== null && (
          <PhotoCapture
            step={PHOTO_STEPS[photoIdx]}
            onCapture={(file) => handlePhotoCapture(file, photoIdx)}
            uploading={uploading}
          />
        )}

        {step === 'done' && (
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-100 text-slate-600 font-medium rounded-full text-sm active:bg-slate-200"
          >
            Submit Another Vehicle
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </div>
  );
}
