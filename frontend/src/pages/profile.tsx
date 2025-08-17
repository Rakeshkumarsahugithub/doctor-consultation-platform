import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '@/context/AuthContext';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  profileImage?: string;
  doctor_profile?: {
    specialization_name: string;
    experience_years: number;
    bio: string;
    consultation_fee: number;
  };
}

interface ProfileFormData {
  name: string;
  phone: string;
}

const ProfilePage: NextPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch user profile
  const { data: profileData, isLoading } = useQuery<{ data: UserProfile }>(
    'userProfile',
    async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`);
      return response.data;
    },
    {
      enabled: isAuthenticated(),
      refetchOnWindowFocus: false,
    }
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>();

  // Initialize form with user data when available
  useEffect(() => {
    if (profileData?.data) {
      reset({
        name: profileData.data.name,
        phone: profileData.data.phone || '',
      });
    }
  }, [profileData, reset]);

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data: ProfileFormData) => {
      return axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, data);
    },
    {
      onSuccess: () => {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        queryClient.invalidateQueries('userProfile');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Failed to update profile');
      },
    }
  );

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <>
      <Head>
        <title>My Profile | Amrutam</title>
        <meta name="description" content="View and update your profile" />
      </Head>

      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading profile...</p>
          </div>
        ) : profileData?.data ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
                <div className="flex justify-center mb-6">
                  {profileData.data.profileImage ? (
                    <img
                      src={profileData.data.profileImage}
                      alt={profileData.data.name}
                      className="h-32 w-32 rounded-full object-cover border-4 border-primary-100"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 text-4xl font-medium">
                        {profileData.data.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="name"
                        type="text"
                        {...register('name', {
                          required: 'Name is required',
                          minLength: {
                            value: 2,
                            message: 'Name must be at least 2 characters',
                          },
                        })}
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {errors.name && (
                        <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1">
                      <input
                        id="phone"
                        type="tel"
                        {...register('phone', {
                          pattern: {
                            value: /^[0-9]{10}$/,
                            message: 'Please enter a valid 10-digit phone number',
                          },
                        })}
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {errors.phone && (
                        <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        reset({
                          name: profileData.data.name,
                          phone: profileData.data.phone || '',
                        });
                      }}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isLoading}
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-medium text-gray-900">{profileData.data.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">{profileData.data.email}</p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Edit Profile
                    </button>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <dl className="divide-y divide-gray-200">
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Full name</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          {profileData.data.name}
                        </dd>
                      </div>
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Email address</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          {profileData.data.email}
                        </dd>
                      </div>
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          {profileData.data.phone || 'Not provided'}
                        </dd>
                      </div>
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Account type</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          {profileData.data.role ? 
                            profileData.data.role.charAt(0).toUpperCase() + profileData.data.role.slice(1) : 
                            'Not specified'
                          }
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {profileData.data.doctor_profile && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Doctor Information</h3>
                      <dl className="divide-y divide-gray-200">
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">Specialization</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                            {profileData.data.doctor_profile.specialization_name}
                          </dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">Experience</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                            {profileData.data.doctor_profile.experience_years} years
                          </dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">Consultation Fee</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                            ₹{profileData.data.doctor_profile.consultation_fee}
                          </dd>
                        </div>
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">Bio</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                            {profileData.data.doctor_profile.bio}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Failed to load profile. Please try again.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfilePage;