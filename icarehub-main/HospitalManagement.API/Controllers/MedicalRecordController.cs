using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using HospitalManagement.API.Data;
using HospitalManagement.API.Models;
using HospitalManagement.API.DTOs;
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
                .Select(r => new PatientMedicalRecordDto
                {
                    Id = r.Id,
                    RecordDate = r.RecordDate,
                    Diagnosis = r.Diagnosis,
                    Prescription = r.Prescription,
                    Notes = r.Notes,
                    FilePath = r.FilePath,
                    Doctor = new DoctorBasicInfoDto
                    {
                        Id = r.Doctor.Id,
                        Name = r.Doctor.User.Username,
                        Specialization = r.Doctor.Specialization
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

            return Ok(new MedicalRecordDto
            {
                Id = record.Id,
                PatientId = record.PatientId,
                DoctorId = record.DoctorId,
                RecordDate = record.RecordDate,
                Diagnosis = record.Diagnosis,
                Prescription = record.Prescription,
                LabResults = record.LabResults,
                Notes = record.Notes,
                FilePath = record.FilePath,
                CreatedAt = record.CreatedAt,
                UpdatedAt = record.UpdatedAt,
                DoctorName = record.Doctor.User.Username,
                DoctorSpecialization = record.Doctor.Specialization
            });
        }

        [HttpPost]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> CreateRecord([FromBody] CreateMedicalRecordDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
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
                RecordDate = dto.RecordDate != default ? dto.RecordDate : TimeUtility.NowIst(),
                Diagnosis = dto.Diagnosis,
                Prescription = dto.Prescription,
                LabResults = dto.LabResults ?? string.Empty,
                Notes = dto.Notes,
                FilePath = dto.FilePath ?? string.Empty
            };

            _context.MedicalRecords.Add(medicalRecord);
            await _context.SaveChangesAsync();
            
            // Create a DTO for the response
            var responseDto = new MedicalRecordDto
            {
                Id = medicalRecord.Id,
                PatientId = medicalRecord.PatientId,
                DoctorId = medicalRecord.DoctorId,
                DoctorName = doctor.User.Username,
                DoctorSpecialization = doctor.Specialization,
                RecordDate = medicalRecord.RecordDate,
                Diagnosis = medicalRecord.Diagnosis,
                Prescription = medicalRecord.Prescription,
                LabResults = medicalRecord.LabResults,
                Notes = medicalRecord.Notes,
                FilePath = medicalRecord.FilePath,
                CreatedAt = medicalRecord.CreatedAt,
                UpdatedAt = medicalRecord.UpdatedAt
            };

            return CreatedAtAction(nameof(GetRecord), new { id = medicalRecord.Id }, responseDto);
        }
        
        [HttpPut("{id}")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> UpdateRecord(int id, [FromBody] UpdateMedicalRecordDto dto)
        {
            var record = await _context.MedicalRecords.FindAsync(id);
            if (record == null)
                return NotFound("Medical record not found");

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
            if (doctor == null || record.DoctorId != doctor.Id)
                return Forbid();
                
            // Update only the provided fields
            if (!string.IsNullOrEmpty(dto.Diagnosis))
                record.Diagnosis = dto.Diagnosis;
                
            if (!string.IsNullOrEmpty(dto.Prescription))
                record.Prescription = dto.Prescription;
                
            if (dto.LabResults != null)
                record.LabResults = dto.LabResults;
                
            if (dto.Notes != null)
                record.Notes = dto.Notes;
                
            if (dto.FilePath != null)
                record.FilePath = dto.FilePath;
                
            record.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            
            var responseDto = new MedicalRecordDto
            {
                Id = record.Id,
                PatientId = record.PatientId,
                DoctorId = record.DoctorId,
                RecordDate = record.RecordDate,
                Diagnosis = record.Diagnosis,
                Prescription = record.Prescription,
                LabResults = record.LabResults,
                Notes = record.Notes,
                FilePath = record.FilePath,
                CreatedAt = record.CreatedAt,
                UpdatedAt = record.UpdatedAt,
                DoctorName = doctor.User.Username,
                DoctorSpecialization = doctor.Specialization
            };

            return Ok(responseDto);
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
                .Select(r => new PatientMedicalRecordDto
                {
                    Id = r.Id,
                    RecordDate = r.RecordDate,
                    Diagnosis = r.Diagnosis,
                    Prescription = r.Prescription,
                    Notes = r.Notes,
                    FilePath = r.FilePath,
                    Doctor = new DoctorBasicInfoDto
                    {
                        Id = r.Doctor.Id,
                        Name = r.Doctor.User.Username,
                        Specialization = r.Doctor.Specialization
                    }
                })
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
} 