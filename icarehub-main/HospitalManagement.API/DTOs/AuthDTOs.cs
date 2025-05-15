namespace HospitalManagement.API.DTOs
{
    public class LoginDto
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }

    public class RegisterPatientDto
    {
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public required string DateOfBirth { get; set; }
        public required string Gender { get; set; }
        public required string PhoneNumber { get; set; }
        public required string Address { get; set; }
        public string? BloodGroup { get; set; }
        public string? MedicalHistory { get; set; }
    }

    public class RegisterDoctorDto
    {
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public required string Phone { get; set; }
        public required string Specialization { get; set; }
        public string? Qualifications { get; set; }
        public int? Experience { get; set; }
        public string? Bio { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = new UserDto();
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
