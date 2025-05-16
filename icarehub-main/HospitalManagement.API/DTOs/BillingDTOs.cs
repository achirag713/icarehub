using System.ComponentModel.DataAnnotations;
using HospitalManagement.API.Models;

namespace HospitalManagement.API.DTOs
{
    public class CreateBillingDto
    {
        [Required]
        public int PatientId { get; set; }
        
        [Required]
        public int DoctorId { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }
        
        [Required]
        [StringLength(500, MinimumLength = 3, ErrorMessage = "Description must be between 3 and 500 characters")]
        public string Description { get; set; }
        
        public string? Date { get; set; }
        
        public string? Status { get; set; }
        
        public string? FilePath { get; set; }
    }

    public class UpdateBillingDto
    {
        [Required]
        [EnumDataType(typeof(BillStatus), ErrorMessage = "Status must be a valid bill status")]
        public string Status { get; set; }
        
        public string? FilePath { get; set; }
    }

    public class BillingResponseDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; }
        public int DoctorId { get; set; }
        public string DoctorName { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public string ReceiptNumber { get; set; }
        public string FilePath { get; set; }
    }

    public class BillPaymentDto
    {
        [Required]
        public string PaymentMethod { get; set; }
        
        [Required]
        public string TransactionId { get; set; }
    }
}