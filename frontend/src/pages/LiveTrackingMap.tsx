import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, Navigation, Clock, MapPin, Share2, RefreshCw } from 'lucide-react';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different user statuses
const createCustomIcon = (color: string, isOnline: boolean) => {
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-6 h-6 rounded-full bg-${color}-500 border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>
        ${isOnline ? `
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        ` : ''}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface UserLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lastUpdate: Date;
  isOnline: boolean;
  color: string;
  speed?: number;
  battery?: number;
}

interface TripPath {
  lat: number;
  lng: number;
  timestamp: Date;
  userId: string;
}

interface LiveTrackingMapProps {
  tripId: string;
  currentUser: any;
  tripMembers: any[];
}

// Component to handle map centering
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

// Mock data generator for demonstration
const generateMockLocations = (members: any[]): UserLocation[] => {
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal'];
  const centerLat = 51.505;
  const centerLng = -0.09;
  
  return members.map((member, index) => {
    // Generate random positions around center point
    const lat = centerLat + (Math.random() - 0.5) * 0.02;
    const lng = centerLng + (Math.random() - 0.5) * 0.02;
    
    return {
      id: member.id,
      name: member.name,
      lat,
      lng,
      lastUpdate: new Date(),
      isOnline: Math.random() > 0.3, // 70% chance of being online
      color: colors[index % colors.length],
      speed: Math.random() * 5 + 1, // km/h
      battery: Math.floor(Math.random() * 100),
    };
  });
};

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ 
  tripId, 
  currentUser, 
  tripMembers 
}) => {
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [tripPaths, setTripPaths] = useState<{ [key: string]: TripPath[] }>({});
  const [isTracking, setIsTracking] = useState(true);
  const [center, setCenter] = useState<[number, number]>([51.505, -0.09]);
  const [zoom, setZoom] = useState(13);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const mapRef = useRef<L.Map>(null);

  // Initialize with mock data
  useEffect(() => {
    const initialLocations = generateMockLocations(tripMembers);
    setUserLocations(initialLocations);
    
    // Initialize trip paths
    const paths: { [key: string]: TripPath[] } = {};
    initialLocations.forEach(user => {
      paths[user.id] = [{
        lat: user.lat,
        lng: user.lng,
        timestamp: new Date(),
        userId: user.id
      }];
    });
    setTripPaths(paths);
  }, [tripMembers]);

  // Simulate real-time location updates
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setUserLocations(prev => 
        prev.map(user => {
          if (!user.isOnline) return user;

          // Simulate movement
          const newLat = user.lat + (Math.random() - 0.5) * 0.001;
          const newLng = user.lng + (Math.random() - 0.5) * 0.001;
          
          // Update trip path
          setTripPaths(prevPaths => ({
            ...prevPaths,
            [user.id]: [
              ...(prevPaths[user.id] || []),
              {
                lat: newLat,
                lng: newLng,
                timestamp: new Date(),
                userId: user.id
              }
            ].slice(-50) // Keep last 50 points
          }));

          return {
            ...user,
            lat: newLat,
            lng: newLng,
            lastUpdate: new Date(),
            speed: Math.random() * 5 + 1,
            battery: Math.max(0, (user.battery || 100) - Math.random() * 2)
          };
        })
      );
      setLastUpdate(new Date());
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isTracking]);

  const handleCenterOnUser = (userId: string) => {
    const user = userLocations.find(u => u.id === userId);
    if (user && mapRef.current) {
      setCenter([user.lat, user.lng]);
      setZoom(16);
    }
  };

  const handleCenterOnGroup = () => {
    if (userLocations.length === 0) return;

    // Calculate center of all users
    const avgLat = userLocations.reduce((sum, user) => sum + user.lat, 0) / userLocations.length;
    const avgLng = userLocations.reduce((sum, user) => sum + user.lng, 0) / userLocations.length;
    
    setCenter([avgLat, avgLng]);
    setZoom(13);
  };

  const handleShareLocation = () => {
    // In a real app, this would trigger location sharing permissions
    alert('Location sharing request sent to all group members!');
  };

  const getTimeSinceUpdate = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const onlineUsers = userLocations.filter(user => user.isOnline);
  const offlineUsers = userLocations.filter(user => !user.isOnline);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Group Tracking</h1>
              <p className="text-gray-600">Real-time location tracking for your travel group</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsTracking(!isTracking)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isTracking 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <RefreshCw size={16} />
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </button>
              
              <button
                onClick={handleCenterOnGroup}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Navigation size={16} />
                Center Group
              </button>
              
              <button
                onClick={handleShareLocation}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                <Share2 size={16} />
                Share Location
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Users className="mx-auto mb-2 text-blue-600" size={24} />
              <div className="text-2xl font-bold text-blue-600">{userLocations.length}</div>
              <div className="text-blue-700 text-sm">Group Members</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{onlineUsers.length}</div>
              <div className="text-green-700 text-sm">Online Now</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Clock className="mx-auto mb-2 text-purple-600" size={24} />
              <div className="text-2xl font-bold text-purple-600">
                {getTimeSinceUpdate(lastUpdate)}
              </div>
              <div className="text-purple-700 text-sm">Last Update</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <MapPin className="mx-auto mb-2 text-orange-600" size={24} />
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(tripPaths).flat().length}
              </div>
              <div className="text-orange-700 text-sm">Location Points</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 h-[600px]">
              <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapController center={center} zoom={zoom} />
                
                {/* Draw paths for each user */}
                {Object.entries(tripPaths).map(([userId, path]) => (
                  <Polyline
                    key={userId}
                    positions={path.map(p => [p.lat, p.lng])}
                    color={userLocations.find(u => u.id === userId)?.color || 'blue'}
                    weight={3}
                    opacity={0.6}
                  />
                ))}
                
                {/* User markers */}
                {userLocations.map(user => (
                  <Marker
                    key={user.id}
                    position={[user.lat, user.lng]}
                    icon={createCustomIcon(user.color, user.isOnline)}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full bg-${user.color}-500`}></div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.isOnline 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Last update:</span>
                            <span>{getTimeSinceUpdate(user.lastUpdate)}</span>
                          </div>
                          
                          {user.speed && (
                            <div className="flex justify-between">
                              <span>Speed:</span>
                              <span>{user.speed.toFixed(1)} km/h</span>
                            </div>
                          )}
                          
                          {user.battery !== undefined && (
                            <div className="flex justify-between">
                              <span>Battery:</span>
                              <span className={user.battery < 20 ? 'text-red-600 font-semibold' : ''}>
                                {user.battery}%
                              </span>
                            </div>
                          )}
                          
                          <div className="flex justify-between">
                            <span>Location:</span>
                            <span>{user.lat.toFixed(4)}, {user.lng.toFixed(4)}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleCenterOnUser(user.id)}
                          className="w-full mt-3 bg-blue-500 text-white py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                        >
                          Center on {user.name}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Sidebar - User List */}
          <div className="space-y-6">
            {/* Online Users */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Online Members ({onlineUsers.length})
              </h3>
              
              <div className="space-y-3">
                {onlineUsers.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedUser === user.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedUser(user.id);
                      handleCenterOnUser(user.id);
                    }}
                  >
                    <div className={`w-3 h-3 rounded-full bg-${user.color}-500`}></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Clock size={12} />
                        {getTimeSinceUpdate(user.lastUpdate)}
                        {user.speed && (
                          <>
                            <span>•</span>
                            <span>{user.speed.toFixed(1)} km/h</span>
                          </>
                        )}
                      </div>
                    </div>
                    {user.battery !== undefined && (
                      <div className={`text-xs font-medium ${
                        user.battery < 20 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {user.battery}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Offline Users */}
            {offlineUsers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Offline Members ({offlineUsers.length})
                </h3>
                
                <div className="space-y-3">
                  {offlineUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 opacity-60"
                    >
                      <div className={`w-3 h-3 rounded-full bg-${user.color}-500`}></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          Last seen {getTimeSinceUpdate(user.lastUpdate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tracking Info */}
            <div className="bg-blue-50 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Tracking Information</h3>
              
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-semibold ${
                    isTracking ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isTracking ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Update Interval:</span>
                  <span>3 seconds</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span>~5-10 meters</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Battery Usage:</span>
                  <span>Optimized</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 <strong>Tip:</strong> Location tracking works best when all group members 
                  have the app open and location services enabled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;