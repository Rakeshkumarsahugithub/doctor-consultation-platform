import { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

const Register: NextPage = () => {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerUser(data.name, data.email, data.password, data.phone);
      toast.success('Registration successful!');
      router.push('/');
    } catch (error: any) {
      // Enhanced error handling with specific messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.status === 409) {
        errorMessage = 'User already exists with this email. Please try logging in or use a different email.';
      } else if (error.response?.status === 400) {
        if (error.response.data?.message?.includes('email')) {
          errorMessage = 'Invalid email format. Please enter a valid email address.';
        } else if (error.response.data?.message?.includes('password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else {
          errorMessage = error.response.data?.message || 'Invalid registration data.';
        }
      } else if (error.response?.status === 422) {
        errorMessage = 'Validation failed. Please check your input and try again.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many registration attempts. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register | Amrutam</title>
        <meta name="description" content="Create an Amrutam account" />
      </Head>

      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md mobile-form-container">
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Create a new account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px] mobile-form-container">
          <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                  Full Name
                </label>
                <div className="mt-2">
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    {...register('name', {
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                    })}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${errors.name ? 'ring-red-300' : 'ring-gray-300'} placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6`}
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${errors.email ? 'ring-red-300' : 'ring-gray-300'} placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6`}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                  Phone Number (optional)
                </label>
                <div className="mt-2">
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    {...register('phone', {
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Please enter a valid 10-digit phone number',
                      },
                    })}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${errors.phone ? 'ring-red-300' : 'ring-gray-300'} placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6`}
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                  Password
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
                        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                      },
                    })}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${errors.password ? 'ring-red-300' : 'ring-gray-300'} placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6`}
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
                  Confirm Password
                </label>
                <div className="mt-2">
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match',
                    })}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${errors.confirmPassword ? 'ring-red-300' : 'ring-gray-300'} placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>

            <p className="mt-10 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold leading-6 text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;