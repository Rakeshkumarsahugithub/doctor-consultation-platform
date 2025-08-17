import { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getDoctorImageUrl, getDoctorDisplayName, getDoctorInitials } from '@/utils/doctorImageUtils';

interface Appointment {
  _id: string;
  doctor: {
    _id: string;
    specializations: string[];
    name?: string;
    profileImage?: string;
    user?: {
      name: string;
      email: string;
      profileImage?: string;
    };
  };
  appointmentDate: string;
  slot: {
    startTime: string;
    endTime: string;
    mode: string;
  };
  status: 'booked' | 'completed' | 'cancelled' | 'confirmed' | 'pending';
  createdAt: string;
  canReschedule: boolean;
  canCancel: boolean;
}

interface AppointmentsResponse {
  success: boolean;
  data: {
    appointments: Appointment[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  };
}

const AppointmentsPage: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  
  // Redirect to login if not authenticated
  if (typeof window !== 'undefined' && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  // Fetch user appointments
  const { data: appointmentsData, isLoading, error } = useQuery<AppointmentsResponse>(
    ['appointments', statusFilter],
    async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/user`, { 
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    {
      enabled: !!isAuthenticated && !!user,
      refetchOnWindowFocus: false,
    }
  );

  // Cancel appointment mutation
  const cancelMutation = useMutation(
    async (appointmentId: string) => {
      return axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
    },
    {
      onSuccess: () => {
        toast.success('Appointment cancelled successfully');
        setShowCancelModal(false);
        queryClient.invalidateQueries(['appointments']);
      },
      onError: (error: any) => {
        console.error('Cancel appointment error:', error);
        toast.error(error.response?.data?.message || 'Failed to cancel appointment');
      },
    }
  );

  // Reschedule appointment mutation
  const rescheduleMutation = useMutation(
    async ({ appointmentId, newDate, newTimeSlot }: { appointmentId: string; newDate: string; newTimeSlot: any }) => {
      return axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/reschedule`,
        {
          newDate,
          newTimeSlot,
          reason: 'Patient requested reschedule'
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
    },
    {
      onSuccess: () => {
        toast.success('Appointment rescheduled successfully');
        queryClient.invalidateQueries(['appointments']);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
      },
    }
  );

  const handleCancelAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = () => {
    if (selectedAppointment) {
      cancelMutation.mutate(selectedAppointment._id);
    }
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
    setSelectedDate('');
    setSelectedSlot(null);
    setAvailableSlots([]);
  };

  const fetchAvailableSlots = async (date: string) => {
    if (!selectedAppointment) return;
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/doctors/${selectedAppointment.doctor._id}/availability`,
        {
          params: { date },
        }
      );
      
      if (response.data.success) {
        setAvailableSlots(response.data.data.availableSlots || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to fetch available slots');
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) {
      fetchAvailableSlots(date);
    }
  };

  const confirmReschedule = () => {
    if (selectedAppointment && selectedDate && selectedSlot) {
      rescheduleMutation.mutate({
        appointmentId: selectedAppointment._id,
        newDate: selectedDate,
        newTimeSlot: {
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime
        }
      });
    }
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if appointment is upcoming
  const isUpcoming = (appointment: Appointment) => {
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.slot.startTime}`);
    return appointmentDateTime > new Date();
  };

  return (
    <>
      <Head>
        <title>My Appointments | Amrutam</title>
        <meta name="description" content="View and manage your appointments" />
      </Head>

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <Link
            href="/doctors"
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Book New Appointment
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All Statuses</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading appointments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Error loading appointments. Please try again.</p>
            </div>
          ) : appointmentsData?.data?.appointments && appointmentsData.data.appointments.length > 0 ? (
            <div className="space-y-4">
              {appointmentsData.data.appointments.map((appointment) => (
                <div key={appointment._id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start space-x-4">
                        <img 
                          src={getDoctorImageUrl(appointment.doctor)}
                          alt={getDoctorDisplayName(appointment.doctor)}
                          className="h-12 w-12 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallbackDiv = target.nextElementSibling as HTMLElement;
                            if (fallbackDiv) fallbackDiv.style.display = 'flex';
                          }}
                        />
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-primary-600 text-lg font-medium">
                            {getDoctorInitials(appointment.doctor)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {getDoctorDisplayName(appointment.doctor)}
                          </h3>
                          <p className="text-sm text-primary-600">{appointment.doctor?.specializations?.[0] || 'General Medicine'}</p>
                        </div>
                      </div>

                      <div className="mt-4 md:mt-0">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                            ['booked', 'confirmed', 'pending'].includes(appointment.status)
                              ? 'bg-green-100 text-green-800'
                              : appointment.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {appointment.status === 'confirmed' || appointment.status === 'pending' ? 'Booked' : 
                           appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Appointment Date & Time</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(appointment.appointmentDate)}
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {appointment.slot.startTime} - {appointment.slot.endTime}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Consultation Type</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {appointment.slot?.mode === 'online' ? 'Online Consultation' : 'In-Person Consultation'}
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          Booked on {formatDate(appointment.createdAt)}
                        </p>
                      </div>
                    </div>

                    {(['booked', 'confirmed', 'pending'].includes(appointment.status)) && (
                      <div className="mt-6 flex flex-wrap gap-3">
                        {/* Always show reschedule button if appointment allows it */}
                        {appointment.canReschedule && (
                          <button
                            onClick={() => handleRescheduleAppointment(appointment)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            Reschedule
                          </button>
                        )}
                        
                        {/* Always show cancel button, but disable if within 24 hours */}
                        <button
                          onClick={() => appointment.canCancel ? handleCancelAppointment(appointment) : null}
                          disabled={!appointment.canCancel}
                          className={`inline-flex items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium ${
                            appointment.canCancel 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Cancel
                        </button>

                        {/* Show warning message if after 24 hours */}
                        {!appointment.canCancel && !appointment.canReschedule && (
                          <p className="text-sm text-amber-600 mt-2">
                            Cannot modify appointment after 24 hours or past appointment time
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No appointments found.</p>
              <Link
                href="/doctors"
                className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-500"
              >
                Book your first appointment
                <svg
                  className="ml-1 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Appointment Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Appointment</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to cancel your appointment with {getDoctorDisplayName(selectedAppointment.doctor)} on{' '}
              {formatDate(selectedAppointment.appointmentDate)} at{' '}
              {selectedAppointment.slot.startTime} - {selectedAppointment.slot.endTime}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                No, Keep It
              </button>
              <button
                onClick={confirmCancelAppointment}
                disabled={cancelMutation.isLoading}
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {cancelMutation.isLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reschedule Appointment</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Current appointment: {getDoctorDisplayName(selectedAppointment.doctor)} on{' '}
                {formatDate(selectedAppointment.appointmentDate)} at{' '}
                {selectedAppointment.slot.startTime} - {selectedAppointment.slot.endTime}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {selectedDate && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Time Slots
                </label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {availableSlots.filter(slot => slot.available).map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-md text-sm font-medium ${
                          selectedSlot === slot
                            ? 'bg-primary-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {formatTime(slot.startTime)}
                        <div className={`text-xs mt-1 ${
                          selectedSlot === slot ? 'text-white' : 
                          slot.mode === 'online' ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {slot.mode === 'online' ? 'Online' : 'In-Person'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No available slots for this date</p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedDate('');
                  setSelectedSlot(null);
                  setAvailableSlots([]);
                }}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReschedule}
                disabled={!selectedDate || !selectedSlot || rescheduleMutation.isLoading}
                className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AppointmentsPage;