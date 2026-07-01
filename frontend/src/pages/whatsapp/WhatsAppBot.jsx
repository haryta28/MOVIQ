import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Camera, Mic, Send, CheckCheck, MapPin, Image as ImageIcon, RefreshCw, Info, Smile } from 'lucide-react';
import { fieldTasksForBot } from '../../mock/mock';
import { Button } from '../../components/ui/button';

const BotAvatar = () => (
  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">gG</div>
);

const Msg = ({ from, children, time, delivered }) => {
  const isBot = from === 'bot';
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} px-3`}>
      <div className={`max-w-[78%] rounded-lg px-3 py-2 shadow-sm relative ${isBot ? 'bg-white text-slate-800' : 'bg-[#d9fdd3] text-slate-800'}`}>
        <div className="text-sm whitespace-pre-line">{children}</div>
        <div className="flex items-center gap-1 justify-end mt-1">
          <span className="text-[10px] text-slate-500">{time}</span>
          {!isBot && <CheckCheck className="h-3 w-3 text-blue-500" />}
        </div>
      </div>
    </div>
  );
};

const Bubble = ({ from, children }) => {
  const isBot = from === 'bot';
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} px-3`}>
      <div className={`max-w-[80%] rounded-lg overflow-hidden shadow-sm ${isBot ? 'bg-white' : 'bg-[#d9fdd3]'}`}>
        {children}
      </div>
    </div>
  );
};

