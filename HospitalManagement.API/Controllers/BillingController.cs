using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using HospitalManagement.API.Data;
using HospitalManagement.API.Models;
using System.Security.Claims;

namespace HospitalManagement.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BillingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public BillingController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetPatientBills(int patientId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Check if the user is authorized to view these bills
            if (userRole != "Admin")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient == null || patient.Id != patientId)
                    return Forbid();
            }

            var bills = await _context.Bills
                .Include(b => b.Doctor)
                    .ThenInclude(d => d.User)
                .Where(b => b.PatientId == patientId)
                .Select(b => new
                {
                    b.Id,
                    b.BillDate,
                    b.Amount,
                    b.Description,
                    b.Status,
                    b.ReceiptNumber,
                    b.FilePath,
                    Doctor = new
                    {
                        b.Doctor.User.Username,
                        b.Doctor.Specialization
                    }
                })
                .ToListAsync();

            return Ok(bills);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetBill(int id)
        {
            var bill = await _context.Bills
                .Include(b => b.Doctor)
                    .ThenInclude(d => d.User)
                .Include(b => b.Patient)
                    .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bill == null)
                return NotFound();

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Check if the user is authorized to view this bill
            if (userRole != "Admin" && bill.Patient.UserId != userId)
                return Forbid();

            return Ok(new
            {
                bill.Id,
                bill.BillDate,
                bill.Amount,
                bill.Description,
                bill.Status,
                bill.ReceiptNumber,
                bill.FilePath,
                Doctor = new
                {
                    bill.Doctor.User.Username,
                    bill.Doctor.Specialization
                },
                Patient = new
                {
                    bill.Patient.User.Username,
                    bill.Patient.PhoneNumber
                }
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateBill([FromBody] CreateBillingDto dto)
        {
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == dto.PatientId);
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == dto.DoctorId);

            if (patient == null || doctor == null)
                return NotFound();

            var billing = new Bill
            {
                Patient = patient,
                PatientId = patient.Id,
                Doctor = doctor,
                DoctorId = doctor.Id,
                BillDate = DateTime.UtcNow,
                Amount = dto.Amount,
                Description = dto.Description,
                Status = BillStatus.Pending,
                ReceiptNumber = Guid.NewGuid().ToString("N").Substring(0, 8),
                FilePath = dto.FilePath ?? string.Empty,
                Items = new List<BillItem>()
            };

            _context.Bills.Add(billing);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBill), new { id = billing.Id }, billing);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateBill(int id, [FromBody] UpdateBillingDto dto)
        {
            var bill = await _context.Bills.FindAsync(id);
            if (bill == null)
                return NotFound();

            if (!Enum.TryParse<BillStatus>(dto.Status, out var status))
                return BadRequest("Invalid status value");

            bill.Status = status;
            bill.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(bill);
        }

        [HttpPost("upload")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadReceipt(IFormFile file, int billId)
        {
            var bill = await _context.Bills.FindAsync(billId);
            if (bill == null)
                return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var uploadsFolder = Path.Combine(_environment.WebRootPath, "receipts");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            bill.FilePath = uniqueFileName;
            await _context.SaveChangesAsync();

            return Ok(new { filePath = uniqueFileName });
        }

        [HttpGet("download/{billId}")]
        public async Task<IActionResult> DownloadReceipt(int billId)
        {
            var bill = await _context.Bills.FindAsync(billId);
            if (bill == null || string.IsNullOrEmpty(bill.FilePath))
                return NotFound();

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Check if the user is authorized to download this receipt
            if (userRole != "Admin")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient == null || patient.Id != bill.PatientId)
                    return Forbid();
            }

            var filePath = Path.Combine(_environment.WebRootPath, "receipts", bill.FilePath);
            if (!System.IO.File.Exists(filePath))
                return NotFound();

            var memory = new MemoryStream();
            using (var stream = new FileStream(filePath, FileMode.Open))
            {
                await stream.CopyToAsync(memory);
            }
            memory.Position = 0;

            return File(memory, "application/octet-stream", bill.FilePath);
        }

        [Authorize(Roles = "Patient")]
        [HttpGet("patient")]
        public async Task<IActionResult> GetPatientBills()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
                return NotFound("Patient not found");

            var bills = await _context.Bills
                .Include(b => b.Patient)
                .Include(b => b.Items)
                .Where(b => b.PatientId == patient.Id)
                .OrderByDescending(b => b.BillDate)
                .ToListAsync();

            return Ok(bills);
        }

        [Authorize(Roles = "Patient")]
        [HttpPost("{id}/pay")]
        public async Task<IActionResult> PayBill(int id, [FromBody] PaymentDto model)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null)
                return NotFound("Patient not found");

            var bill = await _context.Bills
                .FirstOrDefaultAsync(b => b.Id == id && b.PatientId == patient.Id);

            if (bill == null)
                return NotFound("Bill not found");

            if (bill.Status == BillStatus.Paid)
                return BadRequest("Bill is already paid");

            if (bill.Status == BillStatus.Cancelled)
                return BadRequest("Cannot pay a cancelled bill");

            // Process payment (integrate with payment gateway)
            // For now, we'll just mark it as paid
            bill.Status = BillStatus.Paid;
            bill.PaymentDate = DateTime.UtcNow;
            bill.PaymentMethod = model.PaymentMethod;
            bill.TransactionId = Guid.NewGuid().ToString(); // Replace with actual transaction ID

            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment successful", bill });
        }

        private string GenerateReceiptNumber()
        {
            return $"REC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8)}";
        }
    }

    public class CreateBillingDto
    {
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public decimal Amount { get; set; }
        public required string Description { get; set; }
        public string? FilePath { get; set; }
    }

    public class UpdateBillingDto
    {
        public required string Status { get; set; }
    }

    public class PaymentDto
    {
        public required string PaymentMethod { get; set; }
        public required string CardNumber { get; set; }
        public required string ExpiryDate { get; set; }
        public required string CVV { get; set; }
    }
} 