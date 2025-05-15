// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (at least 6 characters, one number, one uppercase)
export const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

// Phone number validation
export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

// Name validation (letters, spaces, hyphens, apostrophes)
export const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(name);
};

// Date validation (YYYY-MM-DD)
export const validateDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d) && d.toISOString().slice(0, 10) === date;
};

// Time validation (HH:mm)
export const validateTime = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Required field validation
export const validateRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};

// Length validation
export const validateLength = (value, min, max) => {
  const length = value?.toString().length || 0;
  return length >= min && (max ? length <= max : true);
};

// Number range validation
export const validateNumberRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && (max ? num <= max : true);
};

// Form field validator
export function validateField(value, validations = []) {
  for (const validation of validations) {
    switch (validation.type) {
      case 'required':
        if (!validateRequired(value)) {
          return validation.message || 'This field is required';
        }
        break;
      case 'email':
        if (!validateEmail(value)) {
          return validation.message || 'Please enter a valid email';
        }
        break;
      case 'password':
        if (!validatePassword(value)) {
          return validation.message || 'Password must be at least 6 characters with one number and one uppercase letter';
        }
        break;
      case 'phone':
        if (!validatePhone(value)) {
          return validation.message || 'Please enter a valid phone number';
        }
        break;
      case 'name':
        if (!validateName(value)) {
          return validation.message || 'Please enter a valid name';
        }
        break;
      case 'date':
        if (!validateDate(value)) {
          return validation.message || 'Please enter a valid date (YYYY-MM-DD)';
        }
        break;
      case 'time':
        if (!validateTime(value)) {
          return validation.message || 'Please enter a valid time (HH:mm)';
        }
        break;
      case 'length':
        if (!validateLength(value, validation.min, validation.max)) {
          return validation.message || `Length must be between ${validation.min} and ${validation.max} characters`;
        }
        break;
      case 'range':
        if (!validateNumberRange(value, validation.min, validation.max)) {
          return validation.message || `Value must be between ${validation.min} and ${validation.max}`;
        }
        break;
      default:
        break;
    }
  }
  return '';
}

// Form validator
export function validateForm(formData, validationRules) {
  const errors = {};
  
  Object.keys(validationRules).forEach((field) => {
    const error = validateField(formData[field], validationRules[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};