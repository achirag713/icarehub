# ICareHub - Hospital Management System

A comprehensive hospital management solution with separate interfaces for patients, doctors, and administrators.

## Project Structure

This solution consists of two main components:

1. **HospitalManagement.API**: A .NET API backend
2. **hospital-management-frontend**: A React-based frontend

## Features

- User authentication and role-based authorization
- Patient appointment booking and management
- Doctor schedule management
- Medical records tracking
- Billing and payment processing
- Admin dashboard for hospital management

## Setup Instructions

### Prerequisites

- .NET SDK 9.0 or later
- Node.js (v16 or later) and npm
- SQL Server (or compatible database)

### Backend Setup

1. Navigate to the API project directory:
```
cd HospitalManagement.API
```

2. Restore packages:
```
dotnet restore
```

3. Update database connection string in `appsettings.json` or using User Secrets

4. Apply database migrations:
```
dotnet ef database update
```

5. Run the API:
```
dotnet run
```

### Frontend Setup

1. Navigate to the frontend project directory:
```
cd hospital-management-frontend
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
