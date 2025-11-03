import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { 
  ArrowLeft, 
  Edit, 
  Share, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Image,
  Loader,
  Trash2,
  LogOut
} from 'lucide-react';

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  budget?: number;
  image?: string;
  members?: any[];
  activities?: any[];
  expenses?: any[];
  status?: 'PLANNING' | 'ONGOING' | 'COMPLETED';
  createdBy?: string;
}

const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Safe getTripImage function with error handling
  const getTripImage = (destination: string | undefined): string => {
    if (!destination) {
      return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    }

    const images: { [key: string]: string } = {
      'Paris': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Tokyo': 'https://images.unsplash.com/photo-1540959733332-7d6a7f97b7b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Bali': 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Italy': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Spain': 'https://images.unsplash.com/photo-1543785734-4b6e564642f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Jaisalmer': 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/29/7a/20/74/desert-safari-with-quad.jpg?w=700&h=-1&s=1',
      'Rajasthan': 'https://images.unsplash.com/photo-1588410160981-64c016b49b9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    };
    
    try {
      const matchedKey = Object.keys(images).find(key => 
        destination.toLowerCase().includes(key.toLowerCase())
      );
      
      return matchedKey ? images[matchedKey] : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    } catch (error) {
      console.error('Error in getTripImage:', error);
      return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    }
  };

  // Add getTripStatus function (same as Trips page)
  const getTripStatus = (startDate: string, endDate: string): 'PLANNING' | 'ONGOING' | 'COMPLETED' => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return 'PLANNING';
    if (now > end) return 'COMPLETED';
    return 'ONGOING';
  };

  const fetchTripDetails = async () => {
    if (!tripId || !user) return;
    
    try {
      setError('');
      console.log('🔄 Fetching trip details for ID:', tripId);
      
      // First get the basic trip data
      const response = await apiService.getTrip(tripId);
      console.log('📦 Full API response:', response);
      
      // Handle different response formats
      let tripData = response;
      
      // If response has nested trip data (common in APIs)
      if (response.trip) {
        tripData = response.trip;
      } else if (response.data) {
        tripData = response.data;
      }
      
      console.log('📋 Processed trip data:', tripData);
      
      // Validate required fields
      if (!tripData) {
        throw new Error('No trip data received from server');
      }

      if (!tripData.id || !tripData.name) {
        throw new Error('Invalid trip data: missing required fields (id or name)');
      }

      // Initialize with basic trip data - with safe defaults
      const tripDetails: Trip = {
        ...tripData,
        // Add status and image handling with safe defaults
        status: getTripStatus(tripData.startDate || new Date().toISOString(), tripData.endDate || new Date().toISOString()),
        image: tripData.image || getTripImage(tripData.destination),
        destination: tripData.destination || 'Unknown Destination',
        name: tripData.name || 'Unnamed Trip',
        startDate: tripData.startDate || new Date().toISOString(),
        endDate: tripData.endDate || new Date().toISOString(),
        members: tripData.members || [], // Use members from trip data if available
        activities: tripData.activities || [], // Use activities from trip data if available
        expenses: tripData.expenses || [] // Use expenses from trip data if available
      };

      console.log('✅ Final trip details:', tripDetails);

      // Try to fetch additional data, but don't fail if these requests fail
      // Since these endpoints don't exist yet, we'll skip them for now
      console.log('ℹ️ Skipping additional API calls as endpoints are not available');

      setTrip(tripDetails);
    } catch (error: any) {
      console.error('❌ Failed to fetch trip details:', error);
      setError(error.message || 'Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [tripId, user]);

  // Add missing functions
  const handleDeleteTrip = async () => {
    if (!tripId || !window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return;
    
    try {
      await apiService.deleteTrip(tripId);
      navigate('/trips');
    } catch (error: any) {
      alert('Failed to delete trip: ' + error.message);
    }
  };

  const handleLeaveTrip = async () => {
    if (!tripId || !window.confirm('Are you sure you want to leave this trip?')) return;
    
    try {
      await apiService.leaveTrip(tripId);
      navigate('/trips');
    } catch (error: any) {
      alert('Failed to leave trip: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ONGOING': return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'Planning';
      case 'ONGOING': return 'Ongoing';
      case 'COMPLETED': return 'Completed';
      default: return status || 'Unknown';
    }
  };

  const getDaysLeft = (endDate: string) => {
    try {
      const end = new Date(endDate);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      return 0;
    }
  };

  // Safe calculation functions
  const calculateTotalExpenses = (expenses: any[] | undefined): number => {
    if (!expenses || !Array.isArray(expenses)) return 0;
    return expenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);
  };

  const calculateRemainingBudget = (budget: number | undefined, expenses: any[] | undefined): number => {
    const totalExpenses = calculateTotalExpenses(expenses);
    return (budget || 0) - totalExpenses;
  };

  const getBudgetUsagePercentage = (budget: number | undefined, expenses: any[] | undefined): number => {
    const totalExpenses = calculateTotalExpenses(expenses);
    if (!budget || budget === 0) return 0;
    return Math.min(100, (totalExpenses / budget) * 100);
  };

  const isTripOwner = trip?.createdBy === user?.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-200">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Trip not found</h3>
            <p className="text-red-600 mb-4">{error || 'The trip you are looking for does not exist.'}</p>
            <p className="text-gray-500 text-sm mb-6">
              Trip ID: {tripId}<br />
              Please check the browser console for more details.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => navigate('/trips')}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                View All Trips
              </button>
              <button
                onClick={fetchTripDetails}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(trip.endDate);
  const progress = trip.status === 'COMPLETED' ? 100 : 
                  trip.status === 'ONGOING' ? 50 : 25;

  const totalExpenses = calculateTotalExpenses(trip.expenses);
  const remainingBudget = calculateRemainingBudget(trip.budget, trip.expenses);
  const budgetUsagePercentage = getBudgetUsagePercentage(trip.budget, trip.expenses);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{trip.name}</h1>
                <p className="text-gray-600 flex items-center gap-1">
                  <MapPin size={16} />
                  {trip.destination}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(trip.status || 'PLANNING')}`}>
                {getStatusText(trip.status || 'PLANNING')}
              </span>
              
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Share size={20} />
              </button>
              
              {isTripOwner ? (
                <>
                  <Link
                    to={`/trips/${tripId}/edit`}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit size={20} />
                  </Link>
                  <button
                    onClick={handleDeleteTrip}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLeaveTrip}
                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  title="Leave trip"
                >
                  <LogOut size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trip Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-64 bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                {trip.image ? (
                  <img 
                    src={trip.image} 
                    alt={trip.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-center">
                    <Image size={48} className="mx-auto mb-2 opacity-80" />
                    <p className="text-lg">No image available</p>
                  </div>
                )}
              </div>
              
              {/* Quick Stats */}
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{daysLeft}</div>
                  <div className="text-gray-600 text-sm">Days Left</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {(trip.members && Array.isArray(trip.members)) ? trip.members.length : 0}
                  </div>
                  <div className="text-gray-600 text-sm">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {(trip.activities && Array.isArray(trip.activities)) ? trip.activities.length : 0}
                  </div>
                  <div className="text-gray-600 text-sm">Activities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-gray-600 text-sm">Spent</div>
                </div>
              </div>
            </div>

            {/* Description */}
            {trip.description && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{trip.description}</p>
              </div>
            )}

            {/* Progress */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Trip Progress</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="text-gray-900 font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {/* Budget Progress */}
                {trip.budget && (
                  <>
                    <div className="flex justify-between text-sm mt-6">
                      <span className="text-gray-600">Budget Usage</span>
                      <span className="text-gray-900 font-medium">
                        ${totalExpenses.toLocaleString()} / ${trip.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${budgetUsagePercentage}%` }}
                      ></div>
                    </div>
                    <div className={`font-medium text-sm ${
                      remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      💰 ${Math.abs(remainingBudget).toLocaleString()} {remainingBudget >= 0 ? 'remaining' : 'over budget'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Details */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to={`/trips/${tripId}/expenses`}
                  className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors group"
                >
                  <DollarSign size={20} />
                  <span className="font-medium">Manage Expenses</span>
                </Link>
                
                <Link
                  to={`/trips/${tripId}/activities`}
                  className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors group"
                >
                  <Calendar size={20} />
                  <span className="font-medium">Plan Activities</span>
                </Link>
                
                <Link
                  to={`/trips/${tripId}/invite`}
                  className="flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors group"
                >
                  <Users size={20} />
                  <span className="font-medium">Invite Friends</span>
                </Link>
                
                <Link
                  to={`/trips/${tripId}/map`}
                  className="flex items-center gap-3 p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors group"
                >
                  <MapPin size={20} />
                  <span className="font-medium">View Map</span>
                </Link>
              </div>
            </div>

            {/* Trip Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Trip Details</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Dates</p>
                    <p className="text-gray-900 font-medium">
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="text-gray-900 font-medium">{trip.destination}</p>
                  </div>
                </div>
                
                {trip.budget && (
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Total Budget</p>
                      <p className="text-gray-900 font-medium">${trip.budget.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Members */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Members ({(trip.members && Array.isArray(trip.members)) ? trip.members.length : 0})
              </h2>
              <div className="space-y-3">
                {trip.members && Array.isArray(trip.members) && trip.members.length > 0 ? (
                  trip.members.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {member.name?.charAt(0) || member.email?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate">
                          {member.name || 'Unknown User'}
                        </p>
                        <p className="text-gray-500 text-sm truncate">
                          {member.email || 'No email'}
                        </p>
                      </div>
                      {member.id === trip.createdBy && (
                        <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded whitespace-nowrap">
                          Owner
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No members yet</p>
                    <Link 
                      to={`/trips/${tripId}/invite`}
                      className="text-blue-500 hover:text-blue-600 text-sm mt-2 inline-block"
                    >
                      Invite friends
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetails;