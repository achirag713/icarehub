using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HospitalManagement.API.Models
{
    public class Doctor
    {
        public int Id { get; set; }
        
        [Required]
        public required User User { get; set; }
        public int UserId { get; set; }
        
        [Required]
        public required string Specialization { get; set; }
        
        [Required]
        public required string LicenseNumber { get; set; }
        
        [Required]
        public required string PhoneNumber { get; set; }
        
        [Required]
        public required string Address { get; set; }
        
        public required ICollection<Schedule> Schedule { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<MedicalRecord> MedicalRecords { get; set; } = new List<MedicalRecord>();
        public ICollection<Billing> Billings { get; set; } = new List<Billing>();
    }

    public class Schedule
    {
        public int Id { get; set; }
        public required Doctor Doctor { get; set; }
        public int DoctorId { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }
} 