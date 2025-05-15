using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HospitalManagement.API.Models
{
    public class Billing
    {
        public int Id { get; set; }
        
        [Required]
        public required Patient Patient { get; set; }
        public int PatientId { get; set; }
        
        [Required]
        public required Doctor Doctor { get; set; }
        public int DoctorId { get; set; }
        
        [Required]
        public DateTime BillingDate { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        
        [Required]
        public required string Description { get; set; }
        
        [Required]
        public required string Status { get; set; } // Paid, Pending, Cancelled
        
        [Required]
        public required string ReceiptNumber { get; set; }
        
        [Required]
        public required string FilePath { get; set; } // For storing receipt PDF
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
} 