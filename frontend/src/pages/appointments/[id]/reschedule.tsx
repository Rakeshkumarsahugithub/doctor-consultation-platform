import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { useQuery, useMutation } from 'react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface Appointment {
  id: number;
  user_id: number;
  doctor_id: number;
  slot_id: number;
  status: string;
  doctor: {
    id: number;
    name: string;
    specialization_name: string;
    profile_image: string | null;
  };
  slot: {
    id: number;
    start_time: string;
    end_time: string;
    is_online: boolean;
  };
}

interface Slot {
  id: number;
  doctor_id: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_online: boolean;
}

const RescheduleAppointmentPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Redirect to login if not authenticated
  if (typeof window !== 'undefined' && !isAuthenticated()) {
    router.push('/login');
    return null;
  }

  // Format today's date as YYYY-MM-DD for the date input
  useEffect(() => {
    const today = new Date();
    setSelectedDate(format(today, 'yyyy-MM-dd'));
  }, []);

  // Fetch appointment details
  const { data: appointmentData, isLoading: isLoadingAppointment } = useQuery<{ data: Appointment }>(
    ['appointment', id],
    async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${id}`);
      return response.data;
    },
    {
      enabled: !!id && isAuthenticated(),
      onError: () => {
        toast.error('Failed to load appointment details');
        router.push('/appointments');
      },
    }
  );

  // Fetch available slots
  const { data: slotsData, isLoading: isLoadingSlots, refetch: refetchSlots } = useQuery<{ data: Slot[] }>(
    ['doctorSlots', appointmentData?.data?.doctor?.id, selectedDate],
    async () => {
      const params: Record<string, string> = { 
        date: selectedDate,
        mode: appointmentData?.data?.slot?.is_online ? 'online' : 'in-person'
      };
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/doctors/${appointmentData?.data?.doctor?.id}/slots`, 
        { params }
      );
      return response.data;
    },
    {
      enabled: !!appointmentData?.data?.doctor?.id && !!selectedDate,
    }
  );

  // Reschedule appointment mutation
  const rescheduleMutation = useMutation(
    async () => {
      if (!selectedSlot) throw new Error('No slot selected');
      return axios.post(`${process.env.API_URL}/appointments/${id}/reschedule`, {
        new_slot_id: selectedSlot.id,
      });
    },
    {
      onSuccess: () => {
        toast.success('Appointment rescheduled successfully');
        router.push('/appointments');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Failed to reschedule appointment');
        setShowConfirmModal(false);
      },
    }
  );

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  // Handle slot selection
  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  // Handle reschedule confirmation
  const confirmReschedule = () => {
    rescheduleMutation.mutate();
  };

  // Group slots by time
  const groupedSlots = slotsData?.data.reduce((acc, slot) => {
    const time = format(parseISO(slot.start_time), 'h:mm a');
    if (!acc[time]) {
      acc[time] = [];
    }
    acc[time].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>) || {};

  return (
    <>
      <Head>
        <title>Reschedule Appointment | Amrutam</title>
        <meta name="description" content="Reschedule your appointment" />
      </Head>

      <div className="space-y-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/appointments')}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <svg
            className="mr-1 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
          Back to Appointments
        </button>

        <h1 className="text-2xl font-bold text-gray-900">Reschedule Appointment</h1>

        {isLoadingAppointment ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading appointment details...</p>
          </div>
        ) : appointmentData?.data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Appointment */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Current Appointment</h2>
                  
                  <div className="flex items-start space-x-4 mb-6">
                    {appointmentData.data.doctor.profile_image ? (
                      <img
                        src={appointmentData.data.doctor.profile_image}
                        alt={appointmentData.data.doctor.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-medium">
                          {appointmentData.data.doctor.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Dr. {appointmentData.data.doctor.name}
                      </h3>
                      <p className="text-sm text-primary-600">{appointmentData.data.doctor.specialization_name}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Current Date & Time</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {format(parseISO(appointmentData.data.slot.start_time), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {format(parseISO(appointmentData.data.slot.start_time), 'h:mm a')} - 
                        {format(parseISO(appointmentData.data.slot.end_time), 'h:mm a')}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Consultation Type</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {appointmentData.data.slot.is_online ? 'Online Consultation' : 'In-Person Consultation'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* New Appointment Selection */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Select New Date & Time</h2>
                  
                  <div className="mb-6">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={selectedDate}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Available Slots for {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                    </h3>

                    {isLoadingSlots ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Loading available slots...</p>
                      </div>
                    ) : slotsData?.data && slotsData.data.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Object.entries(groupedSlots).map(([time, slots]) => (
                          slots.map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => handleSlotSelect(slot)}
                              disabled={!slot.is_available}
                              className={`py-2 px-4 rounded-md text-sm font-medium ${selectedSlot?.id === slot.id
                                ? 'bg-primary-600 text-white'
                                : slot.is_available
                                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {time}
                            </button>
                          ))
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No available slots for this date.</p>
                        <p className="text-gray-500 mt-1">Please select another date.</p>
                      </div>
                    )}
                  </div>

                  {selectedSlot && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">New Selected Slot</h3>
                      <p className="text-gray-700">
                        {format(parseISO(selectedSlot.start_time), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-gray-700">
                        {format(parseISO(selectedSlot.start_time), 'h:mm a')} - 
                        {format(parseISO(selectedSlot.end_time), 'h:mm a')}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!selectedSlot}
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      Reschedule Appointment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Appointment not found.</p>
            <Link href="/appointments" className="text-primary-600 hover:text-primary-500 mt-2 inline-block">
              Return to appointments
            </Link>
          </div>
        )}
      </div>

      {/* Confirm Reschedule Modal */}
      {showConfirmModal && appointmentData?.data && selectedSlot && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Reschedule</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to reschedule your appointment with Dr. {appointmentData.data.doctor.name}?
            </p>
            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium text-gray-700">From:</p>
                <p className="text-sm text-gray-600">
                  {format(parseISO(appointmentData.data.slot.start_time), 'MMMM d, yyyy')} at{' '}
                  {format(parseISO(appointmentData.data.slot.start_time), 'h:mm a')}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium text-gray-700">To:</p>
                <p className="text-sm text-gray-600">
                  {format(parseISO(selectedSlot.start_time), 'MMMM d, yyyy')} at{' '}
                  {format(parseISO(selectedSlot.start_time), 'h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReschedule}
                disabled={rescheduleMutation.isLoading}
                className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {rescheduleMutation.isLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RescheduleAppointmentPage;