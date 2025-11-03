import { io, Socket } from 'socket.io-client';

// Dynamic URLs based on environment
const getApiBaseUrl = () => {
  // Use environment variable in production
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Use relative path if no env var (for production with same domain)
  if (import.meta.env.PROD) {
    return '/api';
  }
  // Fallback to localhost in development
  return 'http://localhost:5000/api';
};

const getSocketUrl = () => {
  // Use environment variable in production
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }
  // Use same origin if no env var (for production with same domain)
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  // Fallback to localhost in development
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();
const SOCKET_URL = getSocketUrl();

class ApiService {
  private socket: Socket | null = null;

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log('🌐 API Request:', url); // Debug log
      
      const response = await fetch(url, config);
      
      // Handle 204 No Content responses
      if (response.status === 204) {
        return { message: 'Success' };
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Request details:', { endpoint, API_BASE_URL });
      throw error;
    }
  }

  // Auth methods
  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Trip methods
  async createTrip(tripData: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    description?: string;
    budget?: number;
  }) {
    return this.request('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  }

  async getTrips() {
    return this.request('/trips');
  }

  async getTrip(tripId: string) {
    return this.request(`/trips/${tripId}`);
  }

  // Expense methods for TripDetails
  async getTripExpenses(tripId: string) {
    return this.request(`/trips/${tripId}/expenses`);
  }

  async getTripMembers(tripId: string) {
    return this.request(`/trips/${tripId}/members`);
  }

  // Update trip method
  async updateTrip(tripId: string, tripData: any) {
    return this.request(`/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify(tripData),
    });
  }

  // Delete trip method
  async deleteTrip(tripId: string) {
    return this.request(`/trips/${tripId}`, {
      method: 'DELETE',
    });
  }

  // Leave trip method
  async leaveTrip(tripId: string) {
    return this.request(`/trips/${tripId}/leave`, {
      method: 'POST',
    });
  }

  // Remove member from trip method
  async removeTripMember(tripId: string, memberId: string) {
    return this.request(`/trips/${tripId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Activities methods
  async createActivity(tripId: string, activityData: {
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    description?: string;
    cost?: number;
    category?: string;
  }) {
    return this.request(`/trips/${tripId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  async getTripActivities(tripId: string) {
    return this.request(`/trips/${tripId}/activities`);
  }

  async getAllUserActivities() {
    return this.request('/users/activities');
  }

  // Update activity method
  async updateActivity(tripId: string, activityId: string, activityData: any) {
    return this.request(`/trips/${tripId}/activities/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(activityData),
    });
  }

  // Delete activity method
  async deleteActivity(tripId: string, activityId: string) {
    return this.request(`/trips/${tripId}/activities/${activityId}`, {
      method: 'DELETE',
    });
  }

  // Expenses methods
  async createExpense(tripId: string, expenseData: {
    description: string;
    amount: number;
    category?: string;
    date?: string;
    splits: Array<{ userId: string; amount: number }>;
  }) {
    return this.request(`/trips/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  // Update expense method
  async updateExpense(tripId: string, expenseId: string, expenseData: any) {
    return this.request(`/trips/${tripId}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  // Delete expense method
  async deleteExpense(tripId: string, expenseId: string) {
    return this.request(`/trips/${tripId}/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Invitations
  async inviteToTrip(tripId: string, email: string) {
    return this.request(`/trips/${tripId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getInvitations() {
    return this.request('/users/invitations');
  }

  async respondToInvitation(invitationId: string, action: 'accept' | 'decline') {
    return this.request(`/users/invitations/${invitationId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  // User management
  async updateProfile(userData: {
    name?: string;
    avatar?: string;
    email?: string;
  }) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Notifications
  async getNotifications() {
    return this.request('/users/notifications');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/users/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/users/notifications/read-all', {
      method: 'POST',
    });
  }

  // File upload
  async uploadFile(file: File, tripId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (tripId) {
      formData.append('tripId', tripId);
    }

    const token = localStorage.getItem('token');
    const uploadUrl = `${API_BASE_URL}/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'File upload failed');
    }

    return response.json();
  }

  // Search and filtering
  async searchTrips(query: string) {
    return this.request(`/trips/search?q=${encodeURIComponent(query)}`);
  }

  async getTripsByDestination(destination: string) {
    return this.request(`/trips/destination/${encodeURIComponent(destination)}`);
  }

  // Analytics and reports
  async getTripAnalytics(tripId: string) {
    return this.request(`/trips/${tripId}/analytics`);
  }

  async getUserTravelStats() {
    return this.request('/users/travel-stats');
  }

  // Socket.io methods
  connectSocket() {
    if (!this.socket) {
      console.log('🔌 Connecting socket to:', SOCKET_URL); // Debug log
      this.socket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem('token'),
        },
      });
    }
    return this.socket;
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get current API configuration (for debugging)
  getConfig() {
    return {
      API_BASE_URL,
      SOCKET_URL,
      isProduction: import.meta.env.PROD,
      hasEnvVar: !!import.meta.env.VITE_API_URL
    };
  }

  // Error handling wrapper
  async withErrorHandling<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
      return await apiCall();
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        throw new Error(`Unable to connect to server at ${API_BASE_URL}. Please check your connection.`);
      }
      
      if (error.message?.includes('401')) {
        // Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }

      if (error.message?.includes('403')) {
        throw new Error('You do not have permission to perform this action.');
      }

      if (error.message?.includes('404')) {
        throw new Error('The requested resource was not found.');
      }

      // Re-throw the original error if no specific handling
      throw error;
    }
  }
}

export const apiService = new ApiService();