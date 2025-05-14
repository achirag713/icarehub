using Microsoft.EntityFrameworkCore;
using HospitalManagement.API.Models;

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
    }
} 