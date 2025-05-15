using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HospitalManagement.API.Data;
using HospitalManagement.API.Models;
using HospitalManagement.API.Services;
using HospitalManagement.API.DTOs;
using System.Security.Claims;
using System.Text;
using System.Collections.Generic;
using HospitalManagement.API.Utilities;

namespace HospitalManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtService _jwtService;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, JwtService jwtService, IConfiguration configuration)
        {
            _context = context;
            _jwtService = jwtService;
            _configuration = configuration;
        }

        [HttpPost("signin")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid email or password");
            }

            var token = _jwtService.GenerateToken(user);

            return Ok(new AuthResponseDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role
                }
            });
        }

        [HttpPost("signup")]
        public async Task<IActionResult> RegisterPatient([FromBody] RegisterPatientDto model)
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == model.Email))
            {
                return BadRequest("Email is already registered");
            }

            // Create user
            var user = new User
            {
                Username = model.Name,
                Email = model.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password),
                Role = "Patient",
                CreatedAt = TimeUtility.NowIst()
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Parse date of birth
            if (!DateTime.TryParse(model.DateOfBirth, out DateTime dateOfBirth))
            {
                return BadRequest(new { errors = new { DateOfBirth = new[] { "Invalid date format" } } });
            }

            // Create patient
            var patient = new Patient
            {
                User = user,
                UserId = user.Id,
                PhoneNumber = model.PhoneNumber,
                DateOfBirth = dateOfBirth,
                Gender = model.Gender,
                Address = model.Address,
                BloodGroup = model.BloodGroup ?? "Unknown",
                MedicalHistory = model.MedicalHistory ?? "None"
            };

            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();
            
            // Create notification preferences with default values
            var notificationPreferences = new NotificationPreferences
            {
                Patient = patient,
                PatientId = patient.Id,
                AppointmentReminders = true,
                TestResults = true,
                PrescriptionUpdates = true,
                BillingAlerts = true
            };

            _context.NotificationPreferences.Add(notificationPreferences);
            await _context.SaveChangesAsync();

            // Generate JWT token
            var token = _jwtService.GenerateToken(user);

            return Ok(new AuthResponseDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role
                }
            });
        }

        [HttpPost("register-doctor")]
        public async Task<IActionResult> RegisterDoctor([FromBody] RegisterDoctorDto model)
        {
            // This endpoint would typically be admin-only in a real application
            
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == model.Email))
            {
                return BadRequest("Email is already registered");
            }

            // Create user
            var user = new User
            {
                Username = model.Name,
                Email = model.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password),
                Role = "Doctor",
                CreatedAt = TimeUtility.NowIst()
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create doctor
            var doctor = new Doctor
            {
                User = user,
                UserId = user.Id,
                Specialization = model.Specialization,
                LicenseNumber = "LIC-" + Guid.NewGuid().ToString().Substring(0, 8), // Generate a temporary license number
                PhoneNumber = model.Phone,
                Address = "Default Address", // Add default address as it's required
                Schedule = new List<Schedule>() // Initialize empty schedule list
            };

            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();

            // Generate JWT token
            var token = _jwtService.GenerateToken(user);

            return Ok(new AuthResponseDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role
                }
            });
        }
    }
}