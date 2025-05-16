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
        }

        public static DateTime ParseToIst(string dateString)
        {
            if (DateTime.TryParse(dateString, out DateTime result))
            {
                return result.ToIst();
            }
            return DateTime.UtcNow.ToIst();
        }
    }
}