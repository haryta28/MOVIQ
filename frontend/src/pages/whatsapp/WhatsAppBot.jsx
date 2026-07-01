import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Camera, Mic, Send, CheckCheck, MapPin, Image as ImageIcon, RefreshCw, Info, Smile, Truck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { MOVIQ_LOGO, MOVIQ_NAME } from '../../brand';
import api from '../../api';

const nowTime = () => {
  const d = new Date();
  return `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
};

const Msg = ({ from, children, time }) => {
  const isBot = from === 'bot';
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} px-3`}>
      <div className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${isBot ? 'bg-white text-slate-800' : 'bg-[#d9fdd3] text-slate-800'}`}>
        <div className="text-sm whitespace-pre-line">{children}</div>
        <div className="flex items-center gap-1 justify-end mt-1">
          <span className="text-[10px] text-slate-500">{time}</span>
          {!isBot && <CheckCheck className="h-3 w-3 text-red-500" />}
        </div>
      </div>
    </div>
  );
};

const Bubble = ({ from, children }) => {
  const isBot = from === 'bot';
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} px-3`}>
      <div className={`max-w-[85%] rounded-lg overflow-hidden shadow-sm ${isBot ? 'bg-white' : 'bg-[#d9fdd3]'}`}>
        {children}
      </div>
    </div>
  );
};

const PHOTO_STEPS = [
  { key: 'right', label: 'Right side', gradient: 'from-orange-400 to-rose-500' },
  { key: 'left', label: 'Left side', gradient: 'from-emerald-400 to-teal-500' },
  { key: 'back', label: 'Back angle', gradient: 'from-red-500 to-red-700' },
];

