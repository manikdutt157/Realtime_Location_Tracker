import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Send, MapPin, Users, Navigation } from 'lucide-react'

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface Location {
  id: string
  lat: number
  lng: number
  timestamp: number
}

interface UserLocation extends Location {
  name: string
  color: string
}

// Custom marker icon
const createCustomIcon = (color: string) => L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(45deg);
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

// Component to center map on location
function MapCenter({ center }: { center: [number, number] | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1 })
    }
  }, [center, map])
  
  return null
}

export default function LocationTracker() {
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [otherUsers, setOtherUsers] = useState<UserLocation[]>([])
  const [isSharing, setIsSharing] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  // User colors for different sessions
  const userColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ]

  const getRandomColor = () => userColors[Math.floor(Math.random() * userColors.length)]

  // Connect to WebSocket server
  const connectWebSocket = useCallback(() => {
    try {
      // Using a mock WebSocket for demo - in production, connect to your server
      setConnectedUsers(1)
      
      // Simulate other users for demo
      const simulatedUsers: UserLocation[] = [
        {
          id: 'user_1',
          name: 'Demo User 1',
          lat: 40.7128 + (Math.random() - 0.5) * 0.01,
          lng: -74.006 + (Math.random() - 0.5) * 0.01,
          timestamp: Date.now(),
          color: getRandomColor()
        },
        {
          id: 'user_2',
          name: 'Demo User 2',
          lat: 40.758 + (Math.random() - 0.5) * 0.01,
          lng: -73.9855 + (Math.random() - 0.5) * 0.01,
          timestamp: Date.now(),
          color: getRandomColor()
        }
      ]
      setOtherUsers(simulatedUsers)
    } catch (err) {
      console.error('WebSocket connection error:', err)
    }
  }, [])

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (err) => {
        setError(`Unable to get location: ${err.message}`)
        // Set default location for demo
        setMyLocation({ lat: 40.7128, lng: -74.006 })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // Start sharing location
  const startSharing = useCallback(() => {
    getCurrentLocation()
    setIsSharing(true)
    connectWebSocket()
  }, [getCurrentLocation, connectWebSocket])

  // Stop sharing location
  const stopSharing = useCallback(() => {
    setIsSharing(false)
    setMyLocation(null)
  }, [])

  // Update location periodically
  useEffect(() => {
    if (!isSharing) return

    const interval = setInterval(() => {
      getCurrentLocation()
    }, 5000)

    return () => clearInterval(interval)
  }, [isSharing, getCurrentLocation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [])

  const defaultCenter: [number, number] = myLocation 
    ? [myLocation.lat, myLocation.lng] 
    : [40.7128, -74.006]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-4">
          <button
            onClick={isSharing ? stopSharing : startSharing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isSharing
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : 'bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30'
            }`}
          >
            <Navigation className="w-4 h-4" />
            {isSharing ? 'Stop Sharing' : 'Share My Location'}
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users className="w-4 h-4" />
            <span>{connectedUsers} user{connectedUsers !== 1 ? 's' : ''} online</span>
          </div>
        </div>

        {error && (
          <div className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-slate-700/50">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="h-[500px] w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* My Location Marker */}
          {myLocation && (
            <Marker position={[myLocation.lat, myLocation.lng]} icon={createCustomIcon('#0ea5e9')}>
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">My Location</p>
                  <p className="text-xs text-slate-400">
                    {myLocation.lat.toFixed(6)}, {myLocation.lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Other Users Markers */}
          {otherUsers.map((user) => (
            <Marker
              key={user.id}
              position={[user.lat, user.lng]}
              icon={createCustomIcon(user.color)}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs text-slate-400">
                    {user.lat.toFixed(6)}, {user.lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          <MapCenter center={myLocation ? [myLocation.lat, myLocation.lng] : null} />
        </MapContainer>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] p-3 rounded-lg bg-slate-900/90 border border-slate-700/50">
          <p className="text-xs font-medium text-slate-400 mb-2">Legend</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary-500" />
              <span className="text-xs">My Location</span>
            </div>
            {otherUsers.slice(0, 3).map((user) => (
              <div key={user.id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
                <span className="text-xs">{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location Info */}
      {myLocation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-primary-400 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Current Coordinates</span>
            </div>
            <p className="text-lg font-mono">{myLocation.lat.toFixed(6)}, {myLocation.lng.toFixed(6)}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Connected Users</span>
            </div>
            <p className="text-lg font-mono">{connectedUsers + otherUsers.length}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Send className="w-4 h-4" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <p className="text-lg font-mono">{isSharing ? 'Sharing Active' : 'Idle'}</p>
          </div>
        </div>
      )}
    </div>
  )
}