import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-lg">TP</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                AI Travel Planner
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="px-3 py-2 rounded-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
            >
              Home
            </Link>
            <Link
              to="/trips"
              className="px-3 py-2 rounded-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
            >
              My Trips
            </Link>
            <Link
            to="/trips/new"
            className="px-3 py-2 rounded-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
          >
            Create Trip
          </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Welcome, {user.name}</span>
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2.5 rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;