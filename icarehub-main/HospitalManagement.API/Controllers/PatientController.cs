using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using HospitalManagement.API.Data;
using HospitalManagement.API.Models;
using System.Security.Claims;
using HospitalManagement.API.DTOs;

namespace HospitalManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PatientController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PatientController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Add new endpoint to get all patients (for admin)
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllPatients()
        {
            var patientsData = await _context.Patients
                .Include(p => p.User)
                .Include(p => p.Appointments)
                .Include(p => p.Billings)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var result = patientsData.Select(p => new
            {
                id = p.Id,
                name = p.User.Username,
                email = p.User.Email,
                age = CalculateAge(p.DateOfBirth),
                gender = p.Gender,
                phoneNumber = p.PhoneNumber,
                address = p.Address,
                bloodGroup = p.BloodGroup,
                medicalHistory = p.MedicalHistory,
                lastVisit = p.Appointments.OrderByDescending(a => a.AppointmentDate)
                            .FirstOrDefault()?.AppointmentDate,
                bills = p.Billings.Select(b => new
                {
                    id = b.Id,
                    date = b.CreatedAt,
                    amount = b.Amount,
                    status = b.Status.ToString()
                }).ToList()
            }).ToList();

            return Ok(result);
        }

        // Add endpoint to get a specific patient by ID (for admin)
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPatientById(int id)
        {
            var patient = await _context.Patients
                .Include(p => p.User)
                .Include(p => p.Appointments)
                .Include(p => p.Billings)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (patient == null)
            {
                return NotFound("Patient not found");
            }

            var lastVisitDate = patient.Appointments
                .OrderByDescending(a => a.AppointmentDate)
                .FirstOrDefault()?.AppointmentDate;
                
            return Ok(new
            {
                id = patient.Id,
                name = patient.User.Username,
                email = patient.User.Email,
                age = CalculateAge(patient.DateOfBirth),
                gender = patient.Gender,
                phoneNumber = patient.PhoneNumber,
                address = patient.Address,
                bloodGroup = patient.BloodGroup,
                medicalHistory = patient.MedicalHistory,
                lastVisit = lastVisitDate,
                bills = patient.Billings.Select(b => new
                {
                    id = b.Id,
                    date = b.CreatedAt,
                    amount = b.Amount,
                    status = b.Status.ToString()
                }).ToList()
            });
        }

        // Add endpoint to update a patient by ID (for admin)
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePatient(int id, [FromBody] PatientUpdateDto model)
        {
            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (patient == null)
            {
                return NotFound("Patient not found");
            }

            patient.User.Username = model.Name;
            patient.PhoneNumber = model.PhoneNumber;
            patient.DateOfBirth = model.DateOfBirth;
            patient.Gender = model.Gender;
            patient.Address = model.Address;
            patient.BloodGroup = model.BloodGroup;
            patient.MedicalHistory = model.MedicalHistory;
            patient.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Patient updated successfully" });
        }

        // Add endpoint to delete a patient (for admin)
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePatient(int id)
        {
            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (patient == null)
            {
                return NotFound("Patient not found");
            }

            _context.Patients.Remove(patient);
            _context.Users.Remove(patient.User);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Patient deleted successfully" });
        }

        // Helper method to calculate age
        private int CalculateAge(DateTime dateOfBirth)
        {
            var today = DateTime.Today;
            var age = today.Year - dateOfBirth.Year;
            if (dateOfBirth.Date > today.AddYears(-age)) age--;
            return age;
        }

        // Existing endpoints
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] PatientRegistrationDto model)
        {
            if (await _context.Users.AnyAsync(u => u.Email == model.Email))
            {
                return BadRequest("Email already exists");
            }

            var user = new User
            {
                Username = model.Name,
                Email = model.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password),
                Role = "Patient"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var patient = new Patient
            {
                UserId = user.Id,
                User = user,
                PhoneNumber = model.PhoneNumber,
                DateOfBirth = model.DateOfBirth,
                Gender = model.Gender,
                Address = model.Address,
                BloodGroup = model.BloodGroup,
                MedicalHistory = model.MedicalHistory
            };

            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Patient registration successful" });
        }

        [Authorize(Roles = "Patient")]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
            {
                return NotFound("Patient not found");
            }

            return Ok(new
            {
                id = patient.Id,
                name = patient.User.Username,
                email = patient.User.Email,
                phoneNumber = patient.PhoneNumber,
                dateOfBirth = patient.DateOfBirth,
                gender = patient.Gender,
                address = patient.Address,
                bloodGroup = patient.BloodGroup,
                medicalHistory = patient.MedicalHistory
            });
        }

        [Authorize(Roles = "Patient")]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] PatientUpdateDto model)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
            {
                return NotFound("Patient not found");
            }

            patient.User.Username = model.Name;
            patient.PhoneNumber = model.PhoneNumber;
            patient.DateOfBirth = model.DateOfBirth;
            patient.Gender = model.Gender;
            patient.Address = model.Address;
            patient.BloodGroup = model.BloodGroup;
            patient.MedicalHistory = model.MedicalHistory;
            patient.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully" });
        }

        [Authorize(Roles = "Patient")]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found");

            if (!BCrypt.Net.BCrypt.Verify(model.CurrentPassword, user.PasswordHash))
                return BadRequest("Current password is incorrect");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }

        [Authorize(Roles = "Patient")]
        [HttpDelete("account")]
        public async Task<IActionResult> DeleteAccount()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found");

            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
            if (patient != null)
            {
                _context.Patients.Remove(patient);
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Account deleted successfully" });
        }

        [Authorize(Roles = "Patient")]
        [HttpPut("notification-preferences")]
        public async Task<IActionResult> UpdateNotificationPreferences([FromBody] NotificationPreferencesDto model)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
                return NotFound("Patient not found");

            patient.NotificationPreferences = new NotificationPreferences
            {
                Patient = patient,
                PatientId = patient.Id,
                AppointmentReminders = model.AppointmentReminders,
                TestResults = model.TestResults,
                PrescriptionUpdates = model.PrescriptionUpdates,
                BillingAlerts = model.BillingAlerts
            };

            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification preferences updated successfully" });
        }
    }

    public class PatientRegistrationDto
    {
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public required string PhoneNumber { get; set; }
        public required DateTime DateOfBirth { get; set; }
        public required string Gender { get; set; }
        public required string Address { get; set; }
        public required string BloodGroup { get; set; }
        public required string MedicalHistory { get; set; }
    }

    public class PatientUpdateDto
    {
        public required string Name { get; set; }
        public required string PhoneNumber { get; set; }
        public required DateTime DateOfBirth { get; set; }
        public required string Gender { get; set; }
        public required string Address { get; set; }
        public required string BloodGroup { get; set; }
        public required string MedicalHistory { get; set; }
    }

    public class NotificationPreferencesDto
    {
        public bool AppointmentReminders { get; set; }
        public bool TestResults { get; set; }
        public bool PrescriptionUpdates { get; set; }
        public bool BillingAlerts { get; set; }
    }
}