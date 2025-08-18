import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const Home: NextPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Head>
        <title>Amrutam - Ayurvedic Doctor Consultation</title>
        <meta name="description" content="Book consultations with Ayurvedic doctors" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative isolate overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
            <div className="mt-24 sm:mt-32 lg:mt-16">
              <a href="#" className="inline-flex space-x-6">
                <span className="rounded-full bg-primary-600/10 px-3 py-1 text-sm font-semibold leading-6 text-primary-600 ring-1 ring-inset ring-primary-600/10">
                  Ayurvedic Health
                </span>
              </a>
            </div>
            <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Ayurvedic Doctor Consultations
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Connect with experienced Ayurvedic doctors for personalized consultations. Book appointments online or in-person based on your convenience.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/doctors"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Find Doctors
              </Link>
              {isAuthenticated() ? (
                <Link href="/appointments" className="text-sm font-semibold leading-6 text-gray-900">
                  View Appointments <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900">
                  Log in <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </div>
          <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
            <div className="max-w-4xl flex-none sm:max-w-6xl lg:max-w-none">
              <img
                src="https://static.oxinis.com/healthmug/image/asset/1548-nx.webp"
                alt="Ayurvedic doctor consultation"
                width={800}
                height={600}
                className="w-full h-[300px] sm:h-[400px] md:h-[500px] object-contain sm:object-cover rounded-lg bg-gray-50 shadow-xl ring-1 ring-gray-400/10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Holistic Healthcare</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose Ayurvedic Consultation?
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Ayurveda offers personalized healthcare solutions based on your unique constitution and needs.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  Personalized Care
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Treatments tailored to your unique constitution (Prakriti) and imbalances (Vikriti).
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  Holistic Approach
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Addresses the root cause of health issues rather than just treating symptoms.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  Natural Remedies
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Uses herbs, diet, lifestyle changes, and therapies with minimal side effects.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;