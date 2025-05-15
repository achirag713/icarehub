using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using HospitalManagement.API.Data;
using HospitalManagement.API.Models;
using System.Security.Claims;
using Microsoft.Extensions.Logging;
using HospitalManagement.API.Utilities;

namespace HospitalManagement.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AppointmentController> _logger;

        public AppointmentController(ApplicationDbContext context, ILogger<AppointmentController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllAppointments()
        {
            var appointments = await _context.Appointments
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.User)
                .Include(a => a.Patient)
                    .ThenInclude(p => p.User)
                .Select(a => new
                {
                    a.Id,
                    a.AppointmentDate,
                    a.Status,
                    a.Notes,
                    Doctor = new
                    {
                        a.Doctor.User.Username,
                        a.Doctor.Specialization
                    },
                    Patient = new
                    {
                        a.Patient.User.Username,
                        a.Patient.PhoneNumber
                    }
                })
                .ToListAsync();

            return Ok(appointments);
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllAppointmentsAlternative()
        {
            var appointments = await _context.Appointments
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.User)
                .Include(a => a.Patient)
                    .ThenInclude(p => p.User)
                .Select(a => new
                {
                    a.Id,
                    a.AppointmentDate,
                    a.Status,
                    a.Notes,
                    DoctorId = a.DoctorId,
                    PatientId = a.PatientId,
                    doctorName = a.Doctor.User.Username,
                    patientName = a.Patient.User.Username,
                    purpose = a.Reason
                })
                .ToListAsync();

            return Ok(appointments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAppointment(int id)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.User)
                .Include(a => a.Patient)
                    .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
                return NotFound();

            // Check if the user is authorized to view this appointment
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!int.TryParse(userId, out int parsedUserId))
            {
                return BadRequest("Invalid user ID format");
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (userRole != "Admin" && 
                appointment.Doctor.UserId != parsedUserId && 
                appointment.Patient.UserId != parsedUserId)
                return Forbid();

            return Ok(new
            {
                appointment.Id,
                appointment.AppointmentDate,
                appointment.Status,
                appointment.Notes,
                Doctor = new
                {
                    appointment.Doctor.User.Username,
                    appointment.Doctor.Specialization,
                    appointment.Doctor.PhoneNumber
                },
                Patient = new
                {
                    appointment.Patient.User.Username,
                    appointment.Patient.PhoneNumber
                }
            });
        }

 
        [HttpGet("patient")]
        public async Task<IActionResult> GetPatientAppointments()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized("User not authenticated");
            }

            var userId = int.Parse(userIdClaim);
            var patient = await _context.Patients
                .FromSqlRaw("SELECT * FROM Patients WHERE UserId = {0}", userId)
                .FirstOrDefaultAsync();

            if (patient == null)
                return NotFound("Patient not found");

            var appointments = await _context.Appointments
                .Include(a => a.Doctor)
                    .ThenInclude(d => d.User)
                .Include(a => a.Patient)
                .Where(a => a.PatientId == patient.Id)
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();

            return Ok(appointments);
        }        [Authorize(Roles = "Patient")]
        [HttpGet("available-slots/{doctorId}")]
        public async Task<IActionResult> GetAvailableSlots(int doctorId, [FromQuery] DateTime date)
        {
            var doctor = await _context.Doctors
                .Include(d => d.Schedule)
                .FirstOrDefaultAsync(d => d.Id == doctorId);

            if (doctor == null)
                return NotFound("Doctor not found");            // Check if the requested date is a weekend (Saturday or Sunday)
            // Convert to local time for validation
            var localDate = TimeZoneInfo.ConvertTimeFromUtc(
                date.ToUniversalTime(), 
                TimeZoneInfo.Local);
                
            if (localDate.DayOfWeek == DayOfWeek.Saturday || localDate.DayOfWeek == DayOfWeek.Sunday)
            {
                return Ok(new List<DateTime>()); // Return empty list for weekends
            }

            // Get existing appointments for the day
            var existingAppointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && 
                       a.AppointmentDate.Date == date.Date &&
                       a.Status != AppointmentStatus.Cancelled)
                .Select(a => a.AppointmentDate)
                .ToListAsync();

            var slots = new List<DateTime>();
            var startTime = date.Date.Add(new TimeSpan(9, 0, 0)); // 9 AM
            var endTime = date.Date.Add(new TimeSpan(17, 0, 0)); // 5 PM
            var slotDuration = TimeSpan.FromMinutes(30);

            // Generate all possible slots for the day
            for (var time = startTime; time < endTime; time = time.Add(slotDuration))
            {
                // Skip if the slot is in the past
                if (time <= DateTime.Now)
                    continue;

                // Skip if the slot is already booked
                if (existingAppointments.Any(a => a == time))
                    continue;

                slots.Add(time);
            }

            return Ok(slots);
        }        [Authorize(Roles = "Patient")]
        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto model)
        {
            try
            {
                if (model == null)
                {
                    return BadRequest("Invalid appointment data");
                }
                
                _logger.LogInformation($"Received appointment request: {model.AppointmentDate} (UTC format), DisplayTime: {model.DisplayTime}");
                
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated");
                }

                if (!int.TryParse(userId, out int parsedUserId))
                {
                    return BadRequest("Invalid user ID format");
                }

                var patient = await _context.Patients
                    .FirstOrDefaultAsync(p => p.UserId == parsedUserId);

                if (patient == null)
                {
                    return NotFound("Patient not found");
                }

                var doctor = await _context.Doctors
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(d => d.Id == model.DoctorId);

                if (doctor == null)
                {
                    return NotFound("Doctor not found");
                }                // Validate appointment date
                if (model.AppointmentDate < TimeUtility.NowIst())
                {
                    return BadRequest("Cannot book appointments in the past");
                }

                // Add detailed logging for timezone debugging
                _logger.LogInformation($"Appointment validation - UTC time: {model.AppointmentDate:yyyy-MM-dd HH:mm:ss}");
                
                // Get the local appointment time for checking constraints
                var localAppointmentDate = TimeZoneInfo.ConvertTimeFromUtc(
                    model.AppointmentDate.ToUniversalTime(), 
                    TimeZoneInfo.Local);
                    
                _logger.LogInformation($"Appointment validation - Server local time: {localAppointmentDate:yyyy-MM-dd HH:mm:ss}, Local timezone: {TimeZoneInfo.Local.Id}");
                _logger.LogInformation($"Appointment validation - Day of week: {localAppointmentDate.DayOfWeek}, Hours: {localAppointmentDate.Hour}, Minutes: {localAppointmentDate.Minute}");

                // Check if the appointment date is a weekend
                // Convert UTC time to local time for day of week validation
                localAppointmentDate = TimeZoneInfo.ConvertTimeFromUtc(
                    model.AppointmentDate.ToUniversalTime(), 
                    TimeZoneInfo.Local);
                    
                if (localAppointmentDate.DayOfWeek == DayOfWeek.Saturday || 
                    localAppointmentDate.DayOfWeek == DayOfWeek.Sunday)
                {
                    return BadRequest($"Appointments cannot be booked on weekends. Your selected date ({localAppointmentDate.ToString("dddd, MMMM d, yyyy")}) is a weekend.");
                }
                
                // IMPORTANT: Even if DisplayTime is set, we still validate the AppointmentDate
                // This allows us to keep backward compatibility while also supporting the new field

                var appointment = new Appointment
                {
                    PatientId = patient.Id,
                    DoctorId = doctor.Id,
                    AppointmentDate = model.AppointmentDate,
                    DisplayTime = model.DisplayTime ?? "12:00 PM", // Use the DisplayTime if provided
                    Reason = model.Reason ?? "General consultation", // Set default reason if null
                    Notes = model.Notes ?? string.Empty,
                    Status = AppointmentStatus.Scheduled,
                    CreatedAt = TimeUtility.NowIst()
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Appointment created successfully",
                    appointment = new
                    {
                        id = appointment.Id,
                        patientId = appointment.PatientId,
                        doctorId = appointment.DoctorId,
                        appointmentDate = appointment.AppointmentDate,
                        displayTime = appointment.DisplayTime,
                        reason = appointment.Reason,
                        status = appointment.Status
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating appointment");
                return BadRequest("Failed to create appointment: " + ex.Message);
            }
        }

        [Authorize(Roles = "Patient")]
        [HttpPost("simplified")]
        public async Task<IActionResult> CreateSimplifiedAppointment([FromBody] CreateAppointmentDto model)
        {
            try
            {
                _logger.LogInformation("SIMPLIFIED APPOINTMENT CREATION CALLED");
                
                if (model == null)
                {
                    return BadRequest("Invalid appointment data");
                }
                
                _logger.LogInformation($"Simplified appointment request: {model.AppointmentDate}, DisplayTime: {model.DisplayTime}");
                
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated");
                }

                if (!int.TryParse(userId, out int parsedUserId))
                {
                    return BadRequest("Invalid user ID format");
                }

                var patient = await _context.Patients
                    .FirstOrDefaultAsync(p => p.UserId == parsedUserId);

                if (patient == null)
                {
                    return NotFound("Patient not found");
                }

                var doctor = await _context.Doctors
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(d => d.Id == model.DoctorId);

                if (doctor == null)
                {
                    return NotFound("Doctor not found");
                }
                
                // Only validate that the appointment is not in the past
                if (model.AppointmentDate < DateTime.UtcNow)
                {
                    return BadRequest("Cannot book appointments in the past");
                }

                var appointment = new Appointment
                {
                    PatientId = patient.Id,
                    DoctorId = doctor.Id,
                    AppointmentDate = model.AppointmentDate, // The TimeUtility will handle conversion to IST in ApplicationDbContext
                    DisplayTime = model.DisplayTime ?? "12:00 PM", // Use the user's selected time for display
                    Reason = model.Reason ?? "General consultation",
                    Notes = model.Notes ?? string.Empty,
                    Status = AppointmentStatus.Scheduled,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Appointment created successfully",
                    appointment = new
                    {
                        id = appointment.Id,
                        patientId = appointment.PatientId,
                        doctorId = appointment.DoctorId,
                        appointmentDate = appointment.AppointmentDate,
                        displayTime = appointment.DisplayTime, // Return the display time
                        reason = appointment.Reason,
                        status = appointment.Status
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating simplified appointment");
                return BadRequest("Failed to create appointment: " + ex.Message);
            }
        }

        [Authorize(Roles = "Patient")]
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelAppointment(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!int.TryParse(userId, out int parsedUserId))
            {
                return BadRequest("Invalid user ID format");
            }

            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == parsedUserId);

            if (patient == null)
                return NotFound("Patient not found");

            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == id && a.PatientId == patient.Id);

            if (appointment == null)
                return NotFound("Appointment not found");

            if (appointment.Status != AppointmentStatus.Scheduled)
                return BadRequest("Only scheduled appointments can be cancelled");

            if (appointment.AppointmentDate <= DateTime.Now)
                return BadRequest("Cannot cancel past appointments");

            appointment.Status = AppointmentStatus.Cancelled;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Appointment cancelled successfully" });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAppointment(int id, [FromBody] UpdateAppointmentDto dto)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Doctor)
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == id);            if (appointment == null)
                return NotFound();            // Check if the user is authorized to update this appointment
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!int.TryParse(userId, out int parsedUserId))
            {
                return BadRequest("Invalid user ID format");
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

            // Null check for doctor and patient
            if (appointment.Doctor?.UserId == null || appointment.Patient?.UserId == null)
            {
                return BadRequest("Appointment data is incomplete");
            }

            if (userRole != "Admin" && 
                appointment.Doctor.UserId != parsedUserId && 
                appointment.Patient.UserId != parsedUserId)
                return Forbid();

            // Ensure Status is valid
            if (string.IsNullOrEmpty(dto.Status) || !Enum.TryParse<AppointmentStatus>(dto.Status, out var status))
            {
                return BadRequest("Invalid appointment status");
            }

            appointment.Status = status;
            appointment.Notes = dto.Notes;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(appointment);
        }        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Doctor)
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == id);
                
            if (appointment == null)
                return NotFound();
                
            // Check if the user is authorized to delete this appointment
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            if (!int.TryParse(userId, out int parsedUserId))
            {
                return BadRequest("Invalid user ID format");
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

            // Null check for doctor and patient
            if (appointment.Doctor?.UserId == null || appointment.Patient?.UserId == null)
            {
                return BadRequest("Appointment data is incomplete");
            }

            if (userRole != "Admin" && 
                appointment.Doctor.UserId != parsedUserId && 
                appointment.Patient.UserId != parsedUserId)
                return Forbid();

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class CreateAppointmentDto
    {
        public int DoctorId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public required string Reason { get; set; }
        public string? Notes { get; set; }
        public string? DisplayTime { get; set; }
    }    public class UpdateAppointmentDto
    {
        public required string Status { get; set; }
        public required string Notes { get; set; }
    }
}