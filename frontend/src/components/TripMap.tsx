import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Loader, MapPin, Navigation, Calendar, Users } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  date: string;
  startTime?: string;
  endTime?: string;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  activities?: Activity[];
}

const TripMap: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  const fetchTripData = async () => {
    if (!tripId || !user) return;
    
    try {
      setError('');
      
      // Fetch trip details
      const tripData = await apiService.getTrip(tripId);
      setTrip(tripData);
      
      // Fetch activities - handle both possible response formats
      let activitiesData: Activity[] = [];
      try {
        const activitiesResponse = await apiService.getTripActivities(tripId);
        activitiesData = Array.isArray(activitiesResponse) 
          ? activitiesResponse 
          : activitiesResponse?.activities || activitiesResponse?.data || [];
      } catch (activityError) {
        console.warn('Could not fetch activities:', activityError);
        activitiesData = [];
      }
      
      // Ensure activities is always an array
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      
    } catch (error: any) {
      console.error('Failed to fetch trip data:', error);
      setError(error.message || 'Failed to load trip map');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, [tripId, user]);

  // Safe function to check if activity has coordinates
  const hasCoordinates = (activity: Activity): boolean => {
    return !!(activity.latitude && activity.longitude);
  };

  // Get activities with valid coordinates
  const getActivitiesWithCoordinates = (): Activity[] => {
    if (!activities || !Array.isArray(activities)) return [];
    return activities.filter(hasCoordinates);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading trip map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-200">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to load map</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={fetchTripData}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-all duration-300 w-full"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activitiesWithCoords = getActivitiesWithCoordinates();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {trip?.name || 'Trip Map'}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <MapPin size={18} />
                {trip?.destination || 'Unknown destination'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Activities</div>
              <div className="text-2xl font-bold text-blue-600">
                {activities.length}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Placeholder */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 h-96">
              <div className="flex items-center justify-center h-full flex-col">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Navigation size={32} className="text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Interactive Map
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {activitiesWithCoords.length > 0 
                    ? `${activitiesWithCoords.length} locations available for mapping`
                    : 'No locations with coordinates available'
                  }
                </p>
                <div className="text-sm text-gray-500 text-center">
                  <p>Map integration would show activities and routes here</p>
                  <p className="mt-1">Consider integrating with Google Maps or Mapbox</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Map Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Activities</span>
                  <span className="font-medium">{activities.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">With Locations</span>
                  <span className="font-medium">{activitiesWithCoords.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Need Coordinates</span>
                  <span className="font-medium">{activities.length - activitiesWithCoords.length}</span>
                </div>
              </div>
            </div>

            {/* Activities with Locations */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Activities with Locations
              </h3>
              
              {activitiesWithCoords.length > 0 ? (
                <div className="space-y-4">
                  {activitiesWithCoords.map((activity) => (
                    <div 
                      key={activity.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        {activity.location && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Mapped
                          </span>
                        )}
                      </div>
                      
                      {activity.location && (
                        <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                          <MapPin size={14} />
                          {activity.location}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {activity.date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                        )}
                        {activity.startTime && (
                          <span>{activity.startTime}</span>
                        )}
                      </div>
                      
                      {activity.latitude && activity.longitude && (
                        <div className="mt-2 text-xs text-blue-600">
                          Coordinates: {activity.latitude.toFixed(4)}, {activity.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin size={32} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 mb-2">No activities with locations</p>
                  <p className="text-sm text-gray-400">
                    Add locations to activities to see them on the map
                  </p>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 rounded-2xl shadow-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Map Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Add latitude/longitude to activities for precise mapping</li>
                <li>• Include location names for better context</li>
                <li>• Consider integrating with mapping services</li>
                <li>• Plan routes between activity locations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripMap;