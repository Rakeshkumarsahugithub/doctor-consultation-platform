import React from 'react';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, GlobeAltIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { getDoctorImageUrl, getDoctorDisplayName, getDoctorInitials } from '@/utils/doctorImageUtils';

interface Doctor {
  _id: string;
  user?: {
    name: string;
    profileImage?: string;
  };
  name?: string;
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
  nextAvailableSlot?: string;
}

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const renderStars = (rating: number | undefined) => {
    // Ensure rating is a number
    const ratingValue = typeof rating === 'number' ? rating : 0;
    
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );

    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(ratingValue);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
  };

  const formatAvailability = (nextSlot?: string) => {
    if (!nextSlot) return null;
    
    try {
      const date = new Date(nextSlot);
      if (isNaN(date.getTime())) return null;
      
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
      {/* Doctor Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 relative">
            <img
              className="h-20 w-20 rounded-full object-cover ring-4 ring-primary-50"
              src={getDoctorImageUrl(doctor)}
              alt={getDoctorDisplayName(doctor)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallbackDiv = target.nextElementSibling as HTMLElement;
                if (fallbackDiv) fallbackDiv.style.display = 'flex';
              }}
            />
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center ring-4 ring-primary-50" style={{display: 'none'}}>
              <span className="text-primary-600 font-bold text-xl">
                {getDoctorInitials(doctor)}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
              {getDoctorDisplayName(doctor)}
            </h3>
            
            {/* Specializations */}
            <div className="mb-2">
              <div className="flex flex-wrap gap-1.5">
                {doctor.specializations.slice(0, 2).map((spec, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 border border-primary-200"
                  >
                    {spec}
                  </span>
                ))}
                {doctor.specializations.length > 2 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    +{doctor.specializations.length - 2} more
                  </span>
                )}
              </div>
            </div>

            {/* Experience & Rating */}
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4 mr-1" />
                <span className="font-medium">{doctor.experience} years experience</span>
              </div>
              
              <div className="flex items-center">
                <div className="flex items-center">
                  <span className="flex items-center">
                    {renderStars(doctor.rating && typeof doctor.rating.average === 'number' ? doctor.rating.average : 0)}
                  </span>
                  <span className="text-xs font-bold text-primary-700">
                    {doctor.rating && typeof doctor.rating.average === 'number' ? doctor.rating.average.toFixed(1) : '0'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {doctor.rating && doctor.rating.count ? `(${doctor.rating.count})` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mt-3">
          {doctor.bio}
        </p>
      </div>

      {/* Consultation Info */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100">
        {/* Consultation Modes */}
        <div className="flex items-center space-x-3 mb-3">
          {doctor.consultationModes.includes('online') && (
            <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
              <GlobeAltIcon className="w-4 h-4 mr-1.5" />
              <span className="font-medium">Online</span>
            </div>
          )}
          {doctor.consultationModes.includes('in-person') && (
            <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <MapPinIcon className="w-4 h-4 mr-1.5" />
              <span className="font-medium">In-Person</span>
            </div>
          )}
        </div>

        {/* Languages */}
        {doctor.languages && doctor.languages.length > 0 && (
          <div className="flex items-center mb-3">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-xs text-gray-600">
              <span className="font-medium">Languages:</span> {doctor.languages.slice(0, 3).join(', ')}
              {doctor.languages.length > 3 && ` +${doctor.languages.length - 3} more`}
            </span>
          </div>
        )}

        {/* Consultation Fees */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">💰 Consultation Fee:</p>
              <div className="space-y-1">
                {doctor.consultationModes.includes('online') && doctor.consultationFee && typeof doctor.consultationFee.online === 'number' && (
                  <div className="text-sm font-semibold text-gray-900">
                    Online: <span className="text-primary-600">{formatCurrency(doctor.consultationFee.online)}</span>
                  </div>
                )}
                {doctor.consultationModes.includes('in-person') && doctor.consultationFee && typeof doctor.consultationFee.inPerson === 'number' && (
                  <div className="text-sm font-semibold text-gray-900">
                    In-Person: <span className="text-primary-600">{formatCurrency(doctor.consultationFee.inPerson)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between space-x-3">
          {/* Availability */}
          <div className="flex-1">
            {formatAvailability(doctor.nextAvailableSlot) ? (
              <div className="text-xs text-gray-600">
                <span className="font-medium text-green-600">📅 Next available:</span>
                <br />
                <span>{formatAvailability(doctor.nextAvailableSlot)}</span>
              </div>
            ) : (
              <button className="text-xs text-primary-600 hover:text-primary-700 font-medium bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-200 transition-colors">
                📅 Check Availability
              </button>
            )}
          </div>
          
          <Link
            href={`/doctors/${doctor._id}`}
            className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
          >
            🔗 View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
