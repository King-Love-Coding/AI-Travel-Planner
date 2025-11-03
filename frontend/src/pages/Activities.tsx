import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface Activity {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  description?: string;
  cost?: number;
  category: string;
}

const Activities: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    cost: '',
    category: 'sightseeing'
  });

  useEffect(() => {
    if (tripId) {
      fetchActivities();
    }
  }, [tripId]);

  const fetchActivities = async () => {
    try {
      const response = await apiService.getTripActivities(tripId!);
      const activitiesData = response.activities || response.data || response;
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId) return;

    setIsSubmitting(true);
    try {
      const activityData = {
        title: formData.title,
        date: formData.date,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        location: formData.location,
        description: formData.description || undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        category: formData.category
      };

      await apiService.createActivity(tripId, activityData);
      
      // Reset form and refresh activities
      setFormData({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
        cost: '',
        category: 'sightseeing'
      });
      setShowForm(false);
      fetchActivities(); // Refresh the list
      
    } catch (error) {
      console.error('Failed to create activity:', error);
      alert('Failed to create activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const categories = [
    { value: 'sightseeing', label: '🏛️ Sightseeing', color: 'blue' },
    { value: 'food', label: '🍽️ Food & Dining', color: 'green' },
    { value: 'adventure', label: '🏔️ Adventure', color: 'orange' },
    { value: 'shopping', label: '🛍️ Shopping', color: 'purple' },
    { value: 'relaxation', label: '🏖️ Relaxation', color: 'yellow' },
    { value: 'transport', label: '🚗 Transport', color: 'gray' },
    { value: 'accommodation', label: '🏨 Accommodation', color: 'indigo' },
    { value: 'other', label: '📝 Other', color: 'slate' }
  ];

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Trip Activities</h1>
            <p className="text-gray-600">Plan and organize your daily activities</p>
          </div>
          
          {/* Only show the main Add Activity button if there ARE activities */}
          {activities.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              <span>Add Activity</span>
            </button>
          )}
        </div>

        {/* Add Activity Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Activity</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Visit Eiffel Tower"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Eiffel Tower, Paris"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Cost
                    </label>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add details about this activity..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Activity'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Activities List */}
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((activity) => {
                const category = categories.find(cat => cat.value === activity.category);
                return (
                  <div
                    key={activity.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {category?.label.split(' ')[0]}
                          </span>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {activity.title}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span>
                              {new Date(activity.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          {activity.startTime && (
                            <div className="flex items-center gap-2">
                              <span>⏰</span>
                              <span>
                                {formatTime(activity.startTime)}
                                {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span>{activity.location}</span>
                          </div>
                          
                          {activity.cost && (
                            <div className="flex items-center gap-2">
                              <span>💰</span>
                              <span>${activity.cost.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        
                        {activity.description && (
                          <p className="mt-3 text-gray-700">{activity.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No activities yet</h3>
              <p className="text-gray-600 mb-6">Start planning your trip by adding activities!</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Your First Activity
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Activities;