import express from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';

const router = express.Router();

// Validation schemas
const createTripSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(100, 'Trip name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  destination: z.string().min(1, 'Destination is required').max(100, 'Destination too long'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  budget: z.number().positive('Budget must be positive').optional(),
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

const updateTripSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(100, 'Trip name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  destination: z.string().min(1, 'Destination is required').max(100, 'Destination too long').optional(),
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  budget: z.number().positive('Budget must be positive').optional(),
});

const activitySchema = z.object({
  title: z.string().min(1, 'Activity title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  cost: z.number().positive('Cost must be positive').optional(),
  date: z.string().datetime('Invalid date'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  category: z.string().max(50, 'Category too long').optional(),
});

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().max(50, 'Category too long').optional(),
  date: z.string().datetime('Invalid date').optional(),
  splits: z.array(z.object({
    userId: z.string().uuid('Invalid user ID'),
    amount: z.number().positive('Split amount must be positive'),
  })).min(1, 'At least one split is required'),
}).refine(data => {
  const totalSplits = data.splits.reduce((sum, split) => sum + split.amount, 0);
  return Math.abs(totalSplits - data.amount) < 0.01; // Allow small floating point differences
}, {
  message: 'Sum of splits must equal total amount',
  path: ['splits'],
});

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Get all trips for user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId, status: 'ACCEPTED' } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true, email: true }
        },
        members: {
          where: { status: 'ACCEPTED' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true }
            }
          }
        },
        activities: {
          orderBy: { date: 'asc' },
          take: 3 // Limit activities in list view
        },
        _count: {
          select: {
            activities: true,
            members: {
              where: { status: 'ACCEPTED' }
            },
            expenses: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ 
      message: 'Trips retrieved successfully',
      trips,
      count: trips.length
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Failed to retrieve trips' });
  }
});

// Get single trip
router.get('/:tripId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId } = req.params;
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId, status: 'ACCEPTED' } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        activities: {
          orderBy: { date: 'asc' }
        },
        expenses: {
          include: {
            paidBy: {
              select: { id: true, name: true, avatar: true, email: true }
            },
            splits: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true, email: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Calculate trip statistics
    const totalExpenses = trip.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const memberBalances = calculateMemberBalances(trip.expenses);

    const tripWithStats = {
      ...trip,
      stats: {
        totalExpenses,
        memberBalances,
        activityCount: trip.activities.length,
        memberCount: trip.members.filter(m => m.status === 'ACCEPTED').length,
      }
    };

    res.json({ 
      message: 'Trip retrieved successfully',
      trip: tripWithStats
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Failed to retrieve trip' });
  }
});

// Create new trip
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validatedData = createTripSchema.parse(req.body);
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    const trip = await prisma.trip.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            role: 'OWNER',
            status: 'ACCEPTED'
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true }
            }
          }
        },
        _count: {
          select: {
            activities: true,
            members: true,
            expenses: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Trip created successfully',
      trip
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Update trip
router.put('/:tripId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId } = req.params;
    const validatedData = updateTripSchema.parse(req.body);
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Verify user is trip owner
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        ownerId: userId
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or you are not the owner' });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, avatar: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true }
            }
          }
        }
      }
    });

    res.json({
      message: 'Trip updated successfully',
      trip: updatedTrip
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    console.error('Update trip error:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// Delete trip
router.delete('/:tripId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId } = req.params;
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Verify user is trip owner
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        ownerId: userId
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or you are not the owner' });
    }

    // Use transaction to delete related records
    await prisma.$transaction([
      prisma.expenseSplit.deleteMany({
        where: { expense: { tripId } }
      }),
      prisma.expense.deleteMany({
        where: { tripId }
      }),
      prisma.activity.deleteMany({
        where: { tripId }
      }),
      prisma.tripMember.deleteMany({
        where: { tripId }
      }),
      prisma.trip.delete({
        where: { id: tripId }
      })
    ]);

    res.json({
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// Leave trip
router.post('/:tripId/leave', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId } = req.params;
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Verify user is a member but not the owner
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        ownerId: { not: userId }, // Cannot leave if owner
        members: { some: { userId: userId, status: 'ACCEPTED' } }
      }
    });

    if (!trip) {
      return res.status(404).json({ 
        error: 'Trip not found, you are the owner, or you are not a member' 
      });
    }

    await prisma.tripMember.deleteMany({
      where: {
        tripId,
        userId
      }
    });

    res.json({
      message: 'Successfully left the trip'
    });
  } catch (error) {
    console.error('Leave trip error:', error);
    res.status(500).json({ error: 'Failed to leave trip' });
  }
});

