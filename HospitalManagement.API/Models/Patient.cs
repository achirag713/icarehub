using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HospitalManagement.API.Models
{
    public class Patient
    {
        public int Id { get; set; }
        
        [Required]
        public required User User { get; set; }
        public int UserId { get; set; }
        
        [Required]
        public required string PhoneNumber { get; set; }
        
        [Required]
        public DateTime DateOfBirth { get; set; }
        
        [Required]
        public required string Gender { get; set; }
        
        [Required]
        public required string Address { get; set; }
        
        [Required]
        public required string BloodGroup { get; set; }
        
        [Required]
        public required string MedicalHistory { get; set; }
        
        public NotificationPreferences? NotificationPreferences { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<MedicalRecord> MedicalRecords { get; set; } = new List<MedicalRecord>();
        public ICollection<Billing> Billings { get; set; } = new List<Billing>();
    }

    public class NotificationPreferences
    {
        public int Id { get; set; }
        public required Patient Patient { get; set; }
        public int PatientId { get; set; }
        public bool AppointmentReminders { get; set; }
        public bool TestResults { get; set; }
        public bool PrescriptionUpdates { get; set; }
        public bool BillingAlerts { get; set; }
    }
} 