using System.ComponentModel.DataAnnotations;

namespace HospitalManagement.API.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        public required string Username { get; set; }
        
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
        
        [Required]
        public required string PasswordHash { get; set; }
        
        [Required]
        public required string Role { get; set; } // Admin, Doctor, Patient
        
        public string? PhoneNumber { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}