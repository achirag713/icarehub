using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HospitalManagement.API.Models
{
    public class MedicalRecord
    {
        public int Id { get; set; }
        
        [Required]
        public required Patient Patient { get; set; }
        public int PatientId { get; set; }
        
        [Required]
        public required Doctor Doctor { get; set; }
        public int DoctorId { get; set; }
        
        [Required]
        public DateTime RecordDate { get; set; }
        
        [Required]
        public required string Diagnosis { get; set; }
        
        [Required]
        public required string Prescription { get; set; }
        
        [Required]
        public required string LabResults { get; set; }
        
        [Required]
        public required string Notes { get; set; }
        
        [Required]
        public required string FilePath { get; set; } // For storing lab results or other documents
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
} 