interface Doctor {
  _id?: string;
  name?: string;
  profileImage?: string;
  user?: {
    name?: string;
    email?: string;
    profileImage?: string;
  };
}

/**
 * Get the doctor's profile image URL with proper fallbacks
 * Priority: doctor.profileImage -> doctor.user.profileImage -> placeholder
 */
export const getDoctorImageUrl = (doctor: Doctor | null | undefined): string => {
  // Handle null/undefined doctor
  if (!doctor) {
    return 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face';
  }

  // First priority: doctor's direct profileImage
  if (doctor.profileImage && doctor.profileImage.trim() !== '') {
    return doctor.profileImage;
  }
  
  // Second priority: user's profileImage
  if (doctor.user?.profileImage && doctor.user.profileImage.trim() !== '') {
    return doctor.user.profileImage;
  }
  
  // Fallback to a better default doctor image
  return 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face';
};

/**
 * Get the doctor's display name with proper fallbacks
 * Priority: doctor.name -> doctor.user.name -> doctor.user.email -> 'Doctor'
 */
export const getDoctorDisplayName = (doctor: Doctor | null | undefined): string => {
  // Handle null/undefined doctor
  if (!doctor) {
    return 'Doctor';
  }

  // First priority: doctor's direct name
  if (doctor.name && doctor.name.trim() !== '') {
    const name = doctor.name.trim();
    return name.startsWith('Dr.') ? name : `Dr. ${name}`;
  }
  
  // Second priority: user's name
  if (doctor.user?.name && doctor.user.name.trim() !== '') {
    const name = doctor.user.name.trim();
    return name.startsWith('Dr.') ? name : `Dr. ${name}`;
  }
  
  // Third priority: extract from email
  if (doctor.user?.email && doctor.user.email.trim() !== '') {
    const emailName = doctor.user.email.split('@')[0];
    return `Dr. ${emailName}`;
  }
  
  // Final fallback
  return 'Doctor';
};

/**
 * Get the doctor's initials for avatar fallback
 */
export const getDoctorInitials = (doctor: Doctor | null | undefined): string => {
  // Handle null/undefined doctor
  if (!doctor) {
    return 'D';
  }

  // Try to get name from doctor.name first
  if (doctor.name && doctor.name.trim() !== '') {
    const name = doctor.name.replace('Dr.', '').trim();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
  
  // Try to get name from user.name
  if (doctor.user?.name && doctor.user.name.trim() !== '') {
    const name = doctor.user.name.replace('Dr.', '').trim();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
  
  // Try to get from email
  if (doctor.user?.email && doctor.user.email.trim() !== '') {
    return doctor.user.email.charAt(0).toUpperCase();
  }
  
  // Final fallback
  return 'D';
};

/**
 * Check if an image URL is valid (not empty, not placeholder search URL)
 */
export const isValidImageUrl = (url?: string | null): boolean => {
  if (!url || url.trim() === '') return false;
  
  // Check for invalid URLs like search pages
  const invalidPatterns = [
    '/search/',
    'phrase=',
    'istockphoto.com/search'
  ];
  
  return !invalidPatterns.some(pattern => url.includes(pattern));
};

/**
 * Get a fallback image URL for doctors
 */
export const getDoctorFallbackImage = (): string => {
  return 'https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=Dr';
};
