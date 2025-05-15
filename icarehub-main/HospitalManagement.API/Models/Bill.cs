using System.ComponentModel.DataAnnotations;

namespace HospitalManagement.API.Models
{
    public class Bill
    {
        public int Id { get; set; }
        public required Patient Patient { get; set; }
        public int PatientId { get; set; }
        public required Doctor Doctor { get; set; }
        public int DoctorId { get; set; }
        public DateTime BillDate { get; set; }
        public decimal Amount { get; set; }
        public required string Description { get; set; }
        public BillStatus Status { get; set; }
        public string? ReceiptNumber { get; set; }
        public string? FilePath { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string? PaymentMethod { get; set; }
        public string? TransactionId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public required ICollection<BillItem> Items { get; set; }
    }

    public class BillItem
    {
        public int Id { get; set; }
        public required Bill Bill { get; set; }
        public int BillId { get; set; }
        public required string Description { get; set; }
        public decimal Amount { get; set; }
    }

    public enum BillStatus
    {
        Pending,
        Paid,
        Cancelled
    }
} 