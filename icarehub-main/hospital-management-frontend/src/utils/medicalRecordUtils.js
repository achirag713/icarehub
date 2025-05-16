/**
 * Medical Record Utilities
 */

/**
 *
 * @param {Object} record 
 * @returns {Object} 
 */
export const normalizeMedicalRecord = (record) => {
  if (!record || typeof record !== 'object') {
    return null;
  }
  
  // Create a normalized record object
  const normalizedRecord = {
    id: record.id || 0,
    recordDate: record.recordDate || record.date || new Date().toISOString(),
    diagnosis: record.diagnosis || '',
    prescription: record.prescription || '',
    notes: record.notes || '',
    filePath: record.filePath || '',
    labResults: record.labResults || ''
  };
  
  // Handle doctor information consistently
  if (record.doctor && typeof record.doctor === 'object') {
    normalizedRecord.doctor = {
      id: record.doctor.id || 0,
      name: record.doctor.name || 'Unknown',
      specialization: record.doctor.specialization || 'Specialist'
    };
  } else if (record.doctorName) {
    // Fallback if only doctor name is provided
    normalizedRecord.doctor = {
      id: 0,
      name: record.doctorName,
      specialization: record.doctor?.specialization || 'Specialist'
    };
  } else {
    // Default doctor object if no data is available
    normalizedRecord.doctor = {
      id: 0,
      name: 'Unknown',
      specialization: 'Specialist'
    };
  }
  
  return normalizedRecord;
};

/**
 * Formats a prescription string to display each medication on a separate line
 * @param {string} prescription - The prescription string with medications separated by commas
 * @returns {string[]} - Array of individual medication items
 */
export const formatPrescription = (prescription) => {
  if (!prescription) return [];
  
  return prescription
    .split(',')
    .map(item => item.trim())
    .filter(item => item !== '');
};

/**
 * Formats notes string to display each note on a separate line
 * @param {string} notes - The notes string with items separated by commas
 * @returns {string[]} - Array of individual note items
 */
export const formatNotes = (notes) => {
  if (!notes) return [];
  
  return notes
    .split(',')
    .map(item => item.trim())
    .filter(item => item !== '');
};

/**
 * Creates a summary of the prescription for display in cards
 * @param {string} prescription - The full prescription text
 * @param {number} maxLength - Maximum length of the summary
 * @returns {string} - Truncated prescription summary
 */
export const getPrescriptionSummary = (prescription, maxLength = 50) => {
  if (!prescription) return 'No prescription';
  
  return prescription.length > maxLength 
    ? `${prescription.substring(0, maxLength)}...` 
    : prescription;
};

/**
 * Creates a summary of the diagnosis for display in cards
 * @param {string} diagnosis - The full diagnosis text
 * @param {number} maxLength - Maximum length of the summary
 * @returns {string} - Truncated diagnosis summary
 */
export const getDiagnosisSummary = (diagnosis, maxLength = 100) => {
  if (!diagnosis) return 'No diagnosis recorded';
  
  return diagnosis.length > maxLength 
    ? `${diagnosis.substring(0, maxLength)}...` 
    : diagnosis;
};
