import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface TimeSlot {
  startTime: string;
  endTime: string;
  mode: 'online' | 'in-person';
}

interface DaySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  slots: TimeSlot[];
}

const DoctorAvailability: React.FC = () => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: 'monday', slots: [] },
    { day: 'tuesday', slots: [] },
    { day: 'wednesday', slots: [] },
    { day: 'thursday', slots: [] },
    { day: 'friday', slots: [] },
    { day: 'saturday', slots: [] },
    { day: 'sunday', slots: [] },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCurrentAvailability();
  }, []);

  const fetchCurrentAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/doctor-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.availability?.schedule) {
          setSchedule(result.data.availability.schedule);
        }
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/availability`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedule }),
      });

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }

      setSuccess('Availability updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.push({
      startTime: '09:00',
      endTime: '10:00',
      mode: 'online'
    });
    setSchedule(newSchedule);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.splice(slotIndex, 1);
    setSchedule(newSchedule);
  };

  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: keyof TimeSlot, value: string) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots[slotIndex] = {
      ...newSchedule[dayIndex].slots[slotIndex],
      [field]: value
    };
    setSchedule(newSchedule);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const copySchedule = (fromDay: number, toDay: number) => {
    const newSchedule = [...schedule];
    newSchedule[toDay].slots = [...newSchedule[fromDay].slots];
    setSchedule(newSchedule);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Availability Settings</h1>
              <p className="text-gray-600 mt-2">Manage your consultation schedule and time slots</p>
            </div>
            <button
              onClick={() => router.push('/doctor/calendar')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              View Calendar
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Schedule Configuration */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
            <p className="text-sm text-gray-600 mt-1">Set your available time slots for each day of the week</p>
          </div>

          <div className="p-6">
            <div className="space-y-8">
              {schedule.map((daySchedule, dayIndex) => (
                <div key={daySchedule.day} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 capitalize">
                      {daySchedule.day}
                    </h3>
                    <div className="flex space-x-2">
                      {dayIndex > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              copySchedule(parseInt(e.target.value), dayIndex);
                              e.target.value = '';
                            }
                          }}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1"
                          defaultValue=""
                        >
                          <option value="">Copy from...</option>
                          {schedule.slice(0, dayIndex).map((day, index) => (
                            <option key={day.day} value={index} className="capitalize">
                              {day.day}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => addTimeSlot(dayIndex)}
                        className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                      >
                        Add Slot
                      </button>
                    </div>
                  </div>

                  {daySchedule.slots.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-md">
                      <p className="text-gray-500">No time slots configured for this day</p>
                      <button
                        onClick={() => addTimeSlot(dayIndex)}
                        className="mt-2 text-green-600 hover:text-green-700 font-medium"
                      >
                        Add your first time slot
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {daySchedule.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center space-x-4 bg-gray-50 p-3 rounded-md">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time
                              </label>
                              <select
                                value={slot.startTime}
                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                {timeOptions.map((time) => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Time
                              </label>
                              <select
                                value={slot.endTime}
                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                {timeOptions.map((time) => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mode
                              </label>
                              <select
                                value={slot.mode}
                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'mode', e.target.value as 'online' | 'in-person')}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                <option value="online">Online</option>
                                <option value="in-person">In-Person</option>
                              </select>
                            </div>
                          </div>
                          <button
                            onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                            className="text-red-600 hover:text-red-700 p-2"
                            title="Remove slot"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Changes will be applied immediately and affect future appointment bookings.
              </p>
              <button
                onClick={updateAvailability}
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const standardSchedule = schedule.map(day => ({
                  ...day,
                  slots: day.day === 'sunday' ? [] : [
                    { startTime: '09:00', endTime: '12:00', mode: 'online' as const },
                    { startTime: '14:00', endTime: '17:00', mode: 'in-person' as const }
                  ]
                }));
                setSchedule(standardSchedule);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Set Standard Hours
            </button>
            <button
              onClick={() => {
                const clearSchedule = schedule.map(day => ({ ...day, slots: [] }));
                setSchedule(clearSchedule);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Clear All Slots
            </button>
            <button
              onClick={() => router.push('/doctor/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DoctorAvailability;
