// Format date to readable string
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    // Create a Date object from the input
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}`);
      return 'Invalid Date';
    }
    
    // Format the date using local date representation
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date Error';
  }
};

// Format date to short format (MM/DD/YYYY)
export const formatShortDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

// Format time to readable string
export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  
  try {
    // If it's already in a readable format like "10:30 AM", just return it
    if (typeof timeString === 'string' && 
        (timeString.includes('AM') || timeString.includes('PM') || 
         timeString.includes('am') || timeString.includes('pm'))) {
      return timeString;
    }
    
    // If it's an ISO date string, properly handle UTC to local conversion
    if (typeof timeString === 'string' && 
        (timeString.includes('T') || timeString.includes('Z'))) {
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    }
    
    // If it's a time string like "14:30", convert to 12-hour format
    if (typeof timeString === 'string' && timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    }
    
    // Fallback: try to parse it as a date
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // Last resort: return as is
    return timeString;
  } catch (e) {
    console.error('Error formatting time:', e);
    return timeString || 'N/A';
  }
};

// Format datetime to display format
export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

// Get date range array between two dates
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

// Check if date is today
export const isToday = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Check if date is past
export const isPastDate = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  return date < today;
};

// Check if date is future
export const isFutureDate = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  return date > today;
};

// Get week start and end dates
export const getWeekDates = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  
  const weekStart = new Date(date.setDate(diff));
  const weekEnd = new Date(date.setDate(diff + 6));
  
  return { weekStart, weekEnd };
};

// Get formatted date ranges for display
export const getDateRangeDisplay = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} - ${end.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'long' })} ${start.getFullYear()}`;
  }
  
  if (start.getFullYear() === end.getFullYear()) {
    return `${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start)} ${start.getDate()} - ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(end)} ${end.getDate()}, ${start.getFullYear()}`;
  }
  
  return `${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start)} ${start.getDate()}, ${start.getFullYear()} - ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(end)} ${end.getDate()}, ${end.getFullYear()}`;
};

// Format currency
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};