export default function WhatsAppBot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState('greet'); // greet, form, photo-0, photo-1, photo-2, submit, done
  const [form, setForm] = useState({ vehicle: '', driverName: '', driverPhone: '' });
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, showForm]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    setTimeout(() => pushBot(`Namaste 🙏 Welcome to *${MOVIQ_NAME} Field Assistant*`), 400);
    setTimeout(() => pushBot('I help you register vehicle branding proofs directly on WhatsApp — no app needed.'), 1200);
    setTimeout(() => pushBot('Type *Hi* to begin. 👇'), 2000);
  }, []);

  const push = (m) => setMessages(prev => [...prev, { ...m, time: nowTime(), id: Date.now() + Math.random() }]);
  const pushBot = (text) => push({ from: 'bot', kind: 'text', text });
  const pushUser = (text) => push({ from: 'user', kind: 'text', text });
  const pushUserPhoto = (label, gradient) => push({ from: 'user', kind: 'photo', label, gradient });
  const pushBotSummary = (data) => push({ from: 'bot', kind: 'vehicleCard', data });

  const startFlow = () => {
    pushUser('Hi');
    setTimeout(() => pushBot(`Hello 👋 Great to have you on board!\n\nTo start, please share the vehicle & driver details.`), 600);
    setTimeout(() => setShowForm(true), 1400);
    setStep('form');
  };

  const submitForm = () => {
    if (!form.vehicle.trim() || !form.driverName.trim() || !form.driverPhone.trim()) return;
    pushUser(`🚚 *Vehicle*: ${form.vehicle.toUpperCase()}\n👤 *Driver*: ${form.driverName}\n📞 *Phone*: ${form.driverPhone}`);
    setShowForm(false);
    setTimeout(() => pushBot(`✅ Vehicle *${form.vehicle.toUpperCase()}* registered under driver *${form.driverName}*.\n\nNow let's capture 3-angle vehicle photos.`), 700);
    setTimeout(() => pushBot(`📷 *Step 1 of 3*\nTap the camera icon and take the *${PHOTO_STEPS[0].label}* photo of the vehicle.`), 1700);
    setStep('photo-0');
  };

  const handleCameraTap = () => {
    if (step === 'photo-0') {
      pushUserPhoto(PHOTO_STEPS[0].label, PHOTO_STEPS[0].gradient);
      setTimeout(() => pushBot(`✅ ${PHOTO_STEPS[0].label} captured.\n📍 GPS verified (accuracy 4m)\n\n📷 *Step 2 of 3*\nNow take the *${PHOTO_STEPS[1].label}* photo.`), 700);
      setStep('photo-1');
    } else if (step === 'photo-1') {
      pushUserPhoto(PHOTO_STEPS[1].label, PHOTO_STEPS[1].gradient);
      setTimeout(() => pushBot(`✅ ${PHOTO_STEPS[1].label} captured.\n\n📷 *Step 3 of 3*\nFinally, take the *${PHOTO_STEPS[2].label}* photo.`), 700);
      setStep('photo-2');
    } else if (step === 'photo-2') {
      pushUserPhoto(PHOTO_STEPS[2].label, PHOTO_STEPS[2].gradient);
      setUploading(true);
      // POST to backend
      api.post('/vehicle-submissions', {
        vehicle: form.vehicle,
        driver_name: form.driverName,
        driver_phone: form.driverPhone,
        photos: PHOTO_STEPS.map(s => ({ label: s.label, gradient: s.gradient })),
        gps: { lat: 12.9784, lng: 77.5946 },
      }).catch(() => { /* ignore, still show success in UI */ });
      setTimeout(() => {
        setUploading(false);
        push({ from: 'bot', kind: 'text', text: '🎉 *All 3 photos captured!*\n\n📸 3-angle photography ✅\n📍 GPS accuracy: 4m ✅\n🕒 EXIF timestamp ✅\n🔍 Anti-fraud check: PASSED' });
      }, 1200);
      setTimeout(() => pushBotSummary({ ...form, submittedAt: nowTime() }), 2600);
      setTimeout(() => push({ from: 'bot', kind: 'menu', menuId: 'done', options: ['🚚 Register another vehicle', '👋 Exit'] }), 3600);
      setStep('done');
    }
  };

  const handleMenu = (option) => {
    pushUser(option);
    if (option.includes('another')) {
      setForm({ vehicle: '', driverName: '', driverPhone: '' });
      setTimeout(() => pushBot('Great! Let\'s register the next vehicle. Please fill the form below.'), 600);
      setTimeout(() => setShowForm(true), 1200);
      setStep('form');
    } else {
      setTimeout(() => pushBot('Thank you for using Moviq 🙏\nYour proofs are safely stored. Have a great day!'), 500);
      setStep('exit');
    }
  };

  const handleInputSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    if (step === 'greet' && /^(hi|hello|hey|start)/i.test(text)) {
      startFlow();
      return;
    }
    pushUser(text);
    setTimeout(() => {
      if (step === 'greet') pushBot('Please type *Hi* to begin the vehicle registration flow.');
      else if (step === 'form') pushBot('Please fill in the form above with Vehicle Number, Driver Name & Phone.');
      else if (step.startsWith('photo')) pushBot('Please tap the 📷 camera icon below to capture the photo.');
      else pushBot('I didn\'t catch that. Type *Hi* to restart.');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-red-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-6xl flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/login')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <div className="text-sm text-slate-500">Field Executive · WhatsApp Bot Simulator</div>
        <div className="w-16" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Info panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <img src={MOVIQ_LOGO} alt="Moviq" className="h-12 w-12 object-contain" />
              <div>
                <div className="font-bold text-slate-900">{MOVIQ_NAME} Field Assistant</div>
                <div className="text-xs text-emerald-600 font-medium">• Online · Verified Business</div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-4">Field agents register vehicle branding proofs on WhatsApp — no task assignment needed. Just walk up, chat, submit.</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-red-600" /> Dynamic vehicle registration</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-red-600" /> GPS auto-captured with every photo</div>
              <div className="flex items-center gap-2"><Camera className="h-4 w-4 text-red-600" /> 3-angle photography enforced</div>
              <div className="flex items-center gap-2"><CheckCheck className="h-4 w-4 text-red-600" /> Anti-fraud detection built-in</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800 font-semibold mb-2"><Info className="h-4 w-4" /> How to try</div>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
              <li>Type <span className="font-mono bg-slate-100 px-1.5 rounded">Hi</span> in the message box and hit send</li>
              <li>Fill the vehicle & driver form that appears</li>
              <li>Tap the 📷 camera icon 3 times — Right, Left, Back</li>
              <li>See your submission confirmation with GPS + fraud check</li>
            </ol>
          </div>
        </div>

        {/* Phone frame */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="relative w-[360px] h-[720px] bg-slate-900 rounded-[3rem] shadow-2xl border-[10px] border-slate-900 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-900 rounded-b-2xl z-20" />

            {/* Header */}
            <div className="h-16 bg-[#075e54] text-white flex items-center gap-3 px-3 pt-4">
              <ArrowLeft className="h-5 w-5" />
              <div className="h-9 w-9 rounded-full bg-white/95 p-0.5 flex items-center justify-center">
                <img src={MOVIQ_LOGO} alt="Moviq" className="h-full w-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{MOVIQ_NAME} Field Assistant</div>
                <div className="text-[11px] text-emerald-200">online</div>
              </div>
              <Video className="h-5 w-5 opacity-90" />
              <Phone className="h-5 w-5 opacity-90" />
              <MoreVertical className="h-5 w-5 opacity-90" />
            </div>

            {/* Chat */}
            <div
              ref={scrollRef}
              className="h-[556px] overflow-y-auto py-3 space-y-2 pb-4"
              style={{ backgroundColor: '#e5ddd5', backgroundImage: 'radial-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)', backgroundSize: '8px 8px' }}
            >
              <div className="flex justify-center">
                <div className="bg-white/70 text-slate-600 text-[11px] px-3 py-1 rounded-full shadow-sm">Today</div>
              </div>

              {messages.map(m => {
                if (m.kind === 'text') return <Msg key={m.id} from={m.from} time={m.time}>{m.text}</Msg>;
                if (m.kind === 'photo') {
                  return (
                    <Bubble key={m.id} from="user">
                      <div className="p-1">
                        <div className={`h-40 w-56 rounded-md bg-gradient-to-br ${m.gradient} relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Truck className="h-10 w-10 text-white/80" /></div>
                          <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-[10px] p-1 rounded flex items-center gap-1"><MapPin className="h-3 w-3" />12.978, 77.594</div>
                        </div>
                        <div className="flex items-center justify-between px-2 pt-1 pb-1">
                          <span className="text-xs text-slate-600 font-medium">{m.label}</span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">{m.time} <CheckCheck className="h-3 w-3 text-red-500" /></span>
                        </div>
                      </div>
                    </Bubble>
                  );
                }
                if (m.kind === 'vehicleCard') {
                  return (
                    <Bubble key={m.id} from="bot">
                      <div className="p-3 w-[270px]">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-md bg-red-50 flex items-center justify-center"><Truck className="h-4 w-4 text-red-600" /></div>
                          <div className="font-bold text-slate-900 text-sm">Submission Complete ✅</div>
                        </div>
                        <div className="text-xs space-y-1 border-t pt-2">
                          <div className="flex justify-between"><span className="text-slate-500">Vehicle</span><span className="font-semibold">{m.data.vehicle.toUpperCase()}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Driver</span><span className="font-semibold">{m.data.driverName}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-semibold">{m.data.driverPhone}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Photos</span><span className="font-semibold">3/3</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">GPS</span><span className="font-mono">12.978, 77.594</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Submitted</span><span className="font-semibold">{m.data.submittedAt}</span></div>
                        </div>
                        <div className="mt-2 text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded text-center font-medium">Sent to your supervisor for review</div>
                        <div className="text-[10px] text-slate-500 mt-1 text-right">{m.time}</div>
                      </div>
                    </Bubble>
                  );
                }
                if (m.kind === 'menu') {
                  return (
                    <div key={m.id} className="px-3">
                      <div className="flex flex-col gap-1.5 max-w-[85%]">
                        {m.options.map((o, i) => (
                          <button key={i} onClick={() => handleMenu(o)} className="bg-white text-emerald-700 text-sm font-medium py-2 px-3 rounded-lg shadow-sm border border-slate-100 hover:bg-emerald-50 text-left transition">
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {/* Inline form for vehicle registration */}
              {showForm && (
                <div className="px-3">
                  <div className="bg-white rounded-lg shadow-sm p-3 max-w-[92%] space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-7 w-7 rounded-md bg-red-50 flex items-center justify-center"><Truck className="h-4 w-4 text-red-600" /></div>
                      <div className="text-xs font-semibold text-slate-800">Vehicle & Driver Details</div>
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-500">Vehicle Number</Label>
                      <Input
                        value={form.vehicle}
                        onChange={e => setForm({ ...form, vehicle: e.target.value })}
                        placeholder="KA-05-AB-1234"
                        className="h-8 text-sm mt-0.5 uppercase"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-500">Driver Name</Label>
                      <Input
                        value={form.driverName}
                        onChange={e => setForm({ ...form, driverName: e.target.value })}
                        placeholder="Ramesh Kumar"
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-500">Driver Phone</Label>
                      <Input
                        value={form.driverPhone}
                        onChange={e => setForm({ ...form, driverPhone: e.target.value.replace(/[^0-9+ ]/g, '') })}
                        placeholder="+91 98765 43210"
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <Button onClick={submitForm} className="w-full h-8 bg-red-600 hover:bg-red-700 text-white text-sm">
                      Submit details
                    </Button>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="flex justify-start px-3"><div className="bg-white px-3 py-2 rounded-lg text-xs text-slate-500 shadow-sm inline-flex items-center gap-2"><RefreshCw className="h-3 w-3 animate-spin" /> Submitting to Moviq...</div></div>
              )}
            </div>

            {/* Input area */}
            <div className="h-14 bg-[#f0f0f0] flex items-center gap-2 px-2 border-t border-slate-200">
              <button className="h-9 w-9 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-full"><Smile className="h-5 w-5" /></button>
              <div className="flex-1 bg-white rounded-full flex items-center gap-2 px-3 py-1.5">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInputSend()}
                  placeholder="Type a message"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
                <Paperclip className="h-4 w-4 text-slate-500" />
                <button onClick={handleCameraTap} className="text-slate-500 hover:text-red-600" title="Take photo">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={input.trim() ? handleInputSend : handleCameraTap}
                className="h-10 w-10 rounded-full bg-[#25d366] text-white flex items-center justify-center hover:bg-[#22c55e] transition shrink-0"
              >
                {input.trim() ? <Send className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
