import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface TimeSlot {
  startTime: string;
  endTime: string;
  mode: 'online' | 'in-person';
  isAvailable: boolean;
}

interface Appointment {
  _id: string;
  doctor: {
    _id: string;
    name?: string; // Added name property directly to doctor
    user?: {
      name: string;
    };
    specializations: string[];
    consultationFee: {
      online: number;
      inPerson: number;
    };
  };
  appointmentDate: string;
  timeSlot: {
    startTime: string;
    endTime: string;
    mode: 'online' | 'in-person';
  };
  status: string;
  consultationFee: number;
}

const ReschedulePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, token } = useAuth();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    if (id) {
      fetchAppointment();
    }
  }, [user, token, id]);

  useEffect(() => {
    if (selectedDate && appointment) {
      fetchAvailableSlots();
    }
  }, [selectedDate, appointment]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch appointment');
      }

      const data = await response.json();
      setAppointment(data.data);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Failed to load appointment details');
      router.push('/appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!appointment) return;

    try {
      setLoadingSlots(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/slots/available?doctorId=${appointment.doctor._id}&date=${selectedDate}&mode=${appointment.timeSlot.mode}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }

      const data = await response.json();
      setAvailableSlots(data.data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load available slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedSlot || !appointment) {
      toast.error('Please select a date and time slot');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${id}/reschedule`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            newAppointmentDate: selectedDate,
            newTimeSlot: selectedSlot
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reschedule appointment');
      }

      toast.success('Appointment rescheduled successfully!');
      router.push('/appointments');
    } catch (error: any) {
      console.error('Error rescheduling appointment:', error);
      toast.error(error.message || 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const canReschedule = () => {
    if (!appointment) return false;
    
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);
    
    return hoursUntilAppointment > 24 && ['pending', 'confirmed'].includes(appointment.status);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // Allow booking up to 30 days in advance
    return maxDate.toISOString().split('T')[0];
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Appointment not found</p>
          <button
            onClick={() => router.push('/appointments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  if (!canReschedule()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cannot Reschedule</h2>
          <p className="text-gray-600 mb-6">
            This appointment cannot be rescheduled because it's less than 24 hours away or has already been completed/cancelled.
          </p>
          <button
            onClick={() => router.push('/appointments')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/appointments')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Appointments
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Reschedule Appointment</h1>
          <p className="mt-2 text-gray-600">Select a new date and time for your appointment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Appointment Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Appointment</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Doctor</span>
                <p className="text-lg text-gray-900">
                  {appointment.doctor?.name 
                    ? (appointment.doctor.name.startsWith('Dr.') 
                        ? appointment.doctor.name 
                        : `Dr. ${appointment.doctor.name}`) 
                    : appointment.doctor?.user?.name 
                      ? (appointment.doctor.user.name.startsWith('Dr.') 
                          ? appointment.doctor.user.name 
                          : `Dr. ${appointment.doctor.user.name}`) 
                      : ''}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Specialization</span>
                <p className="text-gray-900">{appointment.doctor.specializations.join(', ')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Current Date & Time</span>
                <p className="text-gray-900">
                  {formatDate(appointment.appointmentDate)} at {formatTime(appointment.timeSlot.startTime)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Mode</span>
                <p className="text-gray-900">
                  {appointment.timeSlot.mode === 'online' ? '📹 Online Consultation' : '🏥 In-person Visit'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Fee</span>
                <p className="text-gray-900">₹{appointment.consultationFee}</p>
              </div>
            </div>
          </div>

          {/* Reschedule Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select New Date & Time</h2>
            
            <div className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot(null);
                  }}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Slot Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Time Slots
                  </label>
                  
                  {loadingSlots ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading available slots...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No available slots for this date</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 border rounded-md text-sm transition-colors ${
                            selectedSlot === slot
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => router.push('/appointments')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!selectedDate || !selectedSlot || submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Rescheduling...' : 'Reschedule Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Notes</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Appointments can only be rescheduled more than 24 hours in advance</li>
                  <li>The consultation fee remains the same</li>
                  <li>You will receive a confirmation email once rescheduled</li>
                  <li>If you need to cancel, please do so from the appointments page</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReschedulePage;
