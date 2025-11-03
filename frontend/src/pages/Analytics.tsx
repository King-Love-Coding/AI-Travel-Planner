import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';

const Analytics: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tripId) {
      fetchTripData();
    }
  }, [tripId]);

  const fetchTripData = async () => {
    try {
      const response = await apiService.getTripById(tripId!);
      setTrip(response.trip);
    } catch (error) {
      console.error('Failed to fetch trip data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCategorySpending = () => {
    if (!trip?.expenses) return [];
    
    const categories: { [key: string]: number } = {};
    trip.expenses.forEach((expense: any) => {
      const category = expense.category || 'OTHER';
      categories[category] = (categories[category] || 0) + expense.amount;
    });
    
    return Object.entries(categories).map(([name, amount]) => ({
      name,
      amount: amount as number,
      percentage: totalSpent > 0 ? ((amount as number) / totalSpent * 100).toFixed(1) : '0'
    }));
  };

  const calculateMemberBalances = () => {
    if (!trip?.members || !trip?.expenses) return [];
    
    const balances: { [key: string]: { name: string; paid: number; owes: number; balance: number } } = {};
    
    // Initialize balances
    trip.members.forEach((member: any) => {
      if (member.status === 'ACCEPTED') {
        balances[member.user.id] = {
          name: member.user.name,
          paid: 0,
          owes: 0,
          balance: 0
        };
      }
    });
    
    // Calculate paid amounts and owed amounts
    trip.expenses.forEach((expense: any) => {
      // Add to paid amount
      if (balances[expense.paidById]) {
        balances[expense.paidById].paid += expense.amount;
      }
      
      // Add to owed amounts for each split
      expense.splits.forEach((split: any) => {
        if (balances[split.userId]) {
          balances[split.userId].owes += split.amount;
        }
      });
    });
    
    // Calculate final balances
    Object.keys(balances).forEach(userId => {
      balances[userId].balance = balances[userId].paid - balances[userId].owes;
    });
    
    return Object.values(balances);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg">Trip not found</div>
        </div>
      </div>
    );
  }

  const totalSpent = trip.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;
  const categorySpending = calculateCategorySpending();
  const memberBalances = calculateMemberBalances();
  const totalActivities = trip.activities?.length || 0;
  const totalMembers = trip.members?.filter((m: any) => m.status === 'ACCEPTED').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trip Analytics</h1>
          <p className="text-gray-600 mb-8">Financial insights for {trip.name}</p>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">${totalSpent.toFixed(2)}</div>
              <div className="text-blue-700 font-medium">Total Spent</div>
            </div>
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{totalActivities}</div>
              <div className="text-green-700 font-medium">Activities</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold text-purple-600">{totalMembers}</div>
              <div className="text-purple-700 font-medium">Members</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold text-orange-600">
                ${totalSpent > 0 ? (totalSpent / totalMembers).toFixed(2) : '0.00'}
              </div>
              <div className="text-orange-700 font-medium">Per Person</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Spending */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Spending by Category</h3>
              <div className="space-y-4">
                {categorySpending.map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-gray-700 capitalize">{category.name.toLowerCase()}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${category.amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{category.percentage}%</div>
                    </div>
                  </div>
                ))}
                {categorySpending.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No expenses yet
                  </div>
                )}
              </div>
            </div>

            {/* Member Balances */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Member Balances</h3>
              <div className="space-y-4">
                {memberBalances.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="font-medium text-gray-700">{member.name}</div>
                    <div className={`text-sm font-semibold ${
                      member.balance > 0 
                        ? 'text-green-600' 
                        : member.balance < 0 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                    }`}>
                      {member.balance > 0 
                        ? `+$${Math.abs(member.balance).toFixed(2)}` 
                        : member.balance < 0 
                        ? `-$${Math.abs(member.balance).toFixed(2)}`
                        : 'Settled Up'
                      }
                    </div>
                  </div>
                ))}
                {memberBalances.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No member data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Expenses</h3>
            <div className="space-y-3">
              {trip.expenses?.slice(0, 5).map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{expense.description}</div>
                    <div className="text-sm text-gray-500">
                      Paid by {expense.paidBy.name} • {new Date(expense.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">${expense.amount.toFixed(2)}</div>
                    <div className="text-sm text-gray-500 capitalize">{expense.category?.toLowerCase() || 'other'}</div>
                  </div>
                </div>
              ))}
              {(!trip.expenses || trip.expenses.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <div>No expenses to analyze yet</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;