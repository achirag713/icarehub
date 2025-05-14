using System;
using System.ComponentModel.DataAnnotations;

namespace HospitalManagement.API.DTOs
{
    public class PatientUpdateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string PhoneNumber { get; set; } = string.Empty;
        
        [Required]
        public DateTime DateOfBirth { get; set; }
        
        [Required]
        public string Gender { get; set; } = string.Empty;
        
        [Required]
        public string Address { get; set; } = string.Empty;
        
        [Required]
        public string BloodGroup { get; set; } = string.Empty;
        
        [Required]
        public string MedicalHistory { get; set; } = string.Empty;
    }

    public class CreatePatientDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        public string PhoneNumber { get; set; } = string.Empty;
        
        [Required]
        public DateTime DateOfBirth { get; set; }
        
        [Required]
        public string Gender { get; set; } = string.Empty;
        
        [Required]
        public string Address { get; set; } = string.Empty;
        
        [Required]
        public string BloodGroup { get; set; } = string.Empty;
        
        [Required]
        public string MedicalHistory { get; set; } = string.Empty;
    }

    public class PatientProfileDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int Age { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
        public string MedicalHistory { get; set; } = string.Empty;
        public DateTime? LastVisit { get; set; }
    }

    public class NotificationPreferencesDto
    {
        public bool AppointmentReminders { get; set; } = true;
        public bool TestResults { get; set; } = true;
        public bool PrescriptionUpdates { get; set; } = true;
        public bool BillingAlerts { get; set; } = true;
    }
}