using HospitalManagement.API.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HospitalManagement.API.DTOs
{
    // DTOs for Medical Record requests and responses
    
    public class MedicalRecordDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } // Include doctor name for frontend display
        public string DoctorSpecialization { get; set; } // Include specialization for frontend display
        public DateTime RecordDate { get; set; }
        public string Diagnosis { get; set; }
        public string Prescription { get; set; }
        public string LabResults { get; set; }
        public string Notes { get; set; }
        public string FilePath { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
    
    public class CreateMedicalRecordDto
    {
        [Required]
        public int PatientId { get; set; }
        
        [Required]
        public int DoctorId { get; set; }
        
        [Required]
        public DateTime RecordDate { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string Diagnosis { get; set; }
        
        [Required]
        public string Prescription { get; set; }
        
        public string LabResults { get; set; } = string.Empty;
        
        public string Notes { get; set; } = string.Empty;
        
        public string FilePath { get; set; } = string.Empty;
    }
    
    public class UpdateMedicalRecordDto
    {
        public string Diagnosis { get; set; }
        public string Prescription { get; set; }
        public string LabResults { get; set; }
        public string Notes { get; set; }
        public string FilePath { get; set; }
    }
    
    public class PatientMedicalRecordDto
    {
        public int Id { get; set; }
        public DoctorBasicInfoDto Doctor { get; set; }
        public DateTime RecordDate { get; set; }
        public string Diagnosis { get; set; }
        public string Prescription { get; set; }
        public string Notes { get; set; }
        public string FilePath { get; set; }
    }
    
    public class DoctorBasicInfoDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Specialization { get; set; }
    }
}
