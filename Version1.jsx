import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, List, Repeat, Repeat1, MoreHorizontal, X, Music, Plus, Volume1, VolumeX, ChevronUp, Sparkles, Loader, Volume2, Info } from 'lucide-react';

// --- 1. Hybrid Audio Engine (Synth + Local Audio) ---

const createSynthesizer = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const ctx = new AudioContext();
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  
  const playNote = (freq, type, duration, startTime, volume = 0.1) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    osc.connect(noteGain);
    noteGain.connect(masterGain);
    
    osc.start(startTime);
    
    // Envelope
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.stop(startTime + duration);
  };

  return { ctx, masterGain, playNote };
};

// Default Synth Songs
const defaultSongs = [
  {
    id: 'synth-1',
    type: 'synth',
    title: "Neon Horizon",
    artist: "Synth Wave",
    color: "from-purple-500 to-pink-500",
    coverGradient: "linear-gradient(135deg, #a855f7, #ec4899)",
    melody: [
      { f: 261.63, d: 0.4 }, { f: 329.63, d: 0.4 }, { f: 392.00, d: 0.4 }, { f: 523.25, d: 0.8 },
      { f: 392.00, d: 0.4 }, { f: 329.63, d: 0.4 }, { f: 261.63, d: 1.2 },
    ],
    waveType: 'sine',
    duration: 34
  },
  {
    id: 'synth-2',
    type: 'synth',
    title: "Cyber Dust",
    artist: "The Algorithm",
    color: "from-cyan-500 to-blue-500",
    coverGradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    melody: [
      { f: 110.00, d: 0.3 }, { f: 110.00, d: 0.3 }, { f: 220.00, d: 0.6 }, 
      { f: 164.81, d: 0.3 }, { f: 196.00, d: 0.3 }, { f: 146.83, d: 0.9 },
    ],
    waveType: 'sawtooth',
    duration: 42
  },
  {
    id: 'synth-3',
    type: 'synth',
    title: "Glass Heart",
    artist: "Fractals",
    color: "from-orange-500 to-amber-500",
    coverGradient: "linear-gradient(135deg, #f97316, #f59e0b)",
    melody: [
      { f: 440.00, d: 0.5 }, { f: 349.23, d: 0.5 }, { f: 261.63, d: 1.0 },
      { f: 392.00, d: 0.5 }, { f: 329.63, d: 1.0 }, { f: 293.66, d: 1.0 },
    ],
    waveType: 'triangle',
    duration: 38
  }
];

// Helper: Format Seconds to MM:SS
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// --- 2. Particle System (Red Embers) ---

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
      canvas.height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.alpha = Math.random() * 0.5 + 0.2;
        this.hue = Math.random() * 40 + 340; 
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;

        let dx = mouseRef.current.x - this.x;
        let dy = mouseRef.current.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let maxDistance = 150;
        
        if (distance < maxDistance) {
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          let force = (maxDistance - distance) / maxDistance;
          let directionX = forceDirectionX * force * this.density;
          let directionY = forceDirectionY * force * this.density;
          
          this.x -= directionX * 3;
          this.y -= directionY * 3;
        }
      }

      draw() {
        ctx.fillStyle = `hsla(${this.hue}, 100%, 50%, ${this.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 1)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0; 
      }
    }

    const init = () => {
      particles = [];
      const numberOfParticles = (canvas.width * canvas.height) / 10000; 
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', () => {
      resize();
      init();
    });

    const handleInputMove = (x, y) => {
      mouseRef.current = { x, y };
    };

    window.addEventListener('mousemove', (e) => handleInputMove(e.x, e.y));
    window.addEventListener('touchmove', (e) => handleInputMove(e.touches[0].clientX, e.touches[0].clientY));
    window.addEventListener('touchstart', (e) => handleInputMove(e.touches[0].clientX, e.touches[0].clientY));
    window.addEventListener('touchend', () => handleInputMove(-9999, -9999));

    resize();
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 mix-blend-screen"
    />
  );
};

// --- 3. Gemini API Integration ---
const generateAIContent = async (title, artist) => {
    const apiKey = ""; 
    const prompt = `You are a futuristic AI Radio Host. For the song "${title}" by "${artist}":
    1. Write a short, hyped-up, 1-sentence radio intro.
    2. Write a 4-line abstract poem or lyrics snippet inspired by the title.
    3. Suggest a hex color code (format #RRGGBB) that matches the mood.
    4. Pick a single emoji that fits the song.
    
    Return ONLY valid JSON in this format: { "intro": "...", "poem": "...", "color": "...", "emoji": "..." }`;

    let retries = 0;
    const maxRetries = 3;
    const delays = [1000, 2000, 4000];

    while (retries <= maxRetries) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                }
            );

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("No text generated");
            return JSON.parse(text);

        } catch (error) {
            retries++;
            if (retries > maxRetries) {
                return {
                    intro: "Signal lost... connecting to the musical mainframe.",
                    poem: "Static in the air,\nMelodies everywhere,\nData streams align,\nThis track is divine.",
                    color: "#a855f7",
                    emoji: "🤖"
                };
            }
            await new Promise(res => setTimeout(res, delays[retries - 1] || 1000));
        }
    }
};

// --- 4. Main App Component ---

const App = () => {
  const [songs, setSongs] = useState(defaultSongs);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showQueue, setShowQueue] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  
  // Mute State & Animation
  const [isMuted, setIsMuted] = useState(false);
  const [preMuteVolume, setPreMuteVolume] = useState(0.7);
  const [showMuteFeedback, setShowMuteFeedback] = useState(false);
  const [muteEffect, setMuteEffect] = useState(null); // 'breaking' | 'healing' | null

  // Loop State: 0 = Loop Playlist, 1 = Loop Single Song
  const [loopMode, setLoopMode] = useState(0); 

  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [bgGlowColor, setBgGlowColor] = useState('rgba(0,0,0,0)'); // Default dark
  
  // Refs
  const audioCtxRef = useRef(null); 
  const synthIntervalRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const melodyIndexRef = useRef(0);
  const audioElemRef = useRef(null); 
  const fileInputRef = useRef(null);
  const muteFeedbackTimeoutRef = useRef(null);
  const playPromiseRef = useRef(null); // Track play promise to fix interruptions
  
  // Swipe Refs
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const currentSong = songs[currentSongIndex];

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showAiModal) return; 

      // 1. Queue Specific Controls
      if (showQueue) {
          switch(e.code) {
              case 'ArrowDown':
                  e.preventDefault();
                  nextSong();
                  return;
              case 'ArrowUp':
                  e.preventDefault();
                  prevSong();
                  return;
              case 'PageUp':
              case 'PageDown':
                  // Do NOT prevent default, allow scrolling
                  return;
          }
      }

      // 2. Global Shortcuts (Anywhere)
      if (e.ctrlKey) {
          if (e.code === 'ArrowRight') {
              e.preventDefault();
              nextSong();
              return;
          }
          if (e.code === 'ArrowLeft') {
              e.preventDefault();
              prevSong();
              return;
          }
      }

      // 3. Playback Controls (Work anywhere unless blocked above)
      switch(e.code) {
        case 'Space':
        case 'KeyP':
        case 'F10':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }

      // 4. Home Page Specifics (Only if Queue is CLOSED)
      if (!showQueue) {
          switch(e.code) {
            case 'ArrowUp':
              e.preventDefault();
              adjustVolume(0.1);
              break;
            case 'ArrowDown':
              e.preventDefault();
              adjustVolume(-0.1);
              break;
            case 'ArrowRight':
              // Seeking (Plain Arrow)
              e.preventDefault();
              seekBy(5);
              break;
            case 'ArrowLeft':
               // Seeking (Plain Arrow)
              e.preventDefault();
              seekBy(-5);
              break;
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, showAiModal, currentSong, duration, volume, isMuted, showQueue]);

  // --- Volume & Mute Logic (Dramatic Effect) ---
  const adjustVolume = (delta) => {
      if (isMuted) {
          toggleMute(); // Auto unmute if volume changed
      } else {
          setVolume(v => Math.max(0, Math.min(1, parseFloat((v + delta).toFixed(1)))));
      }
  };

  const toggleMute = () => {
      if (isMuted) {
          // Unmute (Healing Effect)
          setMuteEffect('healing');
          setIsMuted(false);
          // Restore volume visually after short delay or immediately for feedback
          setVolume(preMuteVolume); 
          showFeedback("System Restored");
          
          setTimeout(() => setMuteEffect(null), 600);
      } else {
          // Mute (Breaking Effect)
          setPreMuteVolume(volume);
          setMuteEffect('breaking');
          showFeedback("Muted");
          
          // Wait for break animation to finish before snapping to 0 visually
          setTimeout(() => {
              setVolume(0);
              setIsMuted(true);
              setMuteEffect(null);
          }, 400);
      }
  };

  const showFeedback = (msg) => {
      setShowMuteFeedback(true);
      if (muteFeedbackTimeoutRef.current) clearTimeout(muteFeedbackTimeoutRef.current);
      muteFeedbackTimeoutRef.current = setTimeout(() => setShowMuteFeedback(false), 1500);
  };

  // --- Audio Helpers ---
  const seekBy = (seconds) => {
    if (currentSong.type === 'local' && audioElemRef.current) {
        const newTime = Math.max(0, Math.min(audioElemRef.current.currentTime + seconds, audioElemRef.current.duration));
        audioElemRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        setProgress((newTime / audioElemRef.current.duration) * 100);
    } else if (currentSong.type === 'synth') {
        const newTime = Math.max(0, Math.min(currentTime + seconds, currentSong.duration));
        setCurrentTime(newTime);
        setProgress((newTime / currentSong.duration) * 100);
        melodyIndexRef.current = 0; 
        if(audioCtxRef.current) nextNoteTimeRef.current = audioCtxRef.current.ctx.currentTime;
    }
  };

  // --- AI Handler ---
  const handleAiVibeCheck = async (e) => {
    if(e) e.stopPropagation();
    
    setShowAiModal(true);
    if (!aiData || aiData.forSongId !== currentSong.id) {
        setIsAiLoading(true);
        setAiData(null);
        
        const result = await generateAIContent(currentSong.title, currentSong.artist);
        
        setAiData({ ...result, forSongId: currentSong.id });
        setIsAiLoading(false);
        
        if (result.color) {
            const hex = result.color.replace('#', '');
            const r = parseInt(hex.substring(0,2), 16);
            const g = parseInt(hex.substring(2,4), 16);
            const b = parseInt(hex.substring(4,6), 16);
            setBgGlowColor(`rgba(${r}, ${g}, ${b}, 0.6)`);
        }
    }
  };

  const closeAiModal = (e) => {
    if (e) e.stopPropagation();
    setShowAiModal(false);
  };

  // --- Audio Init ---

  const initSynth = () => {
    if (!audioCtxRef.current) {
      const synth = createSynthesizer();
      if (synth) audioCtxRef.current = synth;
    }
    if (audioCtxRef.current?.ctx.state === 'suspended') {
      audioCtxRef.current.ctx.resume();
    }
    if(audioCtxRef.current?.masterGain) {
        audioCtxRef.current.masterGain.gain.value = volume;
    }
  };

  // Safe Play Wrapper to fix "interrupted by pause" errors
  const safePlay = async (audio) => {
      try {
          if (playPromiseRef.current) {
              await playPromiseRef.current;
          }
          playPromiseRef.current = audio.play();
          await playPromiseRef.current;
          playPromiseRef.current = null;
      } catch (err) {
          // Abort errors are expected when switching songs fast
          if (err.name !== 'AbortError') {
             console.log("SafePlay Interrupted (Expected behavior on fast switch)");
          }
      }
  };

  useEffect(() => {
    if (audioElemRef.current) {
      audioElemRef.current.volume = volume;
    }
    if (audioCtxRef.current?.masterGain) {
      audioCtxRef.current.masterGain.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
      setAiData(null);
      if (isPlaying) {
          setBgGlowColor('rgba(234, 88, 12, 0.4)'); 
      } else {
          setBgGlowColor('rgba(0,0,0,0)');
      }
  }, [currentSongIndex]);

  useEffect(() => {
    if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    if (audioElemRef.current) {
        audioElemRef.current.pause();
    }

    melodyIndexRef.current = 0;
    
    if (isPlaying) {
        setBgGlowColor('rgba(200, 50, 50, 0.3)'); 

        if (currentSong.type === 'synth') {
            initSynth();
            if(audioCtxRef.current) nextNoteTimeRef.current = audioCtxRef.current.ctx.currentTime;
            setDuration(currentSong.duration); 

            const playLoop = () => {
                if (!audioCtxRef.current) return;
                const { ctx, playNote } = audioCtxRef.current;
                
                // Logic to check end of synth song
                if (currentTime >= currentSong.duration && currentSong.duration > 0) {
                     handleSongEnd();
                     return;
                }

                while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
                    const note = currentSong.melody[melodyIndexRef.current];
                    playNote(note.f, currentSong.waveType, note.d, nextNoteTimeRef.current, 0.1);
                    nextNoteTimeRef.current += note.d;
                    melodyIndexRef.current++;
                    if (melodyIndexRef.current >= currentSong.melody.length) {
                        melodyIndexRef.current = 0; 
                    }
                }
            };
            synthIntervalRef.current = setInterval(playLoop, 25);
        } else if (currentSong.type === 'local') {
            if (!audioElemRef.current) audioElemRef.current = new Audio();
            
            const src = currentSong.src;
            if (audioElemRef.current.src !== src) {
                audioElemRef.current.src = src;
                audioElemRef.current.load();
            }
            
            audioElemRef.current.volume = volume;
            
            // Use Safe Play
            safePlay(audioElemRef.current);
            
            audioElemRef.current.onloadedmetadata = () => {
                setDuration(audioElemRef.current.duration);
            };

            audioElemRef.current.onended = () => handleSongEnd();
        }
    } else {
        setBgGlowColor('rgba(0,0,0,0)'); 
    }

    return () => {
        if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
    };
  }, [isPlaying, currentSongIndex, songs]); 

  const handleSongEnd = () => {
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      
      if (loopMode === 1) {
          // Loop Single Song
          setCurrentTime(0);
          setProgress(0);
          melodyIndexRef.current = 0;
          if (audioCtxRef.current) nextNoteTimeRef.current = audioCtxRef.current.ctx.currentTime;
          
          if (currentSong.type === 'local' && audioElemRef.current) {
              audioElemRef.current.currentTime = 0;
              safePlay(audioElemRef.current);
          } else {
              setIsPlaying(false);
              setTimeout(() => setIsPlaying(true), 10);
          }
      } else {
          // Loop Playlist (Next Song)
          nextSong();
      }
  };

  useEffect(() => {
    const updateProgress = () => {
      if (isDraggingProgress) return;

      if (currentSong.type === 'synth') {
         if (isPlaying) {
             setCurrentTime(prev => {
                 const next = prev + 0.05; 
                 return Math.min(next, currentSong.duration);
             });
             setProgress((currentTime / currentSong.duration) * 100);
         }
      } else if (currentSong.type === 'local' && audioElemRef.current) {
          const dur = audioElemRef.current.duration;
          const curr = audioElemRef.current.currentTime;
          setDuration(dur || 0);
          setCurrentTime(curr || 0);
          if (dur > 0) {
              setProgress((curr / dur) * 100);
          }
      }
    };

    let interval;
    if (isPlaying) {
        interval = setInterval(updateProgress, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong, isDraggingProgress, loopMode, currentTime]);


  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newSongs = files.map(file => ({
        id: URL.createObjectURL(file),
        type: 'local',
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Local Device',
        color: 'from-gray-700 to-gray-900',
        coverGradient: 'linear-gradient(135deg, #4b5563, #1f2937)',
        src: URL.createObjectURL(file),
        duration: 0
    }));

    setSongs(prev => [...prev, ...newSongs]);
    setCurrentSongIndex(songs.length);
    setIsPlaying(true);
    setShowQueue(true);
  };

  // --- Robust Swipe Handlers ---

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const distance = touchStartY.current - touchEndY.current;
    if (distance > 70 && !showQueue && !showAiModal) {
        setShowQueue(true);
    }
  };

  const handleQueueTouchEnd = (e) => {
    const distance = touchStartY.current - touchEndY.current;
    if (distance < -70 && showQueue) {
        setShowQueue(false);
    }
  };

  const stopProp = (e) => {
    e.stopPropagation();
  };

  // --- Controls ---

  const togglePlay = (e) => {
    if(e) e.stopPropagation();
    setIsPlaying(!isPlaying);
  };
  
  const nextSong = (e) => {
    if(e) e.stopPropagation();
    setCurrentSongIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const prevSong = (e) => {
    if(e) e.stopPropagation();
    setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setProgress(val);
    
    if (currentSong.type === 'local' && audioElemRef.current) {
        const newTime = (val / 100) * audioElemRef.current.duration;
        audioElemRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    } else if (currentSong.type === 'synth') {
        const newTime = (val / 100) * currentSong.duration;
        setCurrentTime(newTime);
        melodyIndexRef.current = 0; 
        if(audioCtxRef.current) nextNoteTimeRef.current = audioCtxRef.current.ctx.currentTime;
    }
  };

  const handleVolumeChange = (e) => {
      e.stopPropagation();
      const val = parseFloat(e.target.value);
      setVolume(val);
      if (val > 0 && isMuted) setIsMuted(false);
      if (val === 0 && !isMuted) setIsMuted(true);
  };

  const toggleQueue = (e) => {
      e.stopPropagation();
      setShowQueue(prev => !prev);
  };
  
  const toggleLoop = (e) => {
      e.stopPropagation();
      setLoopMode(prev => (prev === 0 ? 1 : 0)); // Toggle 0 -> 1 -> 0
  };

  return (
    <div 
        className="relative w-full h-[100dvh] overflow-hidden bg-black font-sans text-white selection:bg-pink-500 selection:text-white touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="audio/*" 
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[#050505] z-0" />
      
      {/* Dynamic Glow Layer */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vmin] h-[120vmin] rounded-full blur-[120px] transition-all duration-1000 z-0 pointer-events-none opacity-80 mix-blend-screen" 
        style={{ 
            backgroundColor: bgGlowColor,
            transform: isPlaying ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.8)',
        }}
      />
      
      <div className={`absolute inset-0 z-0 backdrop-blur-3xl transition-colors duration-1000 pointer-events-none ${isPlaying ? 'bg-transparent' : 'bg-black/60'}`} />
      
      <ParticleBackground />

      {/* Mute Feedback Overlay */}
      {showMuteFeedback && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] bg-black/60 backdrop-blur-md p-6 rounded-3xl animate-fade-in border border-white/10 flex flex-col items-center">
              {isMuted ? <VolumeX size={48} className="text-red-500 mb-2" /> : <Volume2 size={48} className="text-cyan-400 mb-2" />}
              <span className="text-sm font-mono tracking-widest">{isMuted ? "SYSTEM MUTED" : "AUDIO ONLINE"}</span>
          </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full">
        
        {/* Header */}
        <div className="w-full p-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-4">
            <div className="text-xs md:text-sm font-medium tracking-widest opacity-60 uppercase">Library</div>
            <button 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/5 text-xs font-bold transition-all active:scale-95"
            >
                <Plus size={14} /> Add Music
            </button>
          </div>
          <div className="text-xs md:text-sm font-medium tracking-widest opacity-60 uppercase hidden md:block">Now Playing</div>
          <div className="flex items-center gap-2">
            <button 
                onClick={(e) => { e.stopPropagation(); window.alert("Due to browser security, local MP3 cover art cannot be displayed without heavy external libraries. This app generates unique gradient art for your files instead!"); }}
                className="opacity-40 hover:opacity-100 transition-opacity"
            >
                <Info size={20} />
            </button>
            <MoreHorizontal 
                className="opacity-60 hover:opacity-100 cursor-pointer transition-opacity" 
                onClick={stopProp}
            />
          </div>
        </div>

        {/* --- Adjacent Flat Carousel Layout --- */}
        <div className="flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
          <div className="flex items-center justify-center w-full h-80 md:h-96 relative">
             {songs.map((song, index) => {
                const offset = index - currentSongIndex;
                if (Math.abs(offset) > 2) return null;
                const isActive = offset === 0;
                
                const transform = `translateX(${offset * 110}%) scale(${isActive ? 1 : 0.85})`;
                const zIndex = isActive ? 50 : 40 - Math.abs(offset);
                const opacity = isActive ? 1 : 0.5;
                const blur = isActive ? '0px' : '2px';

                return (
                    <div
                        key={song.id}
                        className="absolute transition-all duration-500 ease-out cursor-pointer will-change-transform top-0 bottom-0 m-auto flex items-center justify-center"
                        style={{
                            transform,
                            zIndex,
                            opacity,
                            filter: `blur(${blur})`,
                            left: '0', right: '0', 
                            width: 'fit-content', height: 'fit-content'
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentSongIndex(index);
                            setIsPlaying(true);
                            setCurrentTime(0);
                        }}
                    >
                        <div className="w-[65vw] h-[65vw] md:w-72 md:h-72 max-w-[300px] max-h-[300px] rounded-2xl shadow-2xl overflow-hidden border border-white/10 relative group bg-black transition-transform">
                             <div className="w-full h-full absolute top-0 left-0" style={{ background: song.coverGradient }} />
                             <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                 <Music size={64} className="text-white mix-blend-overlay" />
                             </div>
                             {isActive && (
                                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                    <h2 className="text-xl font-bold mb-1 drop-shadow-md truncate">{song.title}</h2>
                                    <p className="text-white/70 text-sm font-medium drop-shadow-sm">{song.artist}</p>
                                </div>
                             )}
                        </div>
                    </div>
                );
             })}
          </div>
        </div>

        <div className="h-32 md:h-24 w-full" />
      </div>

      {/* Glass Player Controls */}
      <div className="fixed bottom-0 left-0 w-full z-50 px-4 pb-6 pt-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
        
        <div className="w-full flex justify-center mb-2 animate-bounce opacity-50">
            <ChevronUp size={16} />
        </div>

        <div className="w-full max-w-3xl mx-auto relative pointer-events-auto">
            
          <div className="relative overflow-visible rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-4 pt-6">
            
            {/* --- Volume Slider (With Dramatic Effect) --- */}
            <div 
                className="absolute top-0 left-0 w-full h-6 group cursor-pointer flex items-center justify-center -mt-3"
                onTouchStart={stopProp}
                onMouseDown={stopProp}
            >
                 <div className={`relative w-1/2 h-1 bg-white/10 rounded-full overflow-hidden hover:h-2 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${muteEffect === 'breaking' ? 'animate-break-bar' : ''}`}>
                    <div 
                        className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                            muteEffect === 'healing' 
                            ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]' 
                            : isMuted ? 'bg-gray-600' : 'bg-gradient-to-r from-red-500 to-orange-500'
                        }`}
                        style={{ width: `${volume * 100}%` }}
                    />
                 </div>
                 <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={volume}
                    onChange={handleVolumeChange}
                    className="absolute top-0 w-1/2 h-6 opacity-0 cursor-pointer"
                 />
            </div>

            {/* Controls Main */}
            <div className="flex items-center justify-between gap-4 mt-2">
              <div className="hidden md:flex flex-col w-1/4">
                 <span className="font-bold text-sm truncate">{currentSong.title}</span>
                 <span className="text-xs text-white/50 font-mono mt-1">
                    {formatTime(currentTime)} / {formatTime(duration)}
                 </span>
              </div>

              <div className="flex-1 flex items-center justify-center gap-6">
                <button onClick={prevSong} onTouchStart={stopProp} className="p-2 text-white/60 hover:text-white transition-colors active:scale-90">
                  <SkipBack size={20} fill="currentColor" />
                </button>
                
                <button 
                  onClick={togglePlay}
                  onTouchStart={stopProp}
                  className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
                </button>
                
                <button onClick={nextSong} onTouchStart={stopProp} className="p-2 text-white/60 hover:text-white transition-colors active:scale-90">
                  <SkipForward size={20} fill="currentColor" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-4 w-1/4">
                <button
                    onClick={handleAiVibeCheck}
                    onTouchStart={stopProp}
                    className="p-2 text-white/60 hover:text-purple-400 transition-colors animate-pulse"
                    title="Ask AI for Vibe"
                >
                    <Sparkles size={20} />
                </button>

                <button 
                  onClick={toggleQueue}
                  onTouchStart={stopProp}
                  className={`p-2 transition-colors ${showQueue ? 'text-orange-400' : 'text-white/60 hover:text-white'}`}
                >
                  <List size={20} />
                </button>
                
                <button 
                    onClick={toggleLoop}
                    onTouchStart={stopProp}
                    className={`p-2 transition-colors relative ${loopMode === 1 ? 'text-green-400' : 'text-white/60 hover:text-white'}`}
                >
                    {loopMode === 1 ? <Repeat1 size={20} /> : <Repeat size={20} />}
                </button>
              </div>
            </div>

            {/* --- Progress Bar --- */}
            <div 
                className="absolute bottom-0 left-0 w-full h-3 group cursor-pointer"
                onTouchStart={stopProp}
                onMouseDown={stopProp}
            >
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 group-hover:h-2 transition-all" />
                <div 
                    className="absolute bottom-0 left-0 h-1 group-hover:h-2 bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-100 shadow-[0_-2px_10px_rgba(234,88,12,0.5)]"
                    style={{ width: `${progress}%` }}
                />
                <input
                    type="range"
                    min="0" max="100" step="0.1"
                    value={progress}
                    onChange={handleSeek}
                    onMouseDown={(e) => { stopProp(e); setIsDraggingProgress(true); }}
                    onMouseUp={(e) => { stopProp(e); setIsDraggingProgress(false); }}
                    onTouchStart={(e) => { stopProp(e); setIsDraggingProgress(true); }}
                    onTouchEnd={(e) => { stopProp(e); setIsDraggingProgress(false); }}
                    className="absolute bottom-0 left-0 w-full h-4 opacity-0 cursor-pointer z-10"
                />
            </div>
          </div>
        </div>
      </div>

      {/* --- AI Vibe Modal --- */}
      {showAiModal && (
          <div 
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={closeAiModal}
          >
              <div 
                className="w-full max-w-sm bg-black/60 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
                onClick={stopProp}
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[50px] pointer-events-none" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                      <h3 className="text-xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                          <Sparkles size={18} className="text-purple-400" /> AI Vibe Check
                      </h3>
                      <button onClick={closeAiModal} className="text-white/50 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>
                  {isAiLoading ? (
                      <div className="h-40 flex flex-col items-center justify-center text-white/50 gap-3">
                          <Loader size={32} className="animate-spin text-purple-400" />
                          <p className="text-xs tracking-widest uppercase">Consulting the Oracle...</p>
                      </div>
                  ) : aiData ? (
                      <div className="space-y-4 animate-slide-up relative z-10">
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">{aiData.emoji}</span>
                                <span className="text-xs font-bold uppercase text-white/40 tracking-widest">DJ Intro</span>
                            </div>
                            <p className="text-sm font-medium italic text-white/90 leading-relaxed">"{aiData.intro}"</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500" />
                              <span className="text-xs font-bold uppercase text-white/40 tracking-widest block mb-2">Lyrics / Insight</span>
                              <p className="text-sm text-white/80 whitespace-pre-line font-mono leading-relaxed">{aiData.poem}</p>
                          </div>
                      </div>
                  ) : null}
              </div>
          </div>
      )}

      {/* Full Screen Queue Overlay */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl transition-transform duration-500 ease-out flex flex-col ${showQueue ? 'translate-y-0' : 'translate-y-full'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleQueueTouchEnd}
      >
        <div className="w-full max-w-3xl mx-auto h-full flex flex-col relative">
            <div className="w-full flex justify-center pt-4 pb-2" onClick={() => setShowQueue(false)}>
                <div className="w-16 h-1.5 bg-white/20 rounded-full" />
            </div>
            <div className="p-6 flex justify-between items-center">
                <h3 className="font-bold text-2xl flex items-center gap-3">
                    <Music className="text-orange-500" /> Library & Queue
                </h3>
                <button onClick={(e) => { e.stopPropagation(); setShowQueue(false); }} className="p-2 hover:bg-white/10 rounded-full">
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-32 custom-scrollbar">
                {songs.length === defaultSongs.length && (
                    <div className="p-4 mb-4 rounded-xl bg-white/5 border border-white/10 text-center text-sm text-white/50">
                        Tap "Add Music" to play your local MP3 files.
                    </div>
                )}
                {songs.map((song, index) => {
                    const isCurrent = currentSongIndex === index;
                    return (
                        <div 
                            key={index} 
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentSongIndex(index);
                                setIsPlaying(true);
                                setShowQueue(false);
                            }}
                            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${isCurrent ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br flex-shrink-0 relative overflow-hidden" style={{ background: song.coverGradient }}>
                                {isCurrent && isPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center gap-1">
                                        <div className="w-1 h-4 bg-white animate-bounce" style={{ animationDelay: '0s' }} />
                                        <div className="w-1 h-6 bg-white animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-base font-bold truncate ${isCurrent ? 'text-orange-400' : 'text-white'}`}>{song.title}</p>
                                <p className="text-xs text-white/50 truncate">{song.artist}</p>
                            </div>
                        </div>
                    );
                })}
                <button 
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                    className="w-full py-4 rounded-2xl border border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} /> Add More Songs
                </button>
            </div>
        </div>
      </div>
      
      <style>{`
        /* Dramatic Mute Break Animation */
        @keyframes break-bar {
            0% { transform: scaleX(1) skewX(0deg); filter: hue-rotate(0deg); }
            20% { transform: scaleX(1.1) skewX(-20deg); filter: hue-rotate(90deg); }
            40% { transform: scaleX(0.8) skewX(20deg); filter: hue-rotate(180deg); }
            60% { transform: scaleX(1.05) skewX(-10deg); filter: hue-rotate(270deg); }
            80% { transform: scaleX(0.9) skewX(10deg); filter: hue-rotate(360deg); }
            100% { transform: scaleX(0); opacity: 0; }
        }
        .animate-break-bar {
            animation: break-bar 0.4s ease-in forwards;
        }

        /* Black Scrollbar Theme */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333; 
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555; 
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow linear infinite;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slide-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out;
        }
        .animate-slide-up {
            animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;
