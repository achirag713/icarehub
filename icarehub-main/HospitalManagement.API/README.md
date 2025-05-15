# Hospital Management API

This is the backend API for the ICareHub Hospital Management System.

## Setup

1. **Database Configuration**
   - Install MySQL Server
   - Create a database named `icarehub`
   - Update the connection string in `appsettings.json` and `appsettings.Development.json` with your MySQL credentials

2. **JWT Configuration**
   - Update the JWT settings in `appsettings.json` and `appsettings.Development.json` with your own secure key
   - The `SecretKey` should be at least 32 characters long for security

3. **Running Migrations**
   ```bash
   dotnet ef database update
   ```

4. **Running the API**
   ```bash
   dotnet run
   ```

5. **Default Admin User**
   - Username: admin
   - Email: admin@icarehub.com
   - Password: Admin@123

## API Endpoints

- Authentication: `/api/auth`
- Patients: `/api/patients`
- Doctors: `/api/doctors`  
- Appointments: `/api/appointments`
- Medical Records: `/api/medical-records`
- Billing: `/api/billing`
- Admin: `/api/admin`

## Technology Stack

- ASP.NET Core 8.0
- Entity Framework Core
- MySQL
- JWT Authentication
- Swagger/OpenAPI
