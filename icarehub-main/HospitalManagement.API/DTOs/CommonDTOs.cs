namespace HospitalManagement.API.DTOs
{
    public class ChangePasswordDto
    {
        public required string CurrentPassword { get; set; }
        public required string NewPassword { get; set; }
    }

    public class AdminProfileUpdateDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Phone { get; set; }
        public string Timezone { get; set; }
    }

    public class SystemSettingsDto
    {
        public int AppointmentDuration { get; set; }
        public WorkingHoursDto WorkingHours { get; set; }
        public bool EmailNotifications { get; set; }
        public bool SmsNotifications { get; set; }
        public bool MaintenanceMode { get; set; }
        public int AutomaticLogout { get; set; }
    }

    public class WorkingHoursDto
    {
        public string Start { get; set; }
        public string End { get; set; }
    }
}