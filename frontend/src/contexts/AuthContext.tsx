import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const storage = {
  setToken: (token: string) => localStorage.setItem('token', token),
  getToken: () => localStorage.getItem('token'),
  setUser: (user: User) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = storage.getToken();
      const savedUser = storage.getUser();
      
      if (token && savedUser) {
        // Verify token is still valid by calling backend
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          console.log('✅ Auto-login successful');
        } else {
          // Token is invalid, clear storage
          console.log('❌ Token invalid, clearing storage');
          storage.clear();
        }
      } else {
        // No token found, ensure clean state
        storage.clear();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      storage.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
  try {
    setIsLoading(true); // ADD THIS
    console.log('🔄 Starting signup...', { name, email });
    
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    console.log('📨 Response status:', response.status);
    
    const data = await response.json();
    console.log('📨 Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || data.error || `Signup failed with status ${response.status}`);
    }

    // Store token and user data
    storage.setToken(data.token);
    storage.setUser(data.user);
    setUser(data.user);
    
    console.log('✅ Signup successful!', data.user);
    
  } catch (error) {
    console.error('🔥 AuthContext signup error:', error);
    throw error;
  } finally {
    setIsLoading(false); // ADD THIS
  }
};

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔄 Starting login...', { email });
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📨 Login response status:', response.status);
      
      const data = await response.json();
      console.log('📨 Login response data:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      storage.setToken(data.token);
      storage.setUser(data.user);
      setUser(data.user);
      
      console.log('✅ Login successful!', data.user);
      
    } catch (error: any) {
      console.error('🔥 Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    storage.clear();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};