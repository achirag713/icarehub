using System;
using HospitalManagement.API.Models;
using HospitalManagement.API.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HospitalManagement.API.Services
{
    public class AppointmentService
    {
        private readonly ILogger<AppointmentService> _logger;
        private readonly Data.ApplicationDbContext _context;

        public AppointmentService(Data.ApplicationDbContext context, ILogger<AppointmentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Updates the status of past appointments to Completed if they are still in Scheduled status
        /// </summary>
        public async Task UpdatePastAppointmentsStatus()
        {
            try
            {
                // Get current time in IST
                var currentTimeIst = TimeUtility.NowIst();
                
                _logger.LogInformation($"Running UpdatePastAppointmentsStatus at {currentTimeIst}");
                
                // Find all appointments that are in the past and still have Scheduled status
                var pastAppointments = await _context.Appointments
                    .Where(a => a.AppointmentDate < currentTimeIst && a.Status == AppointmentStatus.Scheduled)
                    .ToListAsync();
                
                if (pastAppointments.Any())
                {
                    _logger.LogInformation($"Found {pastAppointments.Count} past appointments to update to Completed status");
                    
                    foreach (var appointment in pastAppointments)
                    {
                        appointment.Status = AppointmentStatus.Completed;
                        appointment.UpdatedAt = DateTime.UtcNow;
                        
                        _logger.LogInformation($"Updated appointment {appointment.Id} status to Completed");
                    }
                    
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Successfully updated all past appointments");
                }
                else
                {
                    _logger.LogInformation("No past appointments to update");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating past appointments status");
            }
        }

        /// <summary>
        /// Checks if a patient has a conflicting appointment at the given date and time
        /// </summary>
        public async Task<bool> HasPatientConflictingAppointment(int patientId, int excludeAppointmentId, DateTime date, string displayTime)
        {
            // Get all appointments for the patient on the same date
            var patientAppointments = await _context.Appointments
                .Where(a => a.PatientId == patientId && 
                       a.Id != excludeAppointmentId &&  // Exclude the current appointment being updated
                       a.Status == AppointmentStatus.Scheduled && 
                       a.AppointmentDate.Date == date.Date)
                .ToListAsync();

            // Check if any appointment has the same display time
            return patientAppointments.Any(a => a.DisplayTime == displayTime);
        }        /// <summary>
        /// Checks if a doctor has a conflicting appointment at the given date and time
        /// </summary>
        public async Task<bool> HasDoctorConflictingAppointment(int doctorId, int excludeAppointmentId, DateTime date, string displayTime)
        {
            // Get all appointments for the doctor on the same date
            var doctorAppointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId && 
                       a.Id != excludeAppointmentId &&  // Exclude the current appointment being updated
                       a.Status == AppointmentStatus.Scheduled && 
                       a.AppointmentDate.Date == date.Date)
                .ToListAsync();

            // Check if any appointment has the same display time
            return doctorAppointments.Any(a => a.DisplayTime == displayTime);
        }

        /// <summary>
        /// Checks both patient and doctor availability at the given date and time
        /// </summary>
        public async Task<(bool IsAvailable, string Message)> CheckAppointmentAvailability(int patientId, int doctorId, int excludeAppointmentId, DateTime date, string displayTime)
        {
            // Check if the patient already has an appointment at the same time
            var patientHasConflict = await HasPatientConflictingAppointment(patientId, excludeAppointmentId, date, displayTime);
            if (patientHasConflict)
            {
                return (false, "You already have another appointment scheduled at this time. Please select a different time.");
            }

            // Check if the doctor already has an appointment at the same time
            var doctorHasConflict = await HasDoctorConflictingAppointment(doctorId, excludeAppointmentId, date, displayTime);
            if (doctorHasConflict)
            {
                return (false, "The doctor is unavailable at this time. Please select a different time.");
            }

            // Neither patient nor doctor has a conflict
            return (true, "Available");
        }
    }
}
