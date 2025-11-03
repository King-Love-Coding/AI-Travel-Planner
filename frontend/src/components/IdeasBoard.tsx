import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MapPin, Plus, Tag } from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedCost: number;
  location?: { lat: number; lng: number };
  votes: number;
  userVote: 'up' | 'down' | null;
  createdBy: string;
  createdAt: Date;
}

interface IdeasBoardProps {
  tripId: string;
  currentUser: any;
}

const IdeasBoard: React.FC<IdeasBoardProps> = ({ tripId, currentUser }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    category: 'Sightseeing',
    estimatedCost: 0,
  });

  const categories = ['Sightseeing', 'Food', 'Accommodation', 'Transport', 'Shopping', 'Entertainment', 'Other'];

  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    const idea: Idea = {
      id: Date.now().toString(),
      ...newIdea,
      votes: 0,
      userVote: null,
      createdBy: currentUser.name,
      createdAt: new Date(),
    };
    setIdeas([idea, ...ideas]);
    setNewIdea({ title: '', description: '', category: 'Sightseeing', estimatedCost: 0 });
    setShowAddForm(false);
  };

  const handleVote = (ideaId: string, voteType: 'up' | 'down') => {
    setIdeas(ideas.map(idea => {
      if (idea.id === ideaId) {
        const voteChange = idea.userVote === voteType ? -1 : 
                          idea.userVote ? 0 : 1;
        return {
          ...idea,
          votes: idea.votes + (voteType === 'up' ? voteChange : -voteChange),
          userVote: idea.userVote === voteType ? null : voteType
        };
      }
      return idea;
    }));
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Sightseeing': 'bg-blue-100 text-blue-800',
      'Food': 'bg-green-100 text-green-800',
      'Accommodation': 'bg-purple-100 text-purple-800',
      'Transport': 'bg-yellow-100 text-yellow-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Entertainment': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.Other;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ideas Board</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          Add Idea
        </button>
      </div>

      {/* Add Idea Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Add New Idea</h3>
          <form onSubmit={handleAddIdea} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={newIdea.title}
                onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What do you want to do?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newIdea.description}
                onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add more details about this idea..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newIdea.category}
                  onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Cost ($)
                </label>
                <input
                  type="number"
                  value={newIdea.estimatedCost}
                  onChange={(e) => setNewIdea({ ...newIdea, estimatedCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                Add Idea
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ideas List */}
      <div className="space-y-4">
        {ideas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Tag size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No ideas yet. Be the first to suggest something!</p>
          </div>
        ) : (
          ideas
            .sort((a, b) => b.votes - a.votes)
            .map(idea => (
              <div key={idea.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(idea.category)}`}>
                    {idea.category}
                  </span>
                </div>

                <p className="text-gray-600 mb-3">{idea.description}</p>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>By {idea.createdBy}</span>
                    {idea.estimatedCost > 0 && (
                      <span>Est. ${idea.estimatedCost}</span>
                    )}
                    <span>{idea.createdAt.toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(idea.id, 'up')}
                      className={`p-1 rounded ${
                        idea.userVote === 'up' 
                          ? 'bg-green-100 text-green-600' 
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <span className="text-sm font-medium min-w-8 text-center">
                      {idea.votes}
                    </span>
                    <button
                      onClick={() => handleVote(idea.id, 'down')}
                      className={`p-1 rounded ${
                        idea.userVote === 'down' 
                          ? 'bg-red-100 text-red-600' 
                          : 'text-gray-400 hover:text-red-600'
                      }`}
                    >
                      <ThumbsDown size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default IdeasBoard;