import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
}

const publicRoutes = ['/', '/login', '/register'];

export default function Layout({ children }: LayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Check if user is authenticated for protected routes
  useEffect(() => {
    if (!loading && !isAuthenticated() && !publicRoutes.includes(router.pathname)) {
      // Redirect to login page for protected routes
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const navigation = [
    { name: 'Home', href: '/', current: router.pathname === '/' },
    { name: 'Find Doctors', href: '/doctors', current: router.pathname === '/doctors' },
    { name: 'My Appointments', href: '/appointments', current: router.pathname === '/appointments' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Disclosure as="nav" className="bg-white shadow">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 justify-between">
                <div className="flex">
                  <div className="flex flex-shrink-0 items-center">
                    <Link href="/" className="flex items-center text-xl font-bold text-primary-600">
                      <svg className="w-6 h-6 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                      </svg>
                      Amrutam
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`nav-link inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${item.current ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  {isAuthenticated() ? (
                    <div className="flex items-center space-x-4">
                      <Link
                        href="/profile"
                        className="text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors duration-200 ease-in-out"
                      >
                        {user?.name}
                      </Link>
                      <button
                        onClick={logout}
                        className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 ease-in-out"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <Link
                        href="/login"
                        className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 ease-in-out"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-all duration-200 ease-in-out"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
                <div className="-mr-2 flex items-center sm:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-all duration-200 ease-in-out">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 pb-3 pt-2">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    href={item.href}
                    className={`block py-2 pl-3 pr-4 text-base font-medium transition-all duration-200 ease-in-out ${item.current ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700' : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
              <div className="border-t border-gray-200 pb-3 pt-4">
                {isAuthenticated() ? (
                  <div className="space-y-1">
                    <Disclosure.Button
                      as={Link}
                      href="/profile"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 ease-in-out"
                    >
                      Profile
                    </Disclosure.Button>
                    <Disclosure.Button
                      as="button"
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 ease-in-out"
                    >
                      Logout
                    </Disclosure.Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Disclosure.Button
                      as={Link}
                      href="/login"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 ease-in-out"
                    >
                      Login
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      href="/register"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 ease-in-out"
                    >
                      Register
                    </Disclosure.Button>
                  </div>
                )}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center space-x-6 md:order-2">
              <p className="text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Amrutam. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}