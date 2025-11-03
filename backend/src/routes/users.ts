import express from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
});

const respondToInvitationSchema = z.object({
  action: z.enum(['accept', 'decline'], {
    required_error: 'Action is required',
    invalid_type_error: 'Action must be either "accept" or "decline"',
  }),
});

// Helper function to safely access user ID
const getUserId = (req: AuthRequest): string => {
  if (!req.user?.userId) {
    throw new Error('User not authenticated');
  }
  return req.user.userId;
};

// Get user profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdTrips: true, // This matches your schema (was ownedTrips)
            tripMembers: {
              where: { status: 'ACCEPTED' }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Type-safe transformation
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        ownedTrips: user._count.createdTrips, // Updated to match schema
        joinedTrips: user._count.tripMembers,
        totalTrips: user._count.createdTrips + user._count.tripMembers,
      }
    };

    res.json({ 
      message: 'Profile retrieved successfully',
      user: userProfile 
    });
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Update user profile
router.put('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);
    const validatedData = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    // Handle Prisma errors (user not found, etc.)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user's trip invitations
router.get('/invitations', async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);

    const invitations = await prisma.tripMember.findMany({
      where: {
        userId: userId,
        status: 'PENDING'
      },
      include: {
        trip: {
          include: {
            owner: {
              select: { 
                id: true, 
                name: true, 
                avatar: true,
                email: true 
              }
            },
            _count: {
              select: {
                members: {
                  where: { status: 'ACCEPTED' }
                },
                activities: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Type-safe transformation
    const transformedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      status: invitation.status,
      role: invitation.role,
      createdAt: invitation.createdAt,
      trip: {
        id: invitation.trip.id,
        name: invitation.trip.name,
        destination: invitation.trip.destination,
        startDate: invitation.trip.startDate,
        endDate: invitation.trip.endDate,
        description: invitation.trip.description,
        budget: invitation.trip.budget,
        owner: invitation.trip.owner,
        stats: {
          members: invitation.trip._count.members,
          activities: invitation.trip._count.activities
        }
      }
    }));

    res.json({ 
      message: 'Invitations retrieved successfully',
      invitations: transformedInvitations,
      count: transformedInvitations.length
    });
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.error('Get invitations error:', error);
    res.status(500).json({ error: 'Failed to retrieve invitations' });
  }
});

// Accept/decline trip invitation
router.post('/invitations/:invitationId/respond', async (req: AuthRequest, res) => {
  try {
    const { invitationId } = req.params;
    const { action } = respondToInvitationSchema.parse(req.body);
    const userId = getUserId(req);

    // Find the invitation with trip details
    const invitation = await prisma.tripMember.findFirst({
      where: {
        id: invitationId,
        userId: userId,
        status: 'PENDING'
      },
      include: {
        trip: {
          include: {
            owner: {
              select: { 
                id: true, 
                name: true, 
                avatar: true,
                email: true 
              }
            }
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or already processed' });
    }

    // Update invitation status
    const updatedInvitation = await prisma.tripMember.update({
      where: { id: invitationId },
      data: {
        status: action === 'accept' ? 'ACCEPTED' : 'DECLINED'
      },
      include: {
        trip: {
          include: {
            owner: {
              select: { 
                id: true, 
                name: true, 
                avatar: true,
                email: true 
              }
            },
            members: {
              where: { status: 'ACCEPTED' },
              include: {
                user: {
                  select: { 
                    id: true, 
                    name: true, 
                    avatar: true 
                  }
                }
              }
            }
          }
        }
      }
    });

    const responseData = {
      message: `Invitation ${action}ed successfully`,
      invitation: {
        id: updatedInvitation.id,
        status: updatedInvitation.status,
        role: updatedInvitation.role,
        trip: {
          id: updatedInvitation.trip.id,
          name: updatedInvitation.trip.name,
          destination: updatedInvitation.trip.destination,
          owner: updatedInvitation.trip.owner,
          members: updatedInvitation.trip.members
        }
      }
    };

    res.json(responseData);
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    console.error('Respond to invitation error:', error);
    res.status(500).json({ error: 'Failed to process invitation' });
  }
});

// Get user's activities across all trips
router.get('/activities', async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);

    const activities = await prisma.activity.findMany({
      where: {
        trip: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId: userId, status: 'ACCEPTED' } } }
          ]
        }
      },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
            destination: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    res.json({
      message: 'Activities retrieved successfully',
      activities,
      count: activities.length
    });
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.error('Get user activities error:', error);
    res.status(500).json({ error: 'Failed to retrieve activities' });
  }
});

// Get user's upcoming trips
router.get('/trips/upcoming', async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);
    const today = new Date();

    const upcomingTrips = await prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId, status: 'ACCEPTED' } } }
        ],
        startDate: {
          gte: today
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true }
        },
        members: {
          where: { status: 'ACCEPTED' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        _count: {
          select: {
            activities: true,
            members: {
              where: { status: 'ACCEPTED' }
            }
          }
        }
      },
      orderBy: { startDate: 'asc' },
      take: 5
    });

    res.json({
      message: 'Upcoming trips retrieved successfully',
      trips: upcomingTrips,
      count: upcomingTrips.length
    });
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.error('Get upcoming trips error:', error);
    res.status(500).json({ error: 'Failed to retrieve upcoming trips' });
  }
});

export default router;