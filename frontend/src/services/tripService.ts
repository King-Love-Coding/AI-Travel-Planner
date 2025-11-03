import { apiService } from './api';

export const tripService = {
  async createNewTrip(tripData: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    description?: string;
    budget?: number;
  }) {
    return apiService.createTrip(tripData);
  },

  async uploadTripImage(tripId: string, imageFile: File) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`http://localhost:5000/api/trips/${tripId}/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    return response.json();
  }
};