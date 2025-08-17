import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface TimeSlot {
  startTime: string;
  endTime: string;
  mode: string;
}

interface Appointment {
  _id: string;
  patient: {
    name: string;
    email: string;
    phone: string;
  };
  appointmentDate: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  consultationMode: string;
  status: string;
  consultationFee: number;
}

interface CalendarDay {
  date: string;
  dayOfWeek: string;
  appointments: Appointment[];
  availableSlots: TimeSlot[];
  totalSlots: number;
  bookedSlots: number;
  isAvailable: boolean;
}

interface CalendarData {
  view: string;
  startDate: string;
  endDate: string;
  calendar: CalendarDay[];
  appointments: Appointment[];
  availability: any[];
}

const DoctorCalendar: React.FC = () => {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, view]);

  const fetchCalendarData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams({
        view,
        month: (currentDate.getMonth() + 1).toString(),
        year: currentDate.getFullYear().toString(),
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/calendar?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch calendar data');
      }

      const result = await response.json();
      setCalendarData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'month':
        navigateMonth(direction);
        break;
      case 'week':
        navigateWeek(direction);
        break;
      case 'day':
        navigateDay(direction);
        break;
    }
  };

  const renderMonthView = () => {
    if (!calendarData) return null;

    const daysInWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeks = [];
    let currentWeek = [];

    // Get first day of month and pad with empty cells
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startPadding = firstDay.getDay();

    for (let i = 0; i < startPadding; i++) {
      currentWeek.push(<div key={`empty-${i}`} className="h-24 border border-gray-200"></div>);
    }

    // Add calendar days
    calendarData.calendar.forEach((day, index) => {
      const dayDate = new Date(day.date);
      const isToday = dayDate.toDateString() === new Date().toDateString();

      currentWeek.push(
        <div key={day.date} className={`h-24 border border-gray-200 p-1 ${isToday ? 'bg-blue-50' : ''}`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
              {dayDate.getDate()}
            </span>
            {day.bookedSlots > 0 && (
              <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                {day.bookedSlots}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {day.appointments.slice(0, 2).map((appointment) => (
              <div
                key={appointment._id}
                className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(appointment.status)} text-white`}
                onClick={() => setSelectedAppointment(appointment)}
              >
                {formatTime(appointment.timeSlot.startTime)} - {appointment.patient.name.split(' ')[0]}
              </div>
            ))}
            {day.appointments.length > 2 && (
              <div className="text-xs text-gray-500">+{day.appointments.length - 2} more</div>
            )}
          </div>
        </div>
      );

      if (currentWeek.length === 7) {
        weeks.push(
          <div key={`week-${weeks.length}`} className="grid grid-cols-7">
            {currentWeek}
          </div>
        );
        currentWeek = [];
      }
    });

    // Add remaining week if not complete
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(<div key={`empty-end-${currentWeek.length}`} className="h-24 border border-gray-200"></div>);
      }
      weeks.push(
        <div key={`week-${weeks.length}`} className="grid grid-cols-7">
          {currentWeek}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-7 bg-gray-50">
          {daysInWeek.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-b">
              {day}
            </div>
          ))}
        </div>
        {weeks}
      </div>
    );
  };

  const renderWeekView = () => {
    if (!calendarData) return null;

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-8 bg-gray-50">
          <div className="p-3 text-center text-sm font-medium text-gray-700 border-b">Time</div>
          {calendarData.calendar.map((day) => (
            <div key={day.date} className="p-3 text-center text-sm font-medium text-gray-700 border-b">
              <div>{day.dayOfWeek.slice(0, 3)}</div>
              <div className="text-lg">{new Date(day.date).getDate()}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8 min-h-96">
          <div className="border-r">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-16 border-b p-2 text-xs text-gray-500">
                {String(9 + i).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {calendarData.calendar.map((day) => (
            <div key={day.date} className="border-r">
              {day.appointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className={`m-1 p-2 rounded text-xs text-white cursor-pointer ${getStatusColor(appointment.status)}`}
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <div className="font-medium">{appointment.patient.name}</div>
                  <div>{formatTime(appointment.timeSlot.startTime)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    if (!calendarData || calendarData.calendar.length === 0) return null;

    const dayData = calendarData.calendar[0];

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            {formatDate(dayData.date)} - {dayData.dayOfWeek}
          </h3>
          <p className="text-gray-600">
            {dayData.bookedSlots} appointments • {dayData.availableSlots.length} available slots
          </p>
        </div>
        <div className="p-6">
          {dayData.appointments.length > 0 ? (
            <div className="space-y-4">
              {dayData.appointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{appointment.patient.name}</h4>
                      <p className="text-sm text-gray-600">{appointment.patient.email}</p>
                      <p className="text-sm text-gray-600">{appointment.patient.phone}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatTime(appointment.timeSlot.startTime)} - {formatTime(appointment.timeSlot.endTime)}
                      </div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(appointment.status).replace('bg-', 'bg-opacity-20 text-').replace('-500', '-800')}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No appointments for this day</p>
            </div>
          )}
        </div>
      </div>
    );
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

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchCalendarData}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <div className="flex space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['month', 'week', 'day'] as const).map((viewType) => (
                  <button
                    key={viewType}
                    onClick={() => setView(viewType)}
                    className={`px-3 py-1 rounded-md text-sm font-medium capitalize ${
                      view === viewType
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {viewType}
                  </button>
                ))}
              </div>
              <button
                onClick={() => router.push('/doctor/availability')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Update Availability
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleNavigation('prev')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {view === 'month' && currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                {view === 'week' && `Week of ${currentDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
                {view === 'day' && currentDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <button
                onClick={() => handleNavigation('next')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar View */}
        <div className="mb-8">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </div>

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Appointment Details</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Patient</label>
                  <p className="text-gray-900">{selectedAppointment.patient.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact</label>
                  <p className="text-gray-900">{selectedAppointment.patient.email}</p>
                  <p className="text-gray-900">{selectedAppointment.patient.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date & Time</label>
                  <p className="text-gray-900">
                    {formatDate(selectedAppointment.appointmentDate)} at{' '}
                    {formatTime(selectedAppointment.timeSlot.startTime)} - {formatTime(selectedAppointment.timeSlot.endTime)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Mode</label>
                  <p className="text-gray-900 capitalize">{selectedAppointment.consultationMode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedAppointment.status).replace('bg-', 'bg-opacity-20 text-').replace('-500', '-800')}`}>
                    {selectedAppointment.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Fee</label>
                  <p className="text-gray-900">₹{selectedAppointment.consultationFee}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DoctorCalendar;