// Add activity to trip
router.post('/:tripId/activities', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId } = req.params;
    const validatedData = activitySchema.parse(req.body);
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Verify user has access to trip
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId, status: 'ACCEPTED' } } }
        ]
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const activity = await prisma.activity.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        tripId: tripId
      },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
            destination: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Activity added successfully',
      activity
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    console.error('Add activity error:', error);
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// Get trip activities
router.get('/:tripId/activities', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId } = req.params;
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Verify user has access to trip
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId, status: 'ACCEPTED' } } }
        ]
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const activities = await prisma.activity.findMany({
      where: { tripId },
      orderBy: { date: 'asc' }
    });

    res.json({
      message: 'Activities retrieved successfully',
      activities,
      count: activities.length
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to retrieve activities' });
  }
});

// Add expense to trip
router.post('/:tripId/expenses', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId } = req.params;
    const validatedData = expenseSchema.parse(req.body);
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Verify user has access to trip
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId, status: 'ACCEPTED' } } }
        ]
      },
      include: {
        members: {
          where: { status: 'ACCEPTED' },
          include: { user: true }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Verify all split users are trip members
    const memberIds = trip.members.map(member => member.userId);
    const invalidSplitUsers = validatedData.splits.filter(split => !memberIds.includes(split.userId));
    
    if (invalidSplitUsers.length > 0) {
      return res.status(400).json({ 
        error: 'Some users in splits are not trip members' 
      });
    }

    const expenseData: any = {
      description: validatedData.description,
      amount: validatedData.amount,
      category: validatedData.category,
      paidById: userId,
      tripId: tripId,
      splits: {
        create: validatedData.splits.map(split => ({
          amount: split.amount,
          userId: split.userId
        }))
      }
    };

    if (validatedData.date) {
      expenseData.date = new Date(validatedData.date);
    }

    const expense = await prisma.expense.create({
      data: expenseData,
      include: {
        paidBy: {
          select: { id: true, name: true, avatar: true, email: true }
        },
        splits: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Expense added successfully',
      expense
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    console.error('Add expense error:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Get trip expenses
router.get('/:tripId/expenses', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId } = req.params;
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Verify user has access to trip
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId, status: 'ACCEPTED' } } }
        ]
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const expenses = await prisma.expense.findMany({
      where: { tripId },
      include: {
        paidBy: {
          select: { id: true, name: true, avatar: true, email: true }
        },
        splits: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      message: 'Expenses retrieved successfully',
      expenses,
      count: expenses.length
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to retrieve expenses' });
  }
});

// Invite user to trip
router.post('/:tripId/invite', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId } = req.params;
    const { email } = inviteSchema.parse(req.body);
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Verify user is trip owner
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        ownerId: userId
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or you are not the owner' });
    }

    // Get inviter info
    const inviter = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!inviter) {
      return res.status(404).json({ error: 'Inviter not found' });
    }

    // Find user to invite (if they exist)
    const userToInvite = await prisma.user.findUnique({
      where: { email }
    });

    let invitation;
    let invitationType = 'registered';
    
    if (userToInvite) {
      // User exists - create regular invitation
      
      // Check if user is already a member
      const existingMember = await prisma.tripMember.findUnique({
        where: {
          userId_tripId: {
            userId: userToInvite.id,
            tripId: tripId
          }
        }
      });

      if (existingMember) {
        return res.status(400).json({ 
          error: 'User is already a member of this trip',
          status: existingMember.status
        });
      }

      invitation = await prisma.tripMember.create({
        data: {
          userId: userToInvite.id,
          tripId: tripId,
          role: 'MEMBER',
          status: 'PENDING'
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          trip: {
            select: { id: true, name: true, destination: true }
          }
        }
      });
    } else {
      // User doesn't exist - we'll just send the email without storing in database
      invitationType = 'non-registered';
      
      // Create a temporary invitation object for response
      invitation = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user: {
          id: null,
          name: email.split('@')[0],
          email: email,
          avatar: null
        },
        role: 'MEMBER',
        status: 'PENDING',
        trip: {
          id: trip.id,
          name: trip.name,
          destination: trip.destination
        },
        createdAt: new Date()
      };
      
      console.log(`📧 Created invitation for non-registered user: ${email}`);
    }

    // ✅ Send email invitation
    try {
      await emailService.sendInvitationEmail(
        email,
        inviter.name,
        trip.name,
        trip.destination,
        userToInvite ? invitation.id : `invite_${email}`
      );
      console.log(`✅ Invitation sent to ${email} (${invitationType} user)`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Continue anyway - the invitation is still "sent" from user perspective
    }

    res.status(201).json({
      message: `Invitation sent successfully to ${email}`,
      invitation,
      userExists: !!userToInvite,
      invitationType
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Get trip members
router.get('/:tripId/members', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId } = req.params;
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Verify user has access to trip
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId, status: 'ACCEPTED' } } }
        ]
      },
      include: {
        members: {
          include: {
            user: {
              select: { 
                id: true, 
                name: true, 
                email: true, 
                avatar: true 
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Transform the data to match frontend expectations
    const members = trip.members.map(member => ({
      id: member.id,
      user: member.user,
      role: member.role,
      status: member.status,
      joinedAt: member.createdAt
    }));

    res.json({
      message: 'Members retrieved successfully',
      members,
      count: members.length
    });
  } catch (error) {
    console.error('Get trip members error:', error);
    res.status(500).json({ error: 'Failed to retrieve members' });
  }
});

// Remove member from trip
router.delete('/:tripId/members/:memberId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tripId, memberId } = req.params;
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Check if trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { 
        members: { 
          include: { 
            user: true 
          } 
        },
        owner: true 
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Check if member exists
    const memberToRemove = trip.members.find(m => m.id === memberId);
    if (!memberToRemove) {
      return res.status(404).json({ error: 'Member not found in this trip' });
    }

    // Permission check: user can remove themselves or trip owner can remove anyone
    const isTripOwner = trip.ownerId === userId;
    const isRemovingSelf = memberToRemove.userId === userId;

    if (!isTripOwner && !isRemovingSelf) {
      return res.status(403).json({ 
        error: 'You can only remove yourself from this trip' 
      });
    }

    // Prevent trip owner from removing themselves if they're the only owner
    if (isRemovingSelf && isTripOwner) {
      const otherOwners = trip.members.filter(m => 
        m.userId !== userId && m.role === 'OWNER'
      );
      if (otherOwners.length === 0) {
        return res.status(400).json({ 
          error: 'Cannot remove yourself as the only trip owner. Transfer ownership first.' 
        });
      }
    }

    // Remove the member
    await prisma.tripMember.delete({
      where: { id: memberId }
    });

    console.log(`✅ Member ${memberId} removed from trip ${tripId}`);
    
    res.json({ 
      message: 'Member removed successfully',
      removedMember: {
        id: memberToRemove.id,
        name: memberToRemove.user.name,
        email: memberToRemove.user.email
      }
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Temporary route to see all users (for testing)
router.get('/test/users', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true }
    });
    res.json({ 
      message: 'Users retrieved successfully',
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Helper function to calculate member balances
function calculateMemberBalances(expenses: any[]) {
  const balances: { [userId: string]: number } = {};

  expenses.forEach(expense => {
    // Add what the member paid
    if (!balances[expense.paidById]) {
      balances[expense.paidById] = 0;
    }
    balances[expense.paidById] += expense.amount;

    // Subtract what the member owes from splits
    expense.splits.forEach((split: any) => {
      if (!balances[split.userId]) {
        balances[split.userId] = 0;
      }
      balances[split.userId] -= split.amount;
    });
  });

  return balances;
}

export default router;