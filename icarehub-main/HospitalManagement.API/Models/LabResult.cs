using System.ComponentModel.DataAnnotations;

namespace HospitalManagement.API.Models
{
    public class LabResult
    {
        public int Id { get; set; }
        public required Patient Patient { get; set; }
        public int PatientId { get; set; }
        public required Doctor Doctor { get; set; }
        public int DoctorId { get; set; }
        public DateTime TestDate { get; set; }
        public required ICollection<Test> Tests { get; set; }
        public string? Notes { get; set; }
        public string? FilePath { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public class Test
    {
        public int Id { get; set; }
        public required LabResult LabResult { get; set; }
        public int LabResultId { get; set; }
        public required string Name { get; set; }
        public required string Result { get; set; }
        public string? ReferenceRange { get; set; }
        public string? Unit { get; set; }
        public string? Notes { get; set; }
    }
}
