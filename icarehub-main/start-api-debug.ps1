Write-Host "Starting API with enhanced debugging using HTTP profile..." -ForegroundColor Cyan

$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_LOGGING__CONSOLE__DISABLECOLORS = "false"
$env:ASPNETCORE_LOGGING__LOGLEVEL__DEFAULT = "Debug"
$env:ASPNETCORE_LOGGING__LOGLEVEL__MICROSOFT = "Debug"
$env:ASPNETCORE_LOGGING__LOGLEVEL__MICROSOFT_ASPNETCORE = "Debug"
$env:ASPNETCORE_LOGGING__LOGLEVEL__MICROSOFT_ENTITYFRAMEWORKCORE = "Debug"
$env:DOTNET_ENVIRONMENT = "Development"

Set-Location -Path "$PSScriptRoot\HospitalManagement.API"
dotnet build
dotnet run --launch-profile "http"
