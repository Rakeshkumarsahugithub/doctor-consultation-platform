// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { useRouter } from 'next/router';
// import axios from 'axios';
// import jwtDecode from 'jwt-decode';

// interface User {
//   id: number;
//   name: string;
//   email: string;
//   role: string;
// }

// interface AuthContextType {
//   user: User | null;
//   token: string | null;
//   loading: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
//   logout: () => void;
//   isAuthenticated: () => boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider = ({ children }: AuthProviderProps) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   // Initialize auth state from localStorage on mount
//   useEffect(() => {
//     console.log('AuthContext: Initializing...');
//     if (typeof window === 'undefined') {
//       setLoading(false);
//       return;
//     }
//     const storedToken = localStorage.getItem('token');
    
//     if (storedToken) {
//       try {
//         // Set axios default header
//         axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
//         // Fetch user profile
//         const fetchUserProfile = async () => {
//           try {
//             const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/profile`);
//             setUser(response.data.data);
//             setToken(storedToken);
//           } catch (error) {
//             console.error('Failed to fetch user profile:', error);
//             localStorage.removeItem('token');
//             delete axios.defaults.headers.common['Authorization'];
//           } finally {
//             setLoading(false);
//           }
//         };
        
//         fetchUserProfile();
//       } catch (error) {
//         console.error('Error initializing auth:', error);
//         localStorage.removeItem('token');
//         setLoading(false);
//       }
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   const login = async (email: string, password: string) => {
//     try {
//       const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
//         email,
//         password,
//       });

//       const { token, user } = response.data.data;

//       // Store token in localStorage
//       localStorage.setItem('token', token);

//       // Set auth state
//       setToken(token);
//       setUser(user);

//       // Set axios default header
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

//       return response.data;
//     } catch (error: any) {
//       throw new Error(error.response?.data?.error?.message || 'Login failed');
//     }
//   };

//   const register = async (name: string, email: string, password: string, phone?: string) => {
//     try {
//       const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/register`, {
//         name,
//         email,
//         password,
//         phone,
//       });

//       const { token, user } = response.data.data;

//       // Store token in localStorage
//       localStorage.setItem('token', token);

//       // Set auth state
//       setToken(token);
//       setUser(user);

//       // Set axios default header
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

//       return response.data;
//     } catch (error: any) {
//       throw new Error(error.response?.data?.error?.message || 'Registration failed');
//     }
//   };

//   const logout = () => {
//     // Clear token from localStorage
//     localStorage.removeItem('token');

//     // Clear auth state
//     setUser(null);
//     setToken(null);

//     // Remove axios default header
//     delete axios.defaults.headers.common['Authorization'];

//     // Redirect to login page
//     router.push('/login');
//   };

//   const isAuthenticated = () => {
//     return !!token;
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         token,
//         loading,
//         login,
//         register,
//         logout,
//         isAuthenticated,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };


import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    console.log('AuthContext: Initializing...');
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      try {
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Fetch user profile
        const fetchUserProfile = async () => {
          try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/profile`);
            setUser(response.data.data);
            setToken(storedToken);
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          } finally {
            setLoading(false);
          }
        };
        
        fetchUserProfile();
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Logging in with API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data.data;

      // Store token in localStorage
      localStorage.setItem('token', token);

      // Set auth state
      setToken(token);
      setUser(user);

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      console.log('Registering with API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        name,
        email,
        password,
        phone,
      });

      const { token, user } = response.data.data;

      // Store token in localStorage
      localStorage.setItem('token', token);

      // Set auth state
      setToken(token);
      setUser(user);

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  };

  const logout = () => {
    // Clear token from localStorage
    localStorage.removeItem('token');

    // Clear auth state
    setUser(null);
    setToken(null);

    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];

    // Redirect to login page
    router.push('/login');
  };

  const isAuthenticated = () => {
    return !!token;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