const nowTime = () => {
  const d = new Date();
  return `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
};

export default function WhatsAppBot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState('welcome');
  const [activeTask, setActiveTask] = useState(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    // Kick off welcome sequence
    setTimeout(() => pushBotMessage('Namaste 🙏 Welcome to *gOGig Field Assistant*'), 400);
    setTimeout(() => pushBotMessage('I help you receive tasks, capture GPS-verified proofs and submit them — all here on WhatsApp.'), 1200);
    setTimeout(() => pushBotMenu('welcome', ['📋 My Tasks Today', '📍 Check-In', '❓ Help & FAQs']), 2000);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const push = (m) => setMessages(prev => [...prev, { ...m, time: nowTime(), id: Date.now() + Math.random() }]);

  const pushBotMessage = (text) => push({ from: 'bot', kind: 'text', text });
  const pushUserMessage = (text) => push({ from: 'user', kind: 'text', text });
  const pushBotMenu = (id, options) => push({ from: 'bot', kind: 'menu', menuId: id, options });
  const pushBotTasks = () => push({ from: 'bot', kind: 'tasks' });
  const pushBotTaskCard = (task) => push({ from: 'bot', kind: 'taskCard', task });
  const pushUserPhoto = (label) => push({ from: 'user', kind: 'photo', label });
  const pushBotLocation = (task) => push({ from: 'bot', kind: 'location', task });

  const handleMenu = (option, menuId) => {
    pushUserMessage(option);
    if (menuId === 'welcome') {
      if (option.includes('Tasks')) {
        setTimeout(() => pushBotMessage('You have *3 tasks* pending for today. Tap one to start.'), 500);
        setTimeout(() => pushBotTasks(), 900);
        setStep('task-list');
      } else if (option.includes('Check-In')) {
        setTimeout(() => pushBotMessage('✅ Check-in recorded at *09:14 AM*\n📍 Bengaluru, 12.9784, 77.5946\n\nHave a productive day, Ramesh! 💪'), 500);
        setTimeout(() => pushBotMenu('post', ['📋 My Tasks Today', '🏠 Main Menu']), 1600);
      } else {
        setTimeout(() => pushBotMessage('*Common questions:*\n• Type /tasks to see your tasks\n• Type /submit to upload a proof\n• Type /help for support\n\nOur team responds within 15 mins during 9–19 hrs.'), 500);
        setTimeout(() => pushBotMenu('post', ['🏠 Main Menu']), 1400);
      }
    } else if (menuId === 'task-detail') {
      if (option.includes('Start')) {
        setTimeout(() => pushBotMessage('Great! Let\'s start with *3-angle photography*. 📸\n\nStep 1/3: Take a *front-facing* photo of the installation.'), 500);
        setStep('photo-1');
      } else if (option.includes('Location')) {
        setTimeout(() => pushBotLocation(activeTask), 400);
      } else if (option.includes('Cancel')) {
        setActiveTask(null);
        setTimeout(() => pushBotMessage('Task cancelled. Choose another task or head back.'), 400);
        setTimeout(() => pushBotMenu('welcome', ['📋 My Tasks Today', '🏠 Main Menu']), 900);
      }
    } else if (menuId === 'post') {
      if (option.includes('Tasks')) {
        setTimeout(() => pushBotTasks(), 400);
        setStep('task-list');
      } else {
        setTimeout(() => pushBotMenu('welcome', ['📋 My Tasks Today', '📍 Check-In', '❓ Help & FAQs']), 400);
        setStep('welcome');
      }
    } else if (menuId === 'submit') {
      if (option.includes('Submit')) {
        setUploading(true);
        setTimeout(() => {
          setUploading(false);
          pushBotMessage('✅ *Submitted successfully!*\n\nTask ' + activeTask.code + ' has been sent for verification.\n📍 GPS captured: 12.9784, 77.5946\n🕒 Timestamp: ' + nowTime() + '\n📷 Photos: 3/3\n\nYour supervisor Kritika will review shortly.');
        }, 1400);
        setTimeout(() => pushBotMenu('post', ['📋 Next Task', '🏠 Main Menu']), 3000);
        setStep('done');
      } else if (option.includes('Retake')) {
        setTimeout(() => pushBotMessage('No problem, take the photos again. Step 1/3: *Front-facing* photo.'), 400);
        setStep('photo-1');
      }
    }
  };

  const handleTaskSelect = (task) => {
    setActiveTask(task);
    pushUserMessage(`Selected: ${task.code}`);
    setTimeout(() => pushBotTaskCard(task), 400);
    setTimeout(() => pushBotMenu('task-detail', ['✅ Start Task', '📍 View Location', '❌ Cancel']), 1200);
    setStep('task-detail');
  };

  const handlePhotoUpload = () => {
    if (!activeTask) return;
    if (step === 'photo-1') {
      pushUserPhoto('Front view');
      setTimeout(() => pushBotMessage('🔍 Photo received. GPS verified ✅ (Accuracy: 4m)\n\nStep 2/3: Now take a *left-side* photo.'), 700);
      setStep('photo-2');
    } else if (step === 'photo-2') {
      pushUserPhoto('Left view');
      setTimeout(() => pushBotMessage('✅ Left view captured.\n\nStep 3/3: Finally, a *right-side* photo.'), 600);
      setStep('photo-3');
    } else if (step === 'photo-3') {
      pushUserPhoto('Right view');
      setTimeout(() => pushBotMessage('🎉 All 3 photos captured!\n\n📸 3-angle photography ✅\n📍 GPS accuracy: 4m ✅\n🕒 EXIF timestamp ✅\n🔍 Anti-fraud check: PASSED\n\nReady to submit?'), 700);
      setTimeout(() => pushBotMenu('submit', ['✅ Submit for review', '🔄 Retake photos']), 1600);
      setStep('submit');
    }
  };

  const handleInputSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    pushUserMessage(text);
    setInput('');
    setTimeout(() => {
      if (text.toLowerCase().includes('task')) { pushBotTasks(); setStep('task-list'); }
      else if (text.toLowerCase().includes('help')) pushBotMessage('Type /tasks to view your tasks or tap one of the buttons above. For urgent help, call +91 91084 29315.');
      else pushBotMessage('I didn\'t catch that. Tap a button below or type /tasks, /submit, /help');
    }, 700);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50 flex flex-col items-center py-8 px-4">
      {/* Top bar with back to login */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/login')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <div className="text-sm text-slate-500">Field Executive · WhatsApp Bot Simulator</div>
        <div className="w-16" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left info panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">gG</div>
              <div>
                <div className="font-bold text-slate-900">gOGig Field Assistant</div>
                <div className="text-xs text-emerald-600 font-medium">• Online · Verified Business</div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-4">Field executives receive & complete tasks entirely on WhatsApp. Zero training needed.</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" /> GPS auto-captured with every photo</div>
              <div className="flex items-center gap-2"><Camera className="h-4 w-4 text-emerald-600" /> 3-angle photography enforced</div>
              <div className="flex items-center gap-2"><CheckCheck className="h-4 w-4 text-emerald-600" /> Anti-fraud detection built-in</div>
              <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-emerald-600" /> Works offline, syncs later</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800 font-semibold mb-2"><Info className="h-4 w-4" /> Try the flow</div>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
              <li>Tap “📋 My Tasks Today”</li>
              <li>Pick any task from the list</li>
              <li>Tap “Start Task” and upload 3 photos via the camera icon</li>
              <li>Submit for verification</li>
            </ol>
          </div>
        </div>

        {/* Phone frame */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="relative w-[360px] h-[720px] bg-slate-900 rounded-[3rem] shadow-2xl border-[10px] border-slate-900 overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-900 rounded-b-2xl z-20" />

            {/* WhatsApp header */}
            <div className="h-16 bg-[#075e54] text-white flex items-center gap-3 px-3 pt-4">
              <ArrowLeft className="h-5 w-5" />
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">gG</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">gOGig Field Assistant</div>
                <div className="text-[11px] text-emerald-200">online</div>
              </div>
              <Video className="h-5 w-5 opacity-90" />
              <Phone className="h-5 w-5 opacity-90" />
              <MoreVertical className="h-5 w-5 opacity-90" />
            </div>

            {/* Chat body */}
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
                if (m.kind === 'menu') {
                  return (
                    <div key={m.id} className="px-3">
                      <div className="flex flex-col gap-1.5 max-w-[85%]">
                        {m.options.map((o, i) => (
                          <button key={i} onClick={() => handleMenu(o, m.menuId)} className="bg-white text-emerald-700 text-sm font-medium py-2 px-3 rounded-lg shadow-sm border border-slate-100 hover:bg-emerald-50 text-left transition">
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (m.kind === 'tasks') {
                  return (
                    <div key={m.id} className="px-3">
                      <div className="bg-white rounded-lg shadow-sm p-2 max-w-[90%] space-y-2">
                        {fieldTasksForBot.map(t => (
                          <button key={t.code} onClick={() => handleTaskSelect(t)} className="w-full flex items-start gap-2 p-2 rounded-md hover:bg-emerald-50 text-left transition border border-transparent hover:border-emerald-200">
                            <div className="h-9 w-9 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-mono text-slate-500">{t.code}</div>
                              <div className="text-sm font-semibold text-slate-900 truncate">{t.mediaType} · {t.unit}</div>
                              <div className="text-xs text-slate-500 truncate">{t.address}</div>
                              <div className="text-xs text-rose-600 font-medium mt-0.5">⏰ {t.deadline}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (m.kind === 'taskCard') {
                  const t = m.task;
                  return (
                    <Bubble key={m.id} from="bot">
                      <div className="p-3 w-[260px]">
                        <div className="text-xs font-mono text-slate-500">{t.code}</div>
                        <div className="text-sm font-bold text-slate-900">{t.mediaType}</div>
                        <div className="text-xs text-slate-600 mt-1">Unit: <span className="font-medium">{t.unit}</span></div>
                        <div className="text-xs text-slate-600">City: <span className="font-medium">{t.city}</span></div>
                        <div className="text-xs text-slate-600 mt-1">📍 {t.address}</div>
                        <div className="text-xs text-rose-600 font-medium mt-2">⏰ Deadline: {t.deadline}</div>
                        <div className="text-[10px] text-slate-500 mt-2 text-right">{m.time}</div>
                      </div>
                    </Bubble>
                  );
                }
                if (m.kind === 'photo') {
                  return (
                    <Bubble key={m.id} from="user">
                      <div className="p-1">
                        <div className="h-40 w-56 rounded-md bg-gradient-to-br from-orange-400 to-rose-500 relative overflow-hidden">
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><ImageIcon className="h-8 w-8 text-white/80" /></div>
                          <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-[10px] p-1 rounded flex items-center gap-1"><MapPin className="h-3 w-3" />12.978, 77.594</div>
                        </div>
                        <div className="flex items-center justify-between px-2 pt-1 pb-1">
                          <span className="text-xs text-slate-600">{m.label}</span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">{m.time} <CheckCheck className="h-3 w-3 text-blue-500" /></span>
                        </div>
                      </div>
                    </Bubble>
                  );
                }
                if (m.kind === 'location') {
                  return (
                    <Bubble key={m.id} from="bot">
                      <div className="p-1 w-56">
                        <div className="h-32 rounded-md bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden">
                          <div className="absolute inset-0 bg-grid opacity-30" />
                          <div className="absolute inset-0 flex items-center justify-center"><MapPin className="h-8 w-8 text-rose-600 fill-rose-600" /></div>
                        </div>
                        <div className="p-2">
                          <div className="text-xs font-semibold">{m.task?.address}</div>
                          <div className="text-[10px] font-mono text-slate-500">12.9784, 77.5946</div>
                          <div className="text-[10px] text-slate-500 text-right mt-1">{m.time}</div>
                        </div>
                      </div>
                    </Bubble>
                  );
                }
                return null;
              })}

              {uploading && (
                <div className="flex justify-start px-3"><div className="bg-white px-3 py-2 rounded-lg text-xs text-slate-500 shadow-sm inline-flex items-center gap-2"><RefreshCw className="h-3 w-3 animate-spin" /> Submitting to gOGig...</div></div>
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
                <button onClick={handlePhotoUpload} className="text-slate-500 hover:text-emerald-600" title="Take photo">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={input.trim() ? handleInputSend : handlePhotoUpload}
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
