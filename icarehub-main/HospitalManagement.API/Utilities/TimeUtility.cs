using System;

namespace HospitalManagement.API.Utilities
{
    public static class TimeUtility
    {
        // The offset for Indian Standard Time (IST): +5:30
        private static readonly TimeSpan IstOffset = new TimeSpan(5, 30, 0);
        public static DateTime ToIst(this DateTime time)
        {
            if (time.Kind == DateTimeKind.Utc)
            {
                return time.Add(IstOffset);
            }
            
            // If time is local, convert to UTC first, then to IST
            if (time.Kind == DateTimeKind.Local)
            {
                return time.ToUniversalTime().Add(IstOffset);
            }
            
            return time.Add(IstOffset);
        }
        public static DateTime NowIst()
        {
            return DateTime.UtcNow.ToIst();
        }        public static DateTime ParseToIst(string dateString)
        {
            if (DateTime.TryParse(dateString, out DateTime result))
            {
                return result.ToIst();
            }
            return DateTime.UtcNow.ToIst();
        }

        /// <summary>
        /// Parses a time string like "10:30 AM" and combines it with a date
        /// </summary>
        public static DateTime CombineDateAndTime(DateTime date, string timeString)
        {
            if (string.IsNullOrWhiteSpace(timeString))
                return date;

            try 
            {
                // Try to parse formats like "10:30 AM" or "14:30"
                var timeParts = timeString.Split(':');
                if (timeParts.Length < 2)
                    return date;

                int hours;
                int minutes = 0;
                
                // Handle first part (hours)
                if (!int.TryParse(timeParts[0], out hours))
                    return date;
                    
                // Handle second part which might contain minutes and AM/PM
                var secondPart = timeParts[1];
                bool isPM = secondPart.ToUpper().Contains("PM");
                bool isAM = secondPart.ToUpper().Contains("AM");
                
                // Extract minutes from the second part
                var minutesPart = new string(secondPart.Where(char.IsDigit).ToArray());
                if (!string.IsNullOrEmpty(minutesPart) && !int.TryParse(minutesPart, out minutes))
                    minutes = 0;
                
                // Adjust hours for PM
                if (isPM && hours < 12)
                    hours += 12;
                else if (isAM && hours == 12)
                    hours = 0;
                
                // Create a new DateTime with the parsed time
                return new DateTime(
                    date.Year, date.Month, date.Day,
                    hours, minutes, 0,
                    DateTimeKind.Unspecified);
            }
            catch
            {
                return date;
            }
        }
    }
}