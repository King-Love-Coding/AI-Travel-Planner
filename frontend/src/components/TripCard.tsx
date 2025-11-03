import React from 'react';
import { Link } from 'react-router-dom';

interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  budget?: number;
  image?: string;
  members?: any[]; // Change from number to any[]
  progress?: number;
  daysLeft?: number;
  // Add any other fields your API returns
}

interface TripCardProps {
  trip: Trip;
}

const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };

  // Default image if no image provided
  const getDefaultImage = (destination: string) => {
    const destinationImages: { [key: string]: string } = {
      'Jaisalmer': 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/29/7a/20/74/desert-safari-with-quad.jpg?w=700&h=-1&s=1',
      'Rajasthan': 'https://images.unsplash.com/photo-1588410160981-64c016b49b9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Paris': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Tokyo': 'https://images.unsplash.com/photo-1540959733332-7d6a7f97b7b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Bali': 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    };
    
    return destinationImages[destination] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
  };

  // Calculate member count from array
  const getMemberCount = (): number => {
    if (!trip.members) return 0;
    return Array.isArray(trip.members) ? trip.members.length : trip.members;
  };

  const tripImage = trip.image || getDefaultImage(trip.destination);
  const memberCount = getMemberCount();

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105 border border-gray-100">
      {/* Image Section */}
      <div className="h-48 overflow-hidden relative">
        <img
          src={tripImage}
          alt={trip.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Overlay with trip info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Days left badge */}
        {trip.daysLeft && (
          <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {trip.daysLeft} days left
          </div>
        )}

        {/* Member count badge */}
        {memberCount > 0 && (
          <div className="absolute top-3 left-3 bg-white/90 text-gray-700 px-2 py-1 rounded-full text-sm backdrop-blur-sm flex items-center gap-1">
            <span>👥</span>
            <span>{memberCount}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{trip.name}</h3>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {trip.destination}
            </p>
          </div>
        </div>

        {/* Dates */}
        <p className="text-gray-500 text-sm mb-4 flex items-center gap-2">
          <span>📅</span>
          <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
        </p>

        {/* Progress Bar */}
        {trip.progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Trip Progress</span>
              <span className="text-gray-900 font-medium">{trip.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${trip.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Budget */}
        {trip.budget && (
          <p className="text-green-600 font-medium mb-4 text-sm">
            💰 Budget: ${trip.budget.toLocaleString()}
          </p>
        )}

        {/* Description */}
        {trip.description && (
          <p className="text-gray-700 mb-4 line-clamp-2 text-sm">{trip.description}</p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <Link 
            to={`/trips/${trip.id}`}
            className="flex-1 bg-blue-500 text-white text-center py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            View Details
          </Link>
          <Link 
            to={`/trips/${trip.id}/expenses`}
            className="flex-1 bg-green-500 text-white text-center py-2 px-3 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            Expenses
          </Link>
          <Link 
            to={`/trips/${trip.id}/activities`}
            className="flex-1 bg-purple-500 text-white text-center py-2 px-3 rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
          >
            Activities
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TripCard;