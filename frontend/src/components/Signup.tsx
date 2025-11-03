import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess(false);

  if (!isFormValid) {
    setError('Please fill in all fields correctly');
    return;
  }

  setIsLoading(true);

  try {
    console.log('🔄 Starting signup process...');
    console.log('📤 Sending data:', { 
      name: formData.name, 
      email: formData.email, 
      password: '***' 
    });
    
    await signup(formData.name, formData.email, formData.password);
    
    console.log('✅ Signup successful!');
    setSuccess(true);
    
    setTimeout(() => {
      navigate('/');
    }, 2000);
  } catch (err: any) {
    console.log('❌ Signup error object:', err);
    console.log('❌ Error message:', err.message);
    console.log('❌ Error stack:', err.stack);
    
    const errorMessage = err.message || 'Signup failed. Please try again.';
    setError(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isFormValid = formData.name && formData.email && formData.password && formData.confirmPassword && passwordsMatch;

  // If success, show success message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        </div>
        
        <div className="max-w-md w-full text-center space-y-8 relative z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/20">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-white">✓</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to VoyageSync!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Your account has been created successfully. Redirecting you to the dashboard...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-20 animate-pulse delay-500"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8 group">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              VoyageSync
            </span>
          </Link>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
            Start Your Journey
          </h2>
          <p className="text-lg text-gray-600">
            Create your account and begin planning adventures
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">!</span>
                </div>
                <div>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                  {error.includes('already have an account') && (
                    <div className="mt-2">
                      <Link 
                        to="/login" 
                        className="text-red-600 hover:text-red-500 font-semibold text-sm transition-colors duration-200 underline"
                      >
                        Click here to sign in instead
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full px-4 py-4 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-400">👤</span>
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-4 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-400">📧</span>
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full px-4 py-4 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm pr-12"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 6 characters
                </p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className={`w-full px-4 py-4 border placeholder-gray-400 text-gray-900 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-300 bg-white/50 backdrop-blur-sm pr-12 ${
                      formData.confirmPassword 
                        ? passwordsMatch 
                          ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500' 
                          : 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-gray-200 focus:ring-green-500/20 focus:border-green-500'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                    Passwords do not match
                  </p>
                )}
                {formData.confirmPassword && passwordsMatch && (
                  <p className="mt-1 text-xs text-green-500 flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                    Passwords match!
                  </p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded-xl transition duration-200 mt-1"
                disabled={isLoading}
              />
              <label htmlFor="terms" className="ml-3 block text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-green-600 hover:text-green-500 font-semibold transition-colors duration-200">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-green-600 hover:text-green-500 font-semibold transition-colors duration-200">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-4 focus:ring-green-500/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">✨</span>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign up with</span>
              </div>
            </div>

            {/* Social Signup */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-2xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-2xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
                Twitter
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-semibold text-green-600 hover:text-green-500 transition-colors duration-200 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Join thousands of travelers planning their adventures with VoyageSync
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;