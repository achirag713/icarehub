using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HospitalManagement.API.Utilities;

namespace HospitalManagement.API.Models
{
    public class Appointment
    {
        public int Id { get; set; }
        
        public int PatientId { get; set; }
        public Patient? Patient { get; set; }
        
        public int DoctorId { get; set; }
        public Doctor? Doctor { get; set; }
        
        [Required]
        public DateTime AppointmentDate { get; set; }
        
        public string DisplayTime { get; set; } = string.Empty;
        
        [Required]
        public string Reason { get; set; } = string.Empty;
        
        [Required]
        public string Notes { get; set; } = string.Empty;
        
        public AppointmentStatus Status { get; set; }
        
        public DateTime CreatedAt { get; set; } = TimeUtility.NowIst();
        public DateTime? UpdatedAt { get; set; }
    }

    public enum AppointmentStatus
    {
        Scheduled,
        Completed,
        Cancelled,
        NoShow
    }
} 