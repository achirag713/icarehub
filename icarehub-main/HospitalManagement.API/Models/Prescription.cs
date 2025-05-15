using System.ComponentModel.DataAnnotations;

namespace HospitalManagement.API.Models
{
    public class Prescription
    {
        public int Id { get; set; }
        public required Patient Patient { get; set; }
        public int PatientId { get; set; }
        public required Doctor Doctor { get; set; }
        public int DoctorId { get; set; }
        public DateTime PrescribedDate { get; set; }
        public required string Diagnosis { get; set; }
        public required ICollection<Medication> Medications { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public class Medication
    {
        public int Id { get; set; }
        public required Prescription Prescription { get; set; }
        public int PrescriptionId { get; set; }
        public required string Name { get; set; }
        public required string Dosage { get; set; }
        public required string Frequency { get; set; }
        public required string Duration { get; set; }
        public string? Instructions { get; set; }
    }
} 