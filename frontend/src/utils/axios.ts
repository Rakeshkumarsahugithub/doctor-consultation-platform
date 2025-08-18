
import axios from 'axios';

// Set default timeout for all requests
axios.defaults.timeout = 15000; // 15 seconds

// Set default headers
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Add request interceptor for logging
axios.interceptors.request.use(
  (config) => {
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network Error detected:', error);
      // You can add additional handling here if needed
    }
    
    // Log all errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axios;
