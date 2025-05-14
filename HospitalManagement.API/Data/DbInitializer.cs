using Microsoft.EntityFrameworkCore;
using HospitalManagement.API.Models;

namespace HospitalManagement.API.Data
{
    public static class DbInitializer
    {
        public static async Task Initialize(ApplicationDbContext context)
        {
            // Ensure database is created
            await context.Database.EnsureCreatedAsync();

            // Check if admin user already exists
            if (await context.Users.AnyAsync(u => u.Role == "Admin"))
            {
                return; // Admin already exists
            }

            // Create admin user
            var adminUser = new User
            {
                Username = "admin",
                Email = "admin@icarehub.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };

            // Add admin user to database
            await context.Users.AddAsync(adminUser);
            await context.SaveChangesAsync();
        }
    }
} 