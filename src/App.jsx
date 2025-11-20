import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import Spline from '@splinetool/react-spline'
import { useEffect, useRef, useState } from 'react'
import { Camera, RefreshCcw, Image as ImageIcon, Sparkles } from 'lucide-react'
import axios from 'axios'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Button({ children, onClick, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400',
    secondary: 'bg-slate-800/80 hover:bg-slate-800 text-white focus:ring-slate-300 border border-white/10',
    ghost: 'bg-transparent hover:bg-white/10 text-white focus:ring-white/30',
  }
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

function Hero() {
  const navigate = useNavigate()
  return (
    <div className="relative min-h-[70vh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/xzUirwcZB9SOxUWt/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-24 pb-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">Mood Story Generator</h1>
        <p className="mt-4 text-blue-100/90 text-lg max-w-2xl mx-auto">Capture your mood with the camera, let AI read your expression, and enjoy a short, personalized story with a matching illustration.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={() => navigate('/capture')}><Camera className="w-5 h-5" /> Start with Camera</Button>
          <Button variant="secondary" onClick={() => navigate('/')}><Sparkles className="w-5 h-5" /> Learn More</Button>
        </div>
      </div>
    </div>
  )
}

function CameraCapture({ onCaptured }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let stream
    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
        }
      } catch (e) {
        setError('Could not access camera. Please allow permission or use a supported device.')
      }
    }
    init()
    return () => stream && stream.getTracks().forEach(t => t.stop())
  }, [])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const w = video.videoWidth
    const h = video.videoHeight
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    onCaptured(dataUrl)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-6">Camera</h2>
      {error && <p className="text-rose-300 mb-4">{error}</p>}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          {!ready && <div className="absolute inset-0 grid place-items-center text-white/80 text-sm">Requesting camera…</div>}
        </div>
        <div className="space-y-4">
          <p className="text-blue-100/90">Make sure your face is visible and well-lit. When you are ready, capture a photo to analyze the mood.</p>
          <Button onClick={capture} disabled={!ready}><Camera className="w-5 h-5" /> Capture</Button>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  )
}

function Preview({ image, onRetake, onAnalyze }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-6">Preview</h2>
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5 aspect-video">
          <img src={image} alt="Captured" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-4">
          <p className="text-blue-100/90">Looks good? We will detect your mood and generate a story based on your expression.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onRetake}><RefreshCcw className="w-5 h-5" /> Retake</Button>
            <Button onClick={onAnalyze}><Sparkles className="w-5 h-5" /> Analyze & Generate</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Illustration({ mood }) {
  const map = {
    happy: '🌞', sad: '🌧️', angry: '🔥', fearful: '🌙', disgusted: '🍃', surprised: '✨', neutral: '☁️'
  }
  return (
    <div className="text-7xl select-none" aria-hidden>{map[mood?.toLowerCase()] || '☁️'}</div>
  )
}

function Result({ data, onAgain }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-white space-y-6">
        <div className="flex items-center gap-4">
          <Illustration mood={data.mood} />
          <div>
            <p className="text-sm uppercase tracking-wider text-blue-300/80">Detected mood</p>
            <h3 className="text-2xl font-bold">{data.mood}</h3>
          </div>
        </div>
        <p className="leading-7 text-blue-100/90 whitespace-pre-line">{data.story}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onAgain}><RefreshCcw className="w-5 h-5" /> Try Again</Button>
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Home</a>
        </div>
      </div>
    </div>
  )
}

function AppShell() {
  const [step, setStep] = useState('hero')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')

  const onCaptured = (dataUrl) => {
    setImage(dataUrl)
    setStep('preview')
  }

  const analyze = async () => {
    try {
      setLoading(true)
      setErr('')

      // Use face-api.js lightweight expressions via CDN models
      // Fallback: simple neutral mood if model load fails
      let mood = 'neutral'
      let expressions = {}
      try {
        const faceapi = await import('face-api.js')
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/models'
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])
        const img = new Image()
        img.src = image
        await new Promise(res => { img.onload = res })
        const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions()
        if (detections?.expressions) {
          expressions = detections.expressions
          const sorted = Object.entries(expressions).sort((a,b)=>b[1]-a[1])
          if (sorted.length) mood = sorted[0][0]
        }
      } catch (_) {
        // ignore model errors; keep neutral
      }

      const base = BACKEND
      const { data } = await axios.post(`${base}/api/generate-story`, {
        image_data: image,
        mood,
        expressions,
      })
      setResult(data)
      setStep('result')
    } catch (e) {
      setErr(e.response?.data?.detail || e.message || 'Failed to generate story')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-white/90 hover:text-white font-semibold tracking-tight">Mood Story</Link>
        <div className="text-sm text-blue-200/80">Backend: <span className="font-mono">{BACKEND}</span></div>
      </nav>

      {step === 'hero' && <Hero />}
      {step === 'hero' && (
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            {["Capture", "Preview", "Story"].map((t,i)=> (
              <div key={t} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-300 grid place-items-center mb-3">{i+1}</div>
                <h3 className="font-semibold mb-2">{t}</h3>
                <p className="text-blue-100/80 text-sm">Step {i+1} of the flow. Use your camera, confirm the shot, and get a personalized story.</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link to="#" onClick={() => setStep('capture')} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"><Camera className="w-5 h-5"/> Start</Link>
          </div>
        </div>
      )}

      {step === 'capture' && <CameraCapture onCaptured={onCaptured} />}
      {step === 'preview' && <Preview image={image} onRetake={() => setStep('capture')} onAnalyze={analyze} />}
      {step === 'result' && result && <Result data={result} onAgain={() => { setImage(''); setResult(null); setStep('capture') }} />}

      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 text-center max-w-sm w-full">
            <div className="mx-auto w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
            <p className="text-white font-medium">Analyzing mood and writing your story…</p>
          </div>
        </div>
      )}

      {err && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-4 py-2 rounded-lg shadow-lg">{err}</div>
      )}

      <footer className="max-w-6xl mx-auto px-6 py-12 text-blue-200/70 text-sm">
        Built with camera, face detection, and storytelling. Enjoy.
      </footer>
    </div>
  )
}

export default function App() { return (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AppShell/>} />
    </Routes>
  </BrowserRouter>
)}
