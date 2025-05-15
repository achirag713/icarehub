using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using HospitalManagement.API.Data;
using HospitalManagement.API.Models;
using System.Security.Claims;
using HospitalManagement.API.Utilities;

namespace HospitalManagement.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MedicalRecordController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public MedicalRecordController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetPatientRecords(int patientId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Check if the user is authorized to view these records
            if (userRole != "Admin" && userRole != "Doctor")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient == null || patient.Id != patientId)
                    return Forbid();
            }

            var records = await _context.MedicalRecords
                .Include(r => r.Doctor)
                    .ThenInclude(d => d.User)
                .Where(r => r.PatientId == patientId)
                .Select(r => new
                {
                    r.Id,
                    r.RecordDate,
                    r.Diagnosis,
                    r.Prescription,
                    r.LabResults,
                    r.Notes,
                    r.FilePath,
                    Doctor = new
                    {
                        r.Doctor.User.Username,
                        r.Doctor.Specialization
                    }
                })
                .ToListAsync();

            return Ok(records);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRecord(int id)
        {
            var record = await _context.MedicalRecords
                .Include(r => r.Doctor)
                    .ThenInclude(d => d.User)
                .Include(r => r.Patient)
                    .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (record == null)
                return NotFound();

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Check if the user is authorized to view this record
            if (userRole != "Admin" && 
                userRole != "Doctor" && 
                record.Patient.UserId != userId)
                return Forbid();

            return Ok(new
            {
                record.Id,
                record.RecordDate,
                record.Diagnosis,
                record.Prescription,
                record.LabResults,
                record.Notes,
                record.FilePath,
                Doctor = new
                {
                    record.Doctor.User.Username,
                    record.Doctor.Specialization
                },
                Patient = new
                {
                    record.Patient.User.Username,
                    record.Patient.PhoneNumber
                }
            });
        }

        [HttpPost]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> CreateRecord([FromBody] CreateMedicalRecordDto dto)
        {
            var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == doctorId);

            if (doctor == null)
                return NotFound("Doctor not found");

            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == dto.PatientId);
            if (patient == null)
                return NotFound("Patient not found");

            var medicalRecord = new MedicalRecord
            {
                Patient = patient,
                PatientId = patient.Id,
                Doctor = doctor,
                DoctorId = doctor.Id,
                RecordDate = DateTime.UtcNow,
                Diagnosis = dto.Diagnosis,
                Prescription = dto.Prescription,
                LabResults = dto.LabResults,
                Notes = dto.Notes,
                FilePath = dto.FilePath ?? string.Empty
            };

            _context.MedicalRecords.Add(medicalRecord);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRecord), new { id = medicalRecord.Id }, medicalRecord);
        }

        [HttpPost("upload")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> UploadFile(IFormFile file, int recordId)
        {
            var record = await _context.MedicalRecords.FindAsync(recordId);
            if (record == null)
                return NotFound();

            var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == doctorId);
            if (doctor == null || record.DoctorId != doctor.Id)
                return Forbid();

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            record.FilePath = uniqueFileName;
            await _context.SaveChangesAsync();

            return Ok(new { filePath = uniqueFileName });
        }

        [HttpGet("download/{recordId}")]
        public async Task<IActionResult> DownloadFile(int recordId)
        {
            var record = await _context.MedicalRecords.FindAsync(recordId);
            if (record == null || string.IsNullOrEmpty(record.FilePath))
                return NotFound();

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Check if the user is authorized to download this file
            if (userRole != "Admin" && userRole != "Doctor")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient == null || patient.Id != record.PatientId)
                    return Forbid();
            }

            var filePath = Path.Combine(_environment.WebRootPath, "uploads", record.FilePath);
            if (!System.IO.File.Exists(filePath))
                return NotFound();

            var memory = new MemoryStream();
            using (var stream = new FileStream(filePath, FileMode.Open))
            {
                await stream.CopyToAsync(memory);
            }
            memory.Position = 0;

            return File(memory, "application/octet-stream", record.FilePath);
        }

        [Authorize(Roles = "Patient")]
        [HttpGet("patient")]
        public async Task<IActionResult> GetPatientRecords()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
                return NotFound("Patient not found");

            var records = await _context.MedicalRecords
                .Include(r => r.Doctor)
                    .ThenInclude(d => d.User)
                .Include(r => r.Patient)
                .Where(r => r.PatientId == patient.Id)
                .OrderByDescending(r => r.RecordDate)
                .ToListAsync();

            return Ok(records);
        }

        [Authorize(Roles = "Patient")]
        [HttpGet("patient/prescriptions")]
        public async Task<IActionResult> GetPatientPrescriptions()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
                return NotFound("Patient not found");

            var prescriptions = await _context.Prescriptions
                .Include(p => p.Doctor)
                    .ThenInclude(d => d.User)
                .Include(p => p.Patient)
                .Include(p => p.Medications)
                .Where(p => p.PatientId == patient.Id)
                .OrderByDescending(p => p.PrescribedDate)
                .ToListAsync();

            return Ok(prescriptions);
        }

        [Authorize(Roles = "Patient")]
        [HttpGet("patient/lab-results")]
        public async Task<IActionResult> GetPatientLabResults()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
                return NotFound("Patient not found");

            var labResults = await _context.LabResults
                .Include(l => l.Doctor)
                    .ThenInclude(d => d.User)
                .Include(l => l.Patient)
                .Where(l => l.PatientId == patient.Id)
                .OrderByDescending(l => l.TestDate)
                .ToListAsync();

            return Ok(labResults);
        }

        [Authorize(Roles = "Patient")]
        [HttpGet("prescriptions/{id}")]
        public async Task<IActionResult> GetPrescription(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
                return NotFound("Patient not found");

            var prescription = await _context.Prescriptions
                .Include(p => p.Doctor)
                    .ThenInclude(d => d.User)
                .Include(p => p.Patient)
                .Include(p => p.Medications)
                .FirstOrDefaultAsync(p => p.Id == id && p.PatientId == patient.Id);

            if (prescription == null)
                return NotFound("Prescription not found");

            return Ok(prescription);
        }

        [Authorize(Roles = "Patient")]
        [HttpGet("lab-results/{id}")]
        public async Task<IActionResult> GetLabResult(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
                return NotFound("Patient not found");

            var labResult = await _context.LabResults
                .Include(l => l.Doctor)
                    .ThenInclude(d => d.User)
                .Include(l => l.Patient)
                .Include(l => l.Tests)
                .FirstOrDefaultAsync(l => l.Id == id && l.PatientId == patient.Id);

            if (labResult == null)
                return NotFound("Lab result not found");

            return Ok(labResult);
        }
    }

    public class CreateMedicalRecordDto
    {
        public int PatientId { get; set; }
        public string Diagnosis { get; set; }
        public string Prescription { get; set; }
        public string LabResults { get; set; }
        public string Notes { get; set; }
        public string FilePath { get; set; }
    }
} 