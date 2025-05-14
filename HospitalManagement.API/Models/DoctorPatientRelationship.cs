using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HospitalManagement.API.Models
{
    public class DoctorPatientRelationship
    {
        public int Id { get; set; }
        
        public int DoctorId { get; set; }
        public Doctor? Doctor { get; set; }
        
        public int PatientId { get; set; }
        public Patient? Patient { get; set; }
        
        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
        public bool IsPrimary { get; set; }
    }
}
