import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Mail, Users, UserCheck, UserX, Loader, Trash2, MoreVertical, X } from 'lucide-react';

interface Trip {
  id: string;
  name: string;
  destination: string;
  description?: string;
  ownerId?: string;
}

interface Member {
  id: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  userId?: string;
}

const InviteFriends: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchTripDetails = async () => {
    if (!tripId) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch trip data
      const tripData = await apiService.getTrip(tripId);
      setTrip(tripData);
      
      // Enhanced member fetching with better error handling
      let membersData: Member[] = await fetchMembersWithFallback(tripData);
      
      // Process members to handle missing user data
      const processedMembers = processMembersData(membersData);
      setMembers(processedMembers);
      
    } catch (error: any) {
      console.error('Failed to fetch trip details:', error);
      setError(error.message || 'Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced member fetching with multiple fallbacks
  const fetchMembersWithFallback = async (tripData: any): Promise<Member[]> => {
    try {
      // Try primary members endpoint
      if (apiService.getTripMembers) {
        const membersResponse = await apiService.getTripMembers(tripId!);
        return Array.isArray(membersResponse) 
          ? membersResponse 
          : membersResponse?.members || membersResponse?.data || [];
      }
    } catch (memberError) {
      console.warn('Primary members endpoint failed:', memberError);
    }

    // Fallback to trip data members
    if (tripData.members && Array.isArray(tripData.members)) {
      return tripData.members;
    }

    // Fallback to participants
    if (tripData.participants && Array.isArray(tripData.participants)) {
      return tripData.participants;
    }

    // Final fallback - empty array
    return [];
  };

  // Process members data to handle missing user information
  const processMembersData = (membersData: Member[]): Member[] => {
    return membersData.map(member => {
      // If member has user object but missing data, try to reconstruct
      if (member.user) {
        return {
          ...member,
          user: {
            id: member.user.id || member.id,
            name: member.user.name || member.name || 'Unknown User',
            email: member.user.email || member.email || 'No email',
            avatar: member.user.avatar
          }
        };
      }

      // If no user object, create one from available data
      return {
        ...member,
        user: {
          id: member.id,
          name: member.name || 'Unknown User',
          email: member.email || 'No email',
        }
      };
    });
  };

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tripId || !email.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    setIsInviting(true);
    setError('');
    setSuccess('');

    try {
      await apiService.inviteToTrip(tripId, email.trim());
      setSuccess(`Invitation sent to ${email.trim()} successfully!`);
      setEmail('');
      
      // Refresh members list to show new pending invitation
      setTimeout(() => {
        fetchTripDetails();
      }, 1000);
      
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      setError(error.message || 'Failed to send invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  // NEW: Remove member functionality
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!tripId || !window.confirm(`Are you sure you want to remove ${memberName} from this trip?`)) {
      return;
    }

    setIsRemoving(memberId);
    setError('');
    setActiveMenu(null);

    try {
      // Check if the API service has removeMember method
      if (apiService.removeTripMember) {
        await apiService.removeTripMember(tripId, memberId);
      } else {
        // Fallback: Use generic API call
        await apiService.delete(`/trips/${tripId}/members/${memberId}`);
      }

      setSuccess(`Member removed successfully!`);
      
      // Update local state immediately
      setMembers(prev => prev.filter(member => member.id !== memberId));
      
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      setError(error.message || 'Failed to remove member. Please try again.');
    } finally {
      setIsRemoving(null);
    }
  };

  // NEW: Check if current user can remove a member
  const canRemoveMember = (member: Member): boolean => {
    // User can remove themselves
    if (user?.id === member.user?.id || user?.id === member.userId) {
      return true;
    }

    // Trip owner can remove any member
    if (user?.id === trip?.ownerId) {
      return true;
    }

    // Admins can remove members (if you have role-based permissions)
    if (member.role === 'admin') {
      return false; // Prevent removing admins unless you're the owner
    }

    return false;
  };

  // NEW: Check if current user is trip owner
  const isTripOwner = (): boolean => {
    return user?.id === trip?.ownerId;
  };

  const getMemberDisplayName = (member: Member): string => {
    return member.user?.name || member.name || 'Unknown User';
  };

  const getMemberEmail = (member: Member): string => {
    return member.user?.email || member.email || 'No email';
  };

  const getMemberStatus = (member: Member): string => {
    return member.status || 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'invited':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'declined':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'active':
        return <UserCheck size={16} />;
      case 'pending':
      case 'invited':
        return <Mail size={16} />;
      case 'declined':
      case 'rejected':
        return <UserX size={16} />;
      default:
        return <Users size={16} />;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  if (!tripId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-200">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trip selected</h3>
            <p className="text-red-600 mb-6">Please select a valid trip to invite friends.</p>
            <button 
              onClick={() => navigate('/trips')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-all duration-300 w-full"
            >
              Back to Trips
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Invite Friends
            </h1>
            <p className="text-xl text-gray-600">
              Invite friends to join your trip
            </p>
          </div>
          <Link
            to={`/trips/${tripId}`}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Trip
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Invite Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                  </div>
                  <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                    <X size={16} />
                  </button>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    {success}
                  </div>
                  <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
                    <X size={16} />
                  </button>
                </div>
              )}

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter friend's email address
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="friend@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                        disabled={isInviting}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isInviting || !email.trim()}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap font-medium flex items-center gap-2"
                    >
                      {isInviting ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail size={18} />
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Trip Info */}
              {trip && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Trip Information</h3>
                  <p className="text-blue-800 font-medium">{trip.name}</p>
                  {trip.destination && (
                    <p className="text-blue-700 text-sm">📍 {trip.destination}</p>
                  )}
                  {trip.description && (
                    <p className="text-blue-600 text-sm mt-2">{trip.description}</p>
                  )}
                  {isTripOwner() && (
                    <p className="text-blue-600 text-sm mt-2 font-medium">👑 You are the trip owner</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Members List */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} />
                Trip Members ({members.length})
              </h3>
              
              {members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((member) => {
                    const displayName = getMemberDisplayName(member);
                    const memberEmail = getMemberEmail(member);
                    const status = getMemberStatus(member);
                    const canRemove = canRemoveMember(member);
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">
                              {displayName}
                              {user?.id === member.user?.id && (
                                <span className="ml-2 text-blue-600 text-xs">(You)</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {memberEmail}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                            <span className="capitalize">{status.toLowerCase()}</span>
                          </div>
                          
                          {/* Remove Button/Menu */}
                          {canRemove && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu(activeMenu === member.id ? null : member.id);
                                }}
                                disabled={isRemoving === member.id}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 disabled:opacity-50"
                              >
                                {isRemoving === member.id ? (
                                  <Loader size={16} className="animate-spin" />
                                ) : (
                                  <MoreVertical size={16} />
                                )}
                              </button>
                              
                              {activeMenu === member.id && (
                                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-32">
                                  <button
                                    onClick={() => handleRemoveMember(member.id, displayName)}
                                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 mb-2">No members yet</p>
                  <p className="text-sm text-gray-400">
                    Invite friends to join your trip
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 rounded-2xl shadow-lg p-6 border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                💡 Tips
              </h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li>• Friends will receive an email invitation</li>
                <li>• They can accept or decline the invitation</li>
                <li>• You can track invitation status here</li>
                <li>• Trip owners can manage all members</li>
                <li>• Click the menu icon (⋮) to remove members</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteFriends;