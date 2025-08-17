// import '@/styles/globals.css';
// import '@/styles/output.css';
// import { Toaster } from 'react-hot-toast';
// import { QueryClient, QueryClientProvider } from 'react-query';
// import { AuthProvider } from '@/context/AuthContext';
// import Layout from '@/components/Layout';
// import type { AppProps } from 'next/app';
// import { useRouter } from 'next/router';

// // Create a client
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       refetchOnWindowFocus: false,
//       retry: 1,
//     },
//   },
// });

// export default function App({ Component, pageProps }: AppProps) {
//   const router = useRouter();
  
//   // Bypass AuthProvider for test page
//   if (router.pathname === '/test') {
//     return (
//       <QueryClientProvider client={queryClient}>
//         <Component {...pageProps} />
//         <Toaster position="top-right" />
//       </QueryClientProvider>
//     );
//   }

//   return (
//     <QueryClientProvider client={queryClient}>
//       <AuthProvider>
//         <Layout>
//           <Component {...pageProps} />
//           <Toaster position="top-right" />
//         </Layout>
//       </AuthProvider>
//     </QueryClientProvider>
//   );
// }

// pages/_app.tsx

import '@/styles/globals.css';
import '@/styles/output.css';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const isTestPage = router.pathname === '/test';

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isTestPage ? (
          <>
            <Component {...pageProps} />
            <Toaster position="top-right" />
          </>
        ) : (
          <Layout>
            <Component {...pageProps} />
            <Toaster position="top-right" />
          </Layout>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}
