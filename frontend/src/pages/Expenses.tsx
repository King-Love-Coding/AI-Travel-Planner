import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Users, DollarSign, ArrowRight, Plus, X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ExpenseSplit {
  id: string;
  userId: string;
  user: User;
  amount: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  paidBy: User;
  paidById: string;
  createdAt: string;
  splits: ExpenseSplit[];
}

interface Balance {
  userId: string;
  userName: string;
  totalPaid: number;
  totalOwed: number;
  balance: number;
}

const Expenses: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'OTHER',
    paidBy: '',
    splitBetween: [] as string[] // user IDs
  });
  
  const { user } = useAuth();

  const categories = [
    'FOOD',
    'TRANSPORT',
    'ACCOMMODATION', 
    'ACTIVITIES',
    'SHOPPING',
    'OTHER'
  ];

  useEffect(() => {
    if (tripId) {
      fetchExpenses();
    }
  }, [tripId]);

  useEffect(() => {
    if (expenses.length > 0 && trip?.members) {
      calculateBalances();
    }
  }, [expenses, trip]);

  const fetchExpenses = async () => {
    try {
      const response = await apiService.getTripById(tripId!);
      setTrip(response.trip);
      setExpenses(response.trip.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBalances = () => {
    const userBalances: { [key: string]: Balance } = {};

    // Initialize balances for all accepted members
    const acceptedMembers = trip.members.filter((member: any) => member.status === 'ACCEPTED');
    
    acceptedMembers.forEach((member: any) => {
      userBalances[member.user.id] = {
        userId: member.user.id,
        userName: member.user.name,
        totalPaid: 0,
        totalOwed: 0,
        balance: 0
      };
    });

    // Calculate totals from expenses
    expenses.forEach(expense => {
      const totalSplits = expense.splits.length;
      if (totalSplits === 0) return;

      // Add to paid by user's total paid
      userBalances[expense.paidById].totalPaid += expense.amount;
      
      // Add to each person's total owed from splits
      expense.splits.forEach(split => {
        if (userBalances[split.userId]) {
          userBalances[split.userId].totalOwed += split.amount;
        }
      });
    });

    // Calculate final balances
    Object.keys(userBalances).forEach(userId => {
      userBalances[userId].balance = userBalances[userId].totalOwed - userBalances[userId].totalPaid;
    });

    setBalances(Object.values(userBalances));
  };

  const getSettlementSuggestions = () => {
    const debtors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    const creditors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const settlements: { from: string; to: string; amount: number }[] = [];
    
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const amount = Math.min(debtor.balance, -creditor.balance);
      
      settlements.push({
        from: debtor.userName,
        to: creditor.userName,
        amount: parseFloat(amount.toFixed(2))
      });
      
      debtor.balance -= amount;
      creditor.balance += amount;
      
      if (debtor.balance === 0) i++;
      if (creditor.balance === 0) j++;
    }
    
    return settlements;
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId || !user) return;

    try {
      const acceptedMembers = trip.members.filter((member: any) => member.status === 'ACCEPTED');
      const splitBetweenUsers = newExpense.splitBetween.length > 0 
        ? acceptedMembers.filter((member: any) => newExpense.splitBetween.includes(member.user.id))
        : acceptedMembers;

      const amountPerPerson = parseFloat(newExpense.amount) / splitBetweenUsers.length;

      const expenseData = {
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        paidById: newExpense.paidBy || user.id,
        splits: splitBetweenUsers.map((member: any) => ({
          userId: member.user.id,
          amount: amountPerPerson
        }))
      };

      await apiService.createExpense(tripId, expenseData);
      setShowAddForm(false);
      setNewExpense({ 
        description: '', 
        amount: '', 
        category: 'OTHER', 
        paidBy: '',
        splitBetween: [] 
      });
      fetchExpenses(); // Refresh the list
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const toggleUserSplit = (userId: string) => {
    setNewExpense(prev => ({
      ...prev,
      splitBetween: prev.splitBetween.includes(userId)
        ? prev.splitBetween.filter(id => id !== userId)
        : [...prev.splitBetween, userId]
    }));
  };

  const selectAllUsers = () => {
    const acceptedMembers = trip.members.filter((member: any) => member.status === 'ACCEPTED');
    setNewExpense(prev => ({
      ...prev,
      splitBetween: acceptedMembers.map((member: any) => member.user.id)
    }));
  };

  const clearAllUsers = () => {
    setNewExpense(prev => ({
      ...prev,
      splitBetween: []
    }));
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const settlements = getSettlementSuggestions();
  const acceptedMembers = trip?.members?.filter((member: any) => member.status === 'ACCEPTED') || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
              <p className="text-gray-600 mt-2">Track and split expenses for {trip?.name}</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>

          {/* Add Expense Form */}
          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 border-2 border-dashed border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Add New Expense</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAddExpense} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Dinner at restaurant, Train tickets, etc."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount ($) *
                    </label>
                    <input
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0) + category.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paid By
                    </label>
                    <select
                      value={newExpense.paidBy}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, paidBy: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select who paid</option>
                      {acceptedMembers.map((member: any) => (
                        <option key={member.user.id} value={member.user.id}>
                          {member.user.name} {member.user.id === user?.id && '(You)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Split Between Users */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Split Between ({newExpense.splitBetween.length} selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllUsers}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={clearAllUsers}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {acceptedMembers.map((member: any) => (
                      <label key={member.user.id} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={newExpense.splitBetween.includes(member.user.id)}
                          onChange={() => toggleUserSplit(member.user.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {member.user.name} {member.user.id === user?.id && '(You)'}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  {newExpense.amount && newExpense.splitBetween.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Each person will pay: <strong>${(parseFloat(newExpense.amount) / newExpense.splitBetween.length).toFixed(2)}</strong>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    Save Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Balance Summary */}
          {balances.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Balance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {balances.map((balance) => (
                  <div key={balance.userId} className={`p-4 rounded-lg border-2 ${
                    balance.balance > 0 
                      ? 'border-green-200 bg-green-50' 
                      : balance.balance < 0 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{balance.userName}</span>
                      <span className={`text-lg font-bold ${
                        balance.balance > 0 
                          ? 'text-green-600' 
                          : balance.balance < 0 
                          ? 'text-red-600' 
                          : 'text-gray-600'
                      }`}>
                        {balance.balance > 0 ? '+' : ''}${Math.abs(balance.balance).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Paid: ${balance.totalPaid.toFixed(2)} • Owes: ${balance.totalOwed.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Settlement Suggestions */}
              {settlements.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ArrowRight size={20} />
                    Settlement Suggestions
                  </h4>
                  <div className="space-y-3">
                    {settlements.map((settlement, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-blue-900">{settlement.from}</span>
                          <ArrowRight size={16} className="text-blue-600" />
                          <span className="font-medium text-blue-900">{settlement.to}</span>
                        </div>
                        <span className="font-bold text-blue-700">${settlement.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expenses Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <DollarSign className="mx-auto mb-2 text-blue-600" size={24} />
              <div className="text-2xl font-bold text-blue-600">${totalExpenses.toFixed(2)}</div>
              <div className="text-blue-700">Total Spent</div>
            </div>
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <Users className="mx-auto mb-2 text-green-600" size={24} />
              <div className="text-2xl font-bold text-green-600">${(totalExpenses / (acceptedMembers.length || 1)).toFixed(2)}</div>
              <div className="text-green-700">Per Person</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-purple-600">{expenses.length}</div>
              <div className="text-purple-700">Expenses</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-orange-600">{acceptedMembers.length}</div>
              <div className="text-orange-700">Members</div>
            </div>
          </div>

          {/* Expenses List */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Recent Expenses</h3>
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg text-gray-900">{expense.description}</h4>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                          {expense.category.toLowerCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Paid by <strong>{expense.paidBy.name}</strong> • {new Date(expense.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">${expense.amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        ${(expense.amount / expense.splits.length).toFixed(2)} per person
                      </div>
                    </div>
                  </div>
                  
                  {/* Splits */}
                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-600 mb-2">Split between {expense.splits.length} people:</div>
                    <div className="flex flex-wrap gap-2">
                      {expense.splits.map((split) => (
                        <div key={split.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                          {split.user.name}: <strong>${split.amount.toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {expenses.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <DollarSign size={64} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No expenses yet</h3>
                  <p className="text-gray-500 mb-4">Start adding expenses to track your trip spending</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add Your First Expense
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;