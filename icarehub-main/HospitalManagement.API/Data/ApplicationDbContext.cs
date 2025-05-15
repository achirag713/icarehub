using Microsoft.EntityFrameworkCore;
using HospitalManagement.API.Models;
using HospitalManagement.API.Utilities;

namespace HospitalManagement.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<MedicalRecord> MedicalRecords { get; set; }
        public DbSet<Bill> Bills { get; set; }
        public DbSet<BillItem> BillItems { get; set; }        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<NotificationPreferences> NotificationPreferences { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<LabResult> LabResults { get; set; }
        public DbSet<DoctorPatientRelationship> DoctorPatientRelationships { get; set; }
        

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships and constraints
            modelBuilder.Entity<Patient>()
                .HasOne(p => p.User)
                .WithOne()
                .HasForeignKey<Patient>(p => p.UserId);

            modelBuilder.Entity<Doctor>()
                .HasOne(d => d.User)
                .WithOne()
                .HasForeignKey<Doctor>(d => d.UserId);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany()
                .HasForeignKey(a => a.PatientId);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Doctor)
                .WithMany()
                .HasForeignKey(a => a.DoctorId);

            modelBuilder.Entity<Bill>()
                .HasOne(b => b.Patient)
                .WithMany()
                .HasForeignKey(b => b.PatientId);

            modelBuilder.Entity<Bill>()
                .HasOne(b => b.Doctor)
                .WithMany()
                .HasForeignKey(b => b.DoctorId);

            modelBuilder.Entity<BillItem>()
                .HasOne(bi => bi.Bill)
                .WithMany(b => b.Items)
                .HasForeignKey(bi => bi.BillId);

            modelBuilder.Entity<Schedule>()
                .HasOne(s => s.Doctor)
                .WithMany(d => d.Schedule)
                .HasForeignKey(s => s.DoctorId);            modelBuilder.Entity<NotificationPreferences>()
                .HasOne(np => np.Patient)
                .WithOne(p => p.NotificationPreferences)
                .HasForeignKey<NotificationPreferences>(np => np.PatientId);
                
            modelBuilder.Entity<DoctorPatientRelationship>()
                .HasOne(dp => dp.Doctor)
                .WithMany()
                .HasForeignKey(dp => dp.DoctorId);
                
            modelBuilder.Entity<DoctorPatientRelationship>()
                .HasOne(dp => dp.Patient)
                .WithMany()
                .HasForeignKey(dp => dp.PatientId);
                
            
        }
        public override int SaveChanges()
        {
            ConvertDateTimesToIst();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ConvertDateTimesToIst();
            return base.SaveChangesAsync(cancellationToken);
        }

        // Fix the syntax error in the DateTime? handling

private void ConvertDateTimesToIst()
{
    var entries = ChangeTracker.Entries()
        .Where(x => x.State == EntityState.Added || x.State == EntityState.Modified);
        
    foreach (var entry in entries)
    {
        // Handle DateTime properties
        foreach (var property in entry.Properties
            .Where(p => p.Metadata.ClrType == typeof(DateTime) || p.Metadata.ClrType == typeof(DateTime?)))
        {
            if (property.CurrentValue == null)
                continue;
                
            if (property.Metadata.Name == "CreatedAt" && entry.State == EntityState.Added)
            {
                // For CreatedAt, use current time in IST
                property.CurrentValue = TimeUtility.NowIst();
            }
            else if (property.Metadata.Name == "UpdatedAt" && entry.State == EntityState.Modified)
            {
                // For UpdatedAt, use current time in IST
                property.CurrentValue = TimeUtility.NowIst();
            }
            else if (property.CurrentValue is DateTime dateTimeValue)
            {
                // For all other DateTime properties
                property.CurrentValue = dateTimeValue.ToIst();
            }
            else if (property.CurrentValue is DateTime?)
            {
                // For all other DateTime? properties
                var nullableDateTimeValue = (DateTime?)property.CurrentValue;
                if (nullableDateTimeValue.HasValue)
                {
                    property.CurrentValue = nullableDateTimeValue.Value.ToIst();
                }
            }
        }
    }
}
        
    }
}