import { useState, useEffect } from 'react'
import { MapPin, Globe, Moon, Sun, Wifi, WifiOff } from 'lucide-react'
import LocationTracker from './components/LocationTracker'
import GeoTraceOSINT from './components/GeoTraceOSINT'

type Tab = 'tracker' | 'geotrace'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('tracker')
  const [darkMode, setDarkMode] = useState(true)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    // Check backend status - use relative path for Vercel compatibility
    const checkBackend = async () => {
      try {
        const res = await fetch('/api/health', { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        })
        setBackendStatus(res.ok ? 'online' : 'offline')
      } catch {
        setBackendStatus('offline')
      }
    }

    checkBackend()
    const interval = setInterval(checkBackend, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500/20 rounded-xl">
                <MapPin className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
                  GeoTrace Tracker
                </h1>
                <p className="text-xs text-slate-400">Real-time Location & IP Geolocation</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Backend Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 text-sm">
                {backendStatus === 'online' ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Backend Online</span>
                  </>
                ) : backendStatus === 'offline' ? (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">Backend Offline</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-yellow-400">Checking...</span>
                  </>
                )}
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'tracker'
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Live Tracker
            </button>
            <button
              onClick={() => setActiveTab('geotrace')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'geotrace'
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Globe className="w-4 h-4" />
              GeoTrace OSINT
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'tracker' ? (
          <LocationTracker />
        ) : (
          <GeoTraceOSINT />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-slate-500">
          <p>GeoTrace Tracker © 2026 • Built with React, Vite & Flask</p>
        </div>
      </footer>
    </div>
  )
}

export default App