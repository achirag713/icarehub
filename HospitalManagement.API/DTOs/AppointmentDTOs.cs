using System;
using System.ComponentModel.DataAnnotations;
using HospitalManagement.API.Models;

namespace HospitalManagement.API.DTOs
{
    public class CreateAppointmentDto
    {
        [Required]
        public int DoctorId { get; set; }
        
        [Required]
        public DateTime AppointmentDate { get; set; }
        
        public string? DisplayTime { get; set; }
        
        public string? Reason { get; set; }
        
        public string? Notes { get; set; }
    }

    public class UpdateAppointmentDto
    {
        [Required]
        public int Id { get; set; }
        
        [Required]
        public DateTime AppointmentDate { get; set; }
        
        public string? DisplayTime { get; set; }
        
        public string? Reason { get; set; }
        
        public string? Notes { get; set; }
        
        public AppointmentStatus Status { get; set; }
    }

    public class AppointmentResponseDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string DoctorSpecialization { get; set; } = string.Empty;
        public DateTime AppointmentDate { get; set; }
        public string DisplayTime { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CancelAppointmentDto
    {
        public string? CancellationReason { get; set; }
    }
}