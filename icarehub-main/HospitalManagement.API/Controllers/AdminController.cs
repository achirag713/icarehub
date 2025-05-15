using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using HospitalManagement.API.Data;
using HospitalManagement.API.Models;
using System.Security.Claims;
using HospitalManagement.API.DTOs;
using HospitalManagement.API.Utilities;

namespace HospitalManagement.API.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Add new profile endpoints
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("User ID claim not found");
                }
                
                var userId = int.Parse(userIdClaim);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                    return NotFound("Admin not found");

                // Split the username into first and last name
                var nameParts = user.Username.Split(' ');
                var firstName = nameParts.Length > 0 ? nameParts[0] : "";
                var lastName = nameParts.Length > 1 ? string.Join(" ", nameParts.Skip(1)) : "";

                return Ok(new
                {
                    id = user.Id,
                    firstName = firstName,
                    lastName = lastName,
                    email = user.Email,
                    phone = user.PhoneNumber ?? "",
                    timezone = "UTC" // Default timezone
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] AdminProfileUpdateDto model)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("User ID claim not found");
                }
                
                var userId = int.Parse(userIdClaim);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                    return NotFound("Admin not found");

                // Update user details
                user.Username = $"{model.FirstName} {model.LastName}".Trim();
                user.PhoneNumber = model.Phone;
                // Email update would typically require verification, so leaving it unchanged
                
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = user.Id,
                    firstName = model.FirstName,
                    lastName = model.LastName,
                    email = user.Email,
                    phone = model.Phone,
                    timezone = model.Timezone
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("User ID claim not found");
                }
                
                var userId = int.Parse(userIdClaim);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                    return NotFound("Admin not found");

                // Verify current password
                if (!BCrypt.Net.BCrypt.Verify(model.CurrentPassword, user.PasswordHash))
                    return BadRequest("Current password is incorrect");

                // Update password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Add system settings endpoints
        [HttpGet("settings")]
        public async Task<IActionResult> GetSystemSettings()
        {
            try
            {
                // In a real application, these would be stored in the database
                // For now, we'll return default values
                await Task.CompletedTask; // Add await to prevent warning CS1998
                
                return Ok(new
                {
                    appointmentDuration = 30,
                    workingHours = new
                    {
                        start = "09:00",
                        end = "17:00"
                    },
                    emailNotifications = true,
                    smsNotifications = true,
                    maintenanceMode = false,
                    automaticLogout = 30
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSystemSettings([FromBody] SystemSettingsDto model)
        {
            try
            {
                // In a real application, these would be stored in the database
                // For this demo, we'll just acknowledge the update
                await Task.CompletedTask; // Add await to prevent warning CS1998
                
                return Ok(new
                {
                    message = "System settings updated successfully",
                    settings = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Existing dashboard endpoints
        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var totalPatients = await _context.Patients.CountAsync();
                var totalDoctors = await _context.Doctors.CountAsync();
                var totalAppointments = await _context.Appointments.CountAsync();
                
                // Calculate total revenue from bills
                var totalRevenue = await _context.Bills
                    .Where(b => b.Status == BillStatus.Paid)
                    .SumAsync(b => b.Amount);

                return Ok(new
                {
                    totalPatients,
                    totalDoctors,
                    totalAppointments,
                    totalRevenue
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStatistics()
        {
            // Get counts of various entities
            var patientCount = await _context.Patients.CountAsync();
            var doctorCount = await _context.Doctors.CountAsync();
            var appointmentCount = await _context.Appointments.CountAsync();
            
            // Today's appointments
            var today = TimeUtility.NowIst();
            var todayAppointments = await _context.Appointments
                .Where(a => a.AppointmentDate.Date == today)
                .CountAsync();
            
            // This week's appointments
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
            var endOfWeek = startOfWeek.AddDays(7);
            var weeklyAppointments = await _context.Appointments
                .Where(a => a.AppointmentDate.Date >= startOfWeek && a.AppointmentDate.Date < endOfWeek)
                .CountAsync();
                  // Pending appointments
            var pendingAppointments = await _context.Appointments
                .Where(a => a.Status == AppointmentStatus.Scheduled)
                .CountAsync();
                
            // Recent registrations
            var lastMonth = TimeUtility.NowIst().AddMonths(-1);
            var newPatients = await _context.Patients
                .Where(p => p.CreatedAt >= lastMonth)
                .CountAsync();
                
            var newDoctors = await _context.Doctors
                .Where(d => d.CreatedAt >= lastMonth)
                .CountAsync();
                
            // Revenue statistics (if billing is implemented)
            var totalRevenue = await _context.Bills
                .SumAsync(b => b.Amount);
                
            var monthlyRevenue = await _context.Bills
                .Where(b => b.BillDate >= lastMonth)
                .SumAsync(b => b.Amount);
            
            return Ok(new
            {
                patients = patientCount,
                doctors = doctorCount,
                appointments = appointmentCount,
                todayAppointments,
                weeklyAppointments,
                pendingAppointments,
                newPatients,
                newDoctors,
                totalRevenue,
                monthlyRevenue
            });
        }
          [HttpGet("recent-appointments")]
        public async Task<IActionResult> GetRecentAppointments()
        {
            var recentAppointments = await _context.Appointments
                .Include(a => a.Patient)
                    .ThenInclude(p => p!.User)
                .Include(a => a.Doctor)
                    .ThenInclude(d => d!.User)
                .OrderByDescending(a => a.AppointmentDate)
                .Take(10)
                .Select(a => new
                {
                    id = a.Id,
                    patientName = a.Patient != null && a.Patient.User != null ? a.Patient.User.Username : "Unknown",
                    doctorName = a.Doctor != null && a.Doctor.User != null ? a.Doctor.User.Username : "Unknown",
                    date = a.AppointmentDate,
                    status = a.Status.ToString(),
                    reason = a.Reason
                })
                .ToListAsync();
                
            return Ok(recentAppointments);
        }
        
        [HttpGet("recent-patients")]
        public async Task<IActionResult> GetRecentPatients()
        {
            try
            {
                var recentPatients = await _context.Patients
                    .Include(p => p.User)
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(10)
                    .Select(p => new
                    {
                        id = p.Id,
                        username = p.User != null ? p.User.Username : "Unknown",
                        dateOfBirth = p.DateOfBirth,
                        gender = p.Gender,
                        lastVisit = p.CreatedAt
                    })
                    .ToListAsync();

                // Process the results after fetching from database
                var processedPatients = recentPatients.Select(p => new
                {
                    p.id,
                    firstName = p.username.Split(' ').FirstOrDefault() ?? "Unknown",
                    lastName = string.Join(" ", p.username.Split(' ').Skip(1)),
                    dateOfBirth = p.dateOfBirth,
                    gender = p.gender,
                    lastVisit = p.lastVisit
                });
                    
                return Ok(processedPatients);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        
        [HttpGet("recent-doctors")]
        public async Task<IActionResult> GetRecentDoctors()
        {
            try
            {
                var recentDoctors = await _context.Doctors
                    .Include(d => d.User)
                    .OrderByDescending(d => d.CreatedAt)
                    .Take(10)
                    .Select(d => new
                    {
                        id = d.Id,
                        username = d.User != null ? d.User.Username : "Unknown",
                        specialization = d.Specialization,
                        createdAt = d.CreatedAt
                    })
                    .ToListAsync();

                // Process the results after fetching from database
                var processedDoctors = recentDoctors.Select(d => new
                {
                    d.id,
                    firstName = d.username.Split(' ').FirstOrDefault() ?? "Unknown",
                    lastName = string.Join(" ", d.username.Split(' ').Skip(1)),
                    d.specialization,
                    experience = 0,
                    d.createdAt
                });
                    
                return Ok(processedDoctors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Helper method to calculate age from date of birth
        private int CalculateAge(DateTime dateOfBirth)
        {
            var today = DateTime.Today;
            var age = today.Year - dateOfBirth.Year;
            if (dateOfBirth.Date > today.AddYears(-age)) age--;
            return age;
        }
    }
}