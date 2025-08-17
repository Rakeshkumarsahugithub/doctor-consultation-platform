import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import DoctorCard from '@/components/DoctorCard';
import Pagination from '@/components/Pagination';

interface Doctor {
  _id: string;
  user?: {
    name: string;
    email: string;
    profileImage?: string;
  };
  name?: string;
  profileImage?: string;
  specializations: string[];
  experience: number;
  qualifications: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  bio: string;
  consultationFee: {
    online: number;
    inPerson: number;
  };
  rating: {
    average: number;
    count: number;
  };
  consultationModes: string[];
  languages: string[];
  nextAvailableSlot?: string;
}

interface DoctorsResponse {
  success: boolean;
  data: {
    doctors: Doctor[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  };
}

interface SpecializationsResponse {
  success: boolean;
  data: string[];
}

const fetchDoctors = async (params: any): Promise<DoctorsResponse> => {
  try {
    // Clean up parameters - remove empty strings
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    console.log('Fetching doctors with params:', cleanParams);
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/doctors`, { 
      params: cleanParams,
      timeout: 10000 
    });
    
    console.log('API Response:', response.data);
    return {
      success: response.data.success,
      data: {
        doctors: response.data.data.doctors,
        pagination: {
          current: response.data.data.pagination.currentPage,
          pages: response.data.data.pagination.totalPages,
          total: response.data.data.pagination.totalItems
        }
      }
    };
  } catch (error) {
    console.error('Error fetching doctors from API:', error);
    
    // Check if it's a network error or server error
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
        console.warn('Backend server not available, using mock data');
      } else {
        console.error('API Error:', error.response?.data || error.message);
      }
    }
    
    // Fallback to empty result to show "no doctors found" message
    return {
      success: false,
      data: {
        doctors: [],
        pagination: {
          current: 1,
          pages: 0,
          total: 0
        }
      }
    };
  }
};

const fetchSpecializations = async (): Promise<SpecializationsResponse> => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/doctors/specializations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching specializations:', error);
    // Return mock data if API fails
    return {
      success: true,
      data: ['Panchakarma', 'General Medicine', 'Women Health', 'Skin Care', 'Joint Pain', 'Digestive Health']
    };
  }
};

const DoctorsPage: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState({
    specialization: '',
    mode: '',
    sortBy: 'rating',
    sortOrder: 'desc',
    search: '',
    page: 1,
    limit: 12
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: specializationsData } = useQuery(
    'specializations',
    fetchSpecializations,
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  const { data, isLoading, error, refetch } = useQuery(
    ['doctors', filters],
    () => fetchDoctors(filters),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: 1000,
      onError: (error) => {
        console.error('Query error:', error);
      }
    }
  );

  const handleFilterChange = (key: string, value: any) => {
    let updatedFilters = { ...filters, [key]: value, page: 1 };
    
    // Handle special sort mappings
    if (key === 'sortBy') {
      if (value === 'fee-low') {
        updatedFilters.sortBy = 'fee';
        updatedFilters.sortOrder = 'asc';
      } else if (value === 'fee-high') {
        updatedFilters.sortBy = 'fee';
        updatedFilters.sortOrder = 'desc';
      } else if (value === 'name') {
        updatedFilters.sortBy = 'name';
        updatedFilters.sortOrder = 'asc';
      } else {
        updatedFilters.sortOrder = 'desc';
      }
    }
    
    setFilters(updatedFilters);
  };

  // Refetch doctors when search input changes (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      refetch();
    }, 400);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle errors in useEffect to avoid setState during render
  useEffect(() => {
    if (error) {
      toast.error('Failed to load doctors');
    }
  }, [error]);

  return (
    <>
      <Head>
        <title>Find Ayurvedic Doctors | Amrutam</title>
        <meta name="description" content="Find experienced Ayurvedic doctors by specialization and availability" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Find Your Ayurvedic Doctor
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover experienced Ayurvedic practitioners specializing in traditional healing methods
          </p>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">🔍 Find Your Perfect Ayurvedic Doctor</h2>
            <p className="text-sm text-gray-600">Search and filter through our expert practitioners</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Enhanced Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                🔎 Search Doctors
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search by name, specialization, or condition..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Enhanced Specialization Filter */}
            <div>
              <label htmlFor="specialization" className="block text-sm font-semibold text-gray-700 mb-2">
                🎯 Specialization
              </label>
              <select
                id="specialization"
                value={filters.specialization}
                onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200"
              >
                <option value="">All Specializations</option>
                <option value="Women's Health">Women's Health</option>
                <option value="Mental Wellness">Mental Wellness</option>
                <option value="Digestive Health">Digestive Health</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Joint & Bone Care">Joint & Bone Care</option>
                <option value="Skin & Hair Care">Skin & Hair Care</option>
                <option value="Meditation">Meditation</option>
                <option value="Pulse Diagnosis">Pulse Diagnosis</option>
                <option value="Panchakarma">Panchakarma</option>
                <option value="Yoga Therapy">Yoga Therapy</option>
              </select>
            </div>

            {/* Enhanced Consultation Mode Filter */}
            <div>
              <label htmlFor="mode" className="block text-sm font-semibold text-gray-700 mb-2">
                💻 Consultation Mode
              </label>
              <select
                id="mode"
                value={filters.mode}
                onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200"
              >
                <option value="">All Modes</option>
                <option value="online">🌐 Online Only</option>
                <option value="in-person">🏥 In-Person Only</option>
              </select>
            </div>

            {/* Enhanced Sort Filter */}
            <div>
              <label htmlFor="sort" className="block text-sm font-semibold text-gray-700 mb-2">
                📊 Sort By
              </label>
              <select
                id="sort"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200"
              >
                <option value="rating">⭐ Highest Rated</option>
                <option value="experience">🎓 Most Experienced</option>
                <option value="fee-low">💰 Fee: Low to High</option>
                <option value="fee-high">💰 Fee: High to Low</option>
                <option value="reviews">💬 Most Reviews</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Tags */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-600 mr-2">Quick filters:</span>
              {['Women\'s Health', 'Mental Wellness', 'Digestive Health', 'Skin & Hair Care', 'Online Available'].map((tag) => {
                const isSelected = (tag === 'Online Available' && filters.mode === 'online') || 
                                 (tag !== 'Online Available' && filters.specialization === tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      if (tag === 'Online Available') {
                        setFilters({ ...filters, mode: filters.mode === 'online' ? '' : 'online' });
                      } else {
                        setFilters({ ...filters, specialization: filters.specialization === tag ? '' : tag });
                      }
                    }}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-200 ${
                      isSelected 
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm' 
                        : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
              {(filters.search || filters.specialization || filters.mode !== '') && (
                <button
                  onClick={() => setFilters({ search: '', specialization: '', mode: '', sortBy: 'rating', sortOrder: 'desc', page: 1, limit: 12 })}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors duration-200"
                >
                  ✕ Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : data?.data?.doctors?.length ? (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Showing {data.data.doctors.length} of {data.data.pagination.total} doctors
                {filters.sortBy === 'availability' && ' sorted by earliest availability'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data.data.doctors.map((doctor) => (
                <DoctorCard key={doctor._id} doctor={doctor} />
              ))}
            </div>

            {/* Pagination */}
            {data.data.pagination.pages > 1 && (
              <Pagination
                currentPage={data.data.pagination.current}
                totalPages={data.data.pagination.pages}
                totalItems={data.data.pagination.total}
                itemsPerPage={filters.limit}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-500">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default DoctorsPage;