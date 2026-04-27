import { useState } from 'react'
import { Search, MapPin, Globe, Server, Clock, Building, Wifi, Loader2, AlertCircle } from 'lucide-react'

interface GeoData {
  ip: string
  country: string
  region: string
  city: string
  isp: string
  lat: number
  lon: number
  timezone: string
}

export default function GeoTraceOSINT() {
  const [ip, setIp] = useState('')
  const [data, setData] = useState<GeoData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<GeoData[]>([])

  const locateIp = async () => {
    const trimmedIp = ip.trim()
    if (!trimmedIp) {
      setError('Please enter an IP address')
      return
    }

    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipRegex.test(trimmedIp)) {
      setError('Invalid IP address format')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/locate?ip=${trimmedIp}`)
      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Failed to locate IP')
      } else {
        setData(result)
        // Add to history (keep last 5)
        setHistory(prev => [result, ...prev.filter(h => h.ip !== result.ip)].slice(0, 5))
      }
    } catch (err) {
      setError('Server not reachable. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      locateIp()
    }
  }

  const clearHistory = () => {
    setHistory([])
    setData(null)
  }

  const loadFromHistory = (item: GeoData) => {
    setData(item)
    setIp(item.ip)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Section */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter IP address (e.g., 8.8.8.8)"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-slate-100 placeholder-slate-500 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all disabled:opacity-50"
            />
          </div>
          <button
            onClick={locateIp}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                Locate
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IP Details Card */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold">IP Details</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={Wifi} label="IP Address" value={data.ip} />
              <InfoItem icon={Globe} label="Country" value={data.country} />
              <InfoItem icon={Building} label="Region" value={data.region} />
              <InfoItem icon={MapPin} label="City" value={data.city} />
              <InfoItem icon={Server} label="ISP" value={data.isp} className="col-span-2" />
              <InfoItem icon={Clock} label="Timezone" value={data.timezone} />
              <InfoItem icon={MapPin} label="Coordinates" value={`${data.lat}, ${data.lon}`} />
            </div>
          </div>

          {/* Map Card */}
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold">Location Map</h2>
            </div>
            
            <div className="h-[280px] rounded-lg overflow-hidden bg-slate-900/50">
              <iframe
                src={`/api/map?t=${Date.now()}`}
                title="Map"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold">Recent Searches</h2>
            </div>
            <button
              onClick={clearHistory}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear History
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item, index) => (
              <button
                key={`${item.ip}-${index}`}
                onClick={() => loadFromHistory(item)}
                className="p-3 rounded-lg bg-slate-900/50 border border-slate-600/50 hover:border-primary-500/50 transition-all text-left"
              >
                <p className="font-mono text-sm text-primary-400">{item.ip}</p>
                <p className="text-xs text-slate-400 mt-1">{item.city}, {item.country}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
        <p className="text-sm text-slate-400">
          <span className="text-primary-400 font-medium">Tip:</span> Try public IPs like{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-800 text-primary-400">8.8.8.8</code> (Google DNS){' '}
          or <code className="px-1.5 py-0.5 rounded bg-slate-800 text-primary-400">1.1.1.1</code> (Cloudflare)
        </p>
      </div>
    </div>
  )
}

// Info Item Component
function InfoItem({ icon: Icon, label, value, className = '' }: { 
  icon: React.ElementType
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`p-3 rounded-lg bg-slate-900/50 ${className}`}>
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium truncate" title={value}>{value}</p>
    </div>
  )
}