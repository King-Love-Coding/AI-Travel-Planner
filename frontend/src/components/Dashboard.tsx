import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Users, DollarSign, MapPin, ArrowRight, TrendingUp, Clock, Activity } from 'lucide-react';
import '../index.css';

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  dates: string;
  description?: string;
  budget?: number;
  image?: string;
  members: any[];
  activities: any[];
  expenses: any[];
  progress: number;
  daysLeft: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
}

interface QuickStats {
  activeTrips: number;
  travelBuddies: number;
  activities: number;
  totalBudget: number;
  upcomingActivities: number;
}

const Dashboard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    activeTrips: 0,
    travelBuddies: 0,
    activities: 0,
    totalBudget: 0,
    upcomingActivities: 0
  });
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: '🗺️',
      title: 'Interactive Maps',
      description: 'Pin locations and discover places together in real-time.',
      color: 'from-blue-500 to-cyan-500',
      gradient: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    },
    {
      icon: '💸',
      title: 'Expense Sharing',
      description: 'Automatically split costs and track who owes what.',
      color: 'from-green-500 to-emerald-500',
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-500'
    },
    {
      icon: '⚡',
      title: 'Live Collaboration',
      description: 'See changes instantly as your friends plan with you.',
      color: 'from-purple-500 to-pink-500',
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-500'
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setIsLoadingTrips(true);
      
      // Fetch user's trips
      const tripsResponse = await apiService.getTrips();
      const trips = tripsResponse.trips || tripsResponse.data || tripsResponse;
      
      if (!Array.isArray(trips)) {
        console.error('Unexpected trips response format:', tripsResponse);
        setUserTrips([]);
        setUpcomingActivities([]);
        return;
      }

      // Fetch activities for each trip in parallel
      const tripsWithActivities = await Promise.all(
        trips.map(async (trip: any) => {
          try {
            const activitiesResponse = await apiService.getTripActivities(trip.id);
            const activities = activitiesResponse.activities || activitiesResponse.data || activitiesResponse;
            
            return {
              ...trip,
              activities: Array.isArray(activities) ? activities : []
            };
          } catch (error) {
            console.error(`Failed to fetch activities for trip ${trip.id}:`, error);
            return {
              ...trip,
              activities: []
            };
          }
        })
      );

      // Transform trips for UI
      const transformedTrips = tripsWithActivities.map((trip: any) => {
        const status = getTripStatus(trip.startDate, trip.endDate);
        return {
          id: trip.id,
          name: trip.name,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          dates: `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`,
          description: trip.description,
          budget: trip.budget,
          image: getDefaultImage(trip.destination),
          members: trip.members || [],
          activities: trip.activities || [],
          expenses: trip.expenses || [],
          progress: calculateTripProgress(trip),
          daysLeft: calculateDaysLeft(trip.startDate),
          status
        };
      });

      setUserTrips(transformedTrips);
      const upcoming = getUpcomingActivities(transformedTrips);
      setUpcomingActivities(upcoming);
      
      // Update quick stats with real data
      setQuickStats({
        activeTrips: trips.length,
        travelBuddies: calculateTotalTravelBuddies(trips),
        activities: calculateTotalActivities(tripsWithActivities),
        totalBudget: calculateTotalBudget(trips),
        upcomingActivities: upcoming.length
      });

    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setUserTrips([]);
      setUpcomingActivities([]);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  const getTripStatus = (startDate: string, endDate: string): 'UPCOMING' | 'ONGOING' | 'COMPLETED' => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return 'UPCOMING';
    if (now > end) return 'COMPLETED';
    return 'ONGOING';
  };

  const getDefaultImage = (destination: string) => {
    const images: { [key: string]: string } = {
      'Paris': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Tokyo': 'https://images.unsplash.com/photo-1540959733332-7d6a7f97b7b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'France': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Japan': 'https://images.unsplash.com/photo-1540959733332-7d6a7f97b7b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Bali': 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Italy': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Spain': 'https://images.unsplash.com/photo-1543785734-4b6e564642f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Jaisalmer': 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/29/7a/20/74/desert-safari-with-quad.jpg?w=700&h=-1&s=1',
      'Rajasthan': 'https://images.unsplash.com/photo-1588410160981-64c016b49b9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    };
    
    const matchedKey = Object.keys(images).find(key => 
      destination.toLowerCase().includes(key.toLowerCase())
    );
    
    return matchedKey ? images[matchedKey] : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
  };

  const calculateTripProgress = (trip: any) => {
    let progress = 0;
    if (trip.activities?.length > 0) progress += 40;
    if (trip.expenses?.length > 0) progress += 30;
    if (trip.members?.length > 1) progress += 30;
    return Math.min(progress, 100);
  };

  const calculateDaysLeft = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  const calculateTotalTravelBuddies = (trips: any[]) => {
    const uniqueBuddies = new Set();
    trips.forEach(trip => {
      trip.members?.forEach((member: any) => {
        if (member.user?.id !== user?.id && (member.status === 'ACCEPTED' || member.status === 'active')) {
          uniqueBuddies.add(member.user?.id || member.userId);
        }
      });
    });
    return uniqueBuddies.size;
  };

  const calculateTotalActivities = (trips: any[]) => {
    return trips.reduce((total, trip) => total + (trip.activities?.length || 0), 0);
  };

  const calculateTotalBudget = (trips: any[]) => {
    return trips.reduce((total, trip) => total + (trip.budget || 0), 0);
  };

  const getUpcomingActivities = (trips: Trip[]) => {
    const allActivities: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    trips.forEach(trip => {
      if (trip.activities && trip.activities.length > 0) {
        trip.activities.forEach((activity: any) => {
          try {
            const activityDate = new Date(activity.date || activity.startDate || activity.createdAt);
            activityDate.setHours(0, 0, 0, 0);
            
            if (activityDate >= today) {
              allActivities.push({
                id: activity.id || `${trip.id}-${activity.title}-${activity.date}`,
                name: activity.title || activity.name || 'Untitled Activity',
                date: activityDate,
                formattedDate: activityDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                }),
                time: activity.startTime ? 
                  new Date(`1970-01-01T${activity.startTime}`).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  }) : 'All day',
                location: activity.location || trip.destination,
                tripName: trip.name,
                tripId: trip.id,
                category: activity.category || 'General'
              });
            }
          } catch (error) {
            console.error('Error processing activity:', activity, error);
          }
        });
      }
    });
    
    return allActivities
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3);
  };

  const handleCreateTrip = () => {
    if (user) {
      navigate('/trips/new');
    } else {
      navigate('/signup');
    }
  };

  const handleTripClick = (tripId: string) => {
    navigate(`/trips/${tripId}`);
  };

  const handleActivityClick = (tripId: string) => {
    navigate(`/trips/${tripId}/activities`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-100 text-blue-800';
      case 'ONGOING': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UPCOMING': return '📅';
      case 'ONGOING': return '✈️';
      case 'COMPLETED': return '✅';
      default: return '📁';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Update the loading state to include trips loading
  if (isLoading || (user && isLoadingTrips)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading your adventures...</p>
        </div>
      </div>
    );
  }

  // User is authenticated - Show personalized dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full blur-3xl opacity-30"
            animate={{
              scale: [1.1, 1, 1.1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>

        {/* Personalized Dashboard */}
        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-gray-600 text-lg">Ready to continue planning your next adventure?</p>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
          >
            {[
              { 
                icon: MapPin, 
                value: quickStats.activeTrips, 
                label: 'Active Trips', 
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200'
              },
              { 
                icon: Users, 
                value: quickStats.travelBuddies, 
                label: 'Travel Buddies', 
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200'
              },
              { 
                icon: Activity, 
                value: quickStats.activities, 
                label: 'Activities', 
                color: 'text-purple-600',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200'
              },
              { 
                icon: DollarSign, 
                value: `$${quickStats.totalBudget.toLocaleString()}`, 
                label: 'Total Budget', 
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200'
              },
              { 
                icon: Calendar, 
                value: quickStats.upcomingActivities, 
                label: 'Upcoming', 
                color: 'text-cyan-600',
                bgColor: 'bg-cyan-50',
                borderColor: 'border-cyan-200'
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -2 }}
                className={`${stat.bgColor} ${stat.borderColor} border rounded-2xl p-4 backdrop-blur-sm transition-all duration-300`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-600 text-sm">{stat.label}</div>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Your Trips Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Trips</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/trips/new')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg flex items-center gap-2"
                >
                  <Plus size={16} />
                  New Trip
                </motion.button>
              </div>
              <div className="space-y-4">
                <AnimatePresence>
                  {userTrips.length > 0 ? (
                    userTrips.map((trip, index) => (
                      <motion.div
                        key={trip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100"
                        onClick={() => handleTripClick(trip.id)}
                      >
                        <div className="h-32 overflow-hidden relative">
                          <motion.img
                            src={trip.image}
                            alt={trip.destination}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            whileHover={{ scale: 1.1 }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                              {getStatusIcon(trip.status)} {trip.status.toLowerCase()}
                            </span>
                          </div>
                          
                          {/* Info Badges */}
                          <div className="absolute top-3 right-3 flex flex-col gap-1">
                            <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs backdrop-blur-sm">
                              {trip.daysLeft}d left
                            </div>
                            <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs backdrop-blur-sm">
                              {trip.members.length} 👥
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">{trip.name}</h3>
                            {trip.budget && (
                              <span className="text-sm font-semibold text-green-600">
                                ${trip.budget.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3 flex items-center gap-2">
                            <MapPin size={14} />
                            {trip.destination} • {trip.dates}
                          </p>
                          
                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Trip Progress</span>
                              <span className="font-semibold text-gray-900">{trip.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${trip.progress}%` }}
                                transition={{ duration: 1, delay: index * 0.2 }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{trip.activities.length} activities</span>
                              <span>{trip.expenses.length} expenses</span>
                            </div>
                            <motion.button 
                              whileHover={{ x: 5 }}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                            >
                              Continue
                              <ArrowRight size={14} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12 bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-200"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🌍</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips yet</h3>
                      <p className="text-gray-600 mb-6">Start planning your first adventure!</p>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/trips/new')}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
                      >
                        Create Your First Trip
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Upcoming Activities */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar size={20} />
                    Upcoming Activities
                  </h3>
                  {upcomingActivities.length > 0 && (
                    <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                      {upcomingActivities.length} upcoming
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {upcomingActivities.length > 0 ? (
                    upcomingActivities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.6 }}
                        whileHover={{ x: 5, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                        className="flex items-start gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer border border-gray-100"
                        onClick={() => handleActivityClick(activity.tripId)}
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{activity.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <span>{activity.formattedDate}</span>
                            {activity.time !== 'All day' && (
                              <>
                                <span>•</span>
                                <span>{activity.time}</span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                            <MapPin size={12} />
                            <span>{activity.location}</span>
                            <span>•</span>
                            <span>{activity.tripName}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-gray-500"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-2">No upcoming activities</p>
                      <p className="text-sm text-gray-400 mb-4">Activities you add will appear here</p>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/trips')}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Add Activities
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '➕', label: 'New Trip', action: () => navigate('/trips/new') },
                    { icon: '👥', label: 'Invite', action: () => userTrips.length > 0 ? navigate(`/trips/${userTrips[0].id}/invite`) : navigate('/trips/new') },
                    { icon: '💸', label: 'Expenses', action: () => userTrips.length > 0 ? navigate(`/trips/${userTrips[0].id}/expenses`) : navigate('/trips/new') },
                    { icon: '🎯', label: 'Activities', action: () => userTrips.length > 0 ? navigate(`/trips/${userTrips[0].id}/activities`) : navigate('/trips/new') }
                  ].map((action, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={action.action}
                      className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all duration-300 group"
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                        {action.icon}
                      </div>
                      <div className="text-sm font-medium">{action.label}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Floating Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCreateTrip}
            className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:shadow-3xl transition-all duration-300 group relative"
          >
            <Plus size={24} />
            <div className="absolute -top-12 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-lg">
              Create Trip
              <div className="absolute -bottom-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // User is not authenticated - Show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full blur-3xl opacity-20 animate-pulse delay-500"></div>
      </div>

      {/* Hero Section */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-6">
            Plan Your Next
            <span className="block bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              Adventure Together
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Collaborate with friends on trip planning, share expenses, and create unforgettable memories with our all-in-one travel platform.
          </p>
        </div>

        {/* Demo Trip Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Demo Trip 1 */}
          <div className={`bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group hover:scale-105 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`} style={{ transitionDelay: '200ms' }}>
            <div className="h-48 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Paris, France"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                3 members
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Paris 2024 Adventure</h3>
              <p className="text-gray-600 mb-2 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Paris, France
              </p>
              <p className="text-gray-500 text-sm">Aug 15-22, 2024</p>
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full -ml-2"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full -ml-2"></div>
                </div>
                <Link 
                  to="/signup"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
                >
                  Join Trip
                </Link>
              </div>
            </div>
          </div>

          {/* Demo Trip 2 */}
          <div className={`bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group hover:scale-105 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`} style={{ transitionDelay: '400ms' }}>
            <div className="h-48 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1540959733332-7d6a7f97b7b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Tokyo, Japan"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                2 members
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tokyo Exploration</h3>
              <p className="text-gray-600 mb-2 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Tokyo, Japan
              </p>
              <p className="text-gray-500 text-sm">Dec 10-20, 2024</p>
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full -ml-2"></div>
                </div>
                <Link 
                  to="/signup"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
                >
                  Join Trip
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Create New Trip Card */}
        <div className={`max-w-4xl mx-auto mb-16 transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-8 text-center text-white shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <span className="text-3xl">✨</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Ready to Start Your Journey?</h3>
            <p className="text-blue-100 mb-6">Create your first trip and invite your travel buddies</p>
            <Link 
              to="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-lg inline-block"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`text-center p-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 group ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${800 + index * 200}ms` }}
            >
              <div className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className={`max-w-4xl mx-auto mt-16 text-center transition-all duration-1000 delay-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">500+</div>
              <div className="text-gray-600">Trips Planned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">2K+</div>
              <div className="text-gray-600">Happy Travelers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">50+</div>
              <div className="text-gray-600">Countries</div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button for NON-AUTHENTICATED users */}
      <div className="fixed bottom-8 right-8">
        <Link 
          to="/signup"
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group"
        >
          <span className="text-xl">+</span>
          <div className="absolute -top-12 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Get Started
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;