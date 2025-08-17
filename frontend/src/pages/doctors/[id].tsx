import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getDoctorImageUrl, getDoctorDisplayName, getDoctorInitials } from '@/utils/doctorImageUtils';

interface Doctor {
  _id: string;
  name?: string;
  user?: {
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
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
  availability: {
    schedule: {
      day: string;
      slots: {
        startTime: string;
        endTime: string;
        mode: string;
      }[];
    }[];
  };
  reviews?: Array<{
    patientName: string;
    rating: number;
    review: string;
    date: string;
  }>;
}

interface AvailableSlot {
  startTime: string;
  endTime: string;
  mode: string;
  available: boolean;
  fee?: number;
}

interface SlotReservation {
  success: boolean;
  data: {
    lockId: string;
    expiresAt: string;
  };
}

interface DoctorResponse {
  success: boolean;
  data: Doctor;
}

interface AvailabilityResponse {
  success: boolean;
  data: {
    date: string;
    doctorId: string;
    availableSlots: AvailableSlot[];
  };
}

const DoctorDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [lockId, setLockId] = useState<string | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Format today's date as YYYY-MM-DD for the date input
  useEffect(() => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  // Fetch doctor details
  const { data: doctorData, isLoading: isLoadingDoctor } = useQuery<DoctorResponse>(
    ['doctor', id],
    async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/doctors/${id}`);
      return response.data;
    },
    {
      enabled: !!id,
    }
  );

  // Fetch available slots
  const { data: slotsData, isLoading: isLoadingSlots, refetch: refetchSlots } = useQuery<AvailabilityResponse>(
    ['doctorSlots', id, selectedDate],
    async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/doctors/${id}/availability`, {
        params: { 
          date: selectedDate 
        }
      });
      return response.data;
    },
    {
      enabled: !!id && !!selectedDate,
    }
  );

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  // Handle slot selection
  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
  };

  // Reserve a slot
  const reserveSlot = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please login to book an appointment');
      router.push(`/login?redirect=/doctors/${id}`);
      return;
    }

    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    setIsReserving(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/slots/lock`,
        {
          doctorId: id,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          mode: selectedSlot.mode,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setLockId(response.data.data.lockId);
      setShowOtpModal(true);
      toast.success('Slot reserved for 5 minutes. Please confirm with OTP.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reserve slot. Please try again.');
    } finally {
      setIsReserving(false);
    }
  };

  // Confirm appointment with OTP
  const confirmAppointment = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setIsConfirming(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/slots/verify-otp`,
        {
          lockId,
          otp,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      toast.success('Appointment confirmed successfully!');
      setShowOtpModal(false);
      setOtp('');
      setLockId(null);
      setSelectedSlot(null);
      refetchSlots();
      router.push('/appointments');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to confirm appointment. Please try again.');
    } finally {
      setIsConfirming(false);
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

  // Get doctor's display name
  const getDisplayName = () => {
    if (!doctorData?.data) return 'Doctor Profile';
    return getDoctorDisplayName(doctorData.data);
  };

  return (
    <>
      <Head>
        <title>{getDisplayName()} | Amrutam</title>
        <meta name="description" content="Book an appointment with an Ayurvedic doctor" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6"
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
          Back to Doctors
        </button>

        {isLoadingDoctor ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading doctor profile...</p>
          </div>
        ) : doctorData?.data ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Doctor Profile */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col items-center">
                    <img 
                      src={getDoctorImageUrl(doctorData.data)}
                      alt={getDisplayName()} 
                      className="h-32 w-32 rounded-full object-cover mb-4 border-4 border-primary-100"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallbackDiv = target.nextElementSibling as HTMLElement;
                        if (fallbackDiv) fallbackDiv.style.display = 'flex';
                      }}
                    />
                    <div className="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center mb-4" style={{display: 'none'}}>
                      <span className="text-primary-600 text-4xl font-medium">
                        {getDoctorInitials(doctorData.data)}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 text-center">
                      {getDisplayName()}
                    </h1>
                    <p className="text-lg text-primary-600 mt-1 text-center">
                      {doctorData.data.specializations?.[0] || 'General Medicine'}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="text-sm text-gray-600">
                        {doctorData.data.rating.average.toFixed(1)} ({doctorData.data.rating.count} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-500">Experience</span>
                      <span className="font-medium text-gray-900">{doctorData.data.experience} years</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-500">Qualification</span>
                      <span className="font-medium text-gray-900">
                        {doctorData.data.qualifications?.[0]?.degree || 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-500">Consultation Fee</span>
                      <span className="font-medium text-gray-900">
                        Online: ₹{doctorData.data.consultationFee.online} | In-Person: ₹{doctorData.data.consultationFee.inPerson}
                      </span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-gray-500">Consultation Modes</span>
                      <div className="flex flex-wrap gap-1">
                        {doctorData.data.consultationModes.map((mode) => (
                          <span
                            key={mode}
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              mode === 'online' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {mode === 'online' ? 'Online' : 'In-Person'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                    <p className="text-gray-600">{doctorData.data.bio}</p>
                  </div>

                  {doctorData.data.availability?.schedule && doctorData.data.availability.schedule.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Weekly Availability</h3>
                      <div className="space-y-2">
                        {doctorData.data.availability.schedule.map((avail, index) => (
                          <div key={index} className="py-2 border-b border-gray-100">
                            <div className="flex justify-between items-start">
                              <span className="text-gray-500 font-medium capitalize">{avail.day}</span>
                              <div className="text-right">
                                {avail.slots.map((slot, slotIndex) => (
                                  <div key={slotIndex} className="text-sm text-gray-700">
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                    <span className={`ml-1 text-xs ${
                                      slot.mode === 'online' ? 'text-blue-600' : 'text-orange-600'
                                    }`}>
                                      ({slot.mode === 'online' ? 'Online' : 'In-Person'})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Booking */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-lg border border-primary-100">
                <div className="p-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Book an Appointment</h2>
                    <p className="text-gray-600 text-sm">Select your preferred date and time slot</p>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📅 Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    />
                  </div>

                  {selectedDate && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        🕐 Available Slots
                      </h3>

                      {isLoadingSlots ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                          <p className="text-gray-500 text-sm">Loading slots...</p>
                        </div>
                      ) : slotsData?.data?.availableSlots && slotsData.data.availableSlots.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {slotsData.data.availableSlots.map((slot, index) => (
                            <button
                              key={index}
                              onClick={() => handleSlotSelect(slot)}
                              disabled={!slot.available}
                              className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                selectedSlot === slot
                                  ? 'bg-primary-600 text-white shadow-md'
                                  : slot.available
                                  ? 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-semibold">{formatTime(slot.startTime)}</div>
                                  <div className={`text-xs ${
                                    selectedSlot === slot ? 'text-primary-100' : 
                                    slot.mode === 'online' ? 'text-blue-600' : 'text-orange-600'
                                  }`}>
                                    {slot.mode === 'online' ? '💻 Online' : '🏥 In-Person'}
                                  </div>
                                </div>
                                <div className={`text-sm font-medium ${
                                  selectedSlot === slot ? 'text-white' : 'text-gray-600'
                                }`}>
                                  ₹{slot.fee}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-2xl mb-2">📅</div>
                          <p className="text-gray-500 text-sm font-medium">No slots available</p>
                          <p className="text-gray-400 text-xs mt-1">Try another date</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!selectedDate && (
                    <div className="text-center py-8 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border-2 border-dashed border-primary-200">
                      <div className="text-2xl mb-2">📅</div>
                      <p className="text-gray-600 text-sm font-medium">Select a date to view slots</p>
                    </div>
                  )}

                  {selectedSlot && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-primary-100 to-primary-50 rounded-lg border border-primary-200">
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mr-2"></div>
                        <h4 className="text-sm font-semibold text-primary-900">Selected</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-primary-800 text-sm font-medium">
                          📅 {formatDate(selectedDate)}
                        </p>
                        <p className="text-primary-800 text-sm">
                          🕐 {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                        </p>
                        <p className="text-primary-700 text-sm flex items-center">
                          {selectedSlot.mode === 'online' ? '💻' : '🏥'} 
                          <span className="ml-1">{selectedSlot.mode === 'online' ? 'Online' : 'In-Person'}</span>
                        </p>
                        <p className="text-primary-600 font-semibold">
                          💰 ₹{selectedSlot.fee}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={reserveSlot}
                    disabled={!selectedDate || !selectedSlot || isReserving}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {isReserving ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="mr-2">📋</span>
                        Book Appointment
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Doctor not found</p>
          </div>
        )}
      </div>

      {/* OTP Confirmation Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Appointment</h3>
            <p className="text-gray-500 mb-4">
              Please enter the OTP to confirm your appointment.
              <br />
              <span className="text-xs text-gray-400">(For demo purposes, use: 123456)</span>
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setOtp('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmAppointment}
                disabled={isConfirming}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConfirming ? 'Confirming...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorDetailPage;