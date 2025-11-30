#!/usr/bin/env python3
"""
Date and Time Utility Script
Gets current date and time in a specific timezone
Formats date as "Month Day, Year" and time as 12-hour AM/PM format

Requires Python 3.9+ for zoneinfo support
"""

import sys
from datetime import datetime

# Try to use zoneinfo (Python 3.9+), fall back to pytz if needed
try:
    from zoneinfo import ZoneInfo
    HAS_ZONEINFO = True
except ImportError:
    try:
        from backports.zoneinfo import ZoneInfo
        HAS_ZONEINFO = True
    except ImportError:
        try:
            import pytz
            HAS_ZONEINFO = False
        except ImportError:
            print("Error: Requires Python 3.9+ with zoneinfo or pytz package", file=sys.stderr)
            sys.exit(1)

def format_date_time(timezone_name=None):
    """
    Get current date and time formatted according to specifications.
    
    Args:
        timezone_name (str, optional): IANA timezone name (e.g., 'America/New_York')
                                       If None, uses system local timezone
    
    Returns:
        dict: Dictionary with formatted date, time, and datetime strings
    """
    # Get current time in specified timezone
    if timezone_name:
        try:
            if HAS_ZONEINFO:
                tz = ZoneInfo(timezone_name)
                now = datetime.now(tz)
            else:
                tz = pytz.timezone(timezone_name)
                now = datetime.now(tz)
        except (ValueError, pytz.exceptions.UnknownTimeZoneError) as e:
            print(f"Warning: Unknown timezone '{timezone_name}'. Using system timezone.", file=sys.stderr)
            now = datetime.now()
    else:
        now = datetime.now()
    
    # Format date as "Month Day, Year" (e.g., "November 29, 2024")
    date_str = now.strftime("%B %d, %Y")
    
    # Format time as 12-hour AM/PM format (e.g., "3:45 PM")
    time_str = now.strftime("%I:%M %p").lstrip('0')  # Remove leading zero from hour
    
    # Combined format: "Month Day, Year at H:MM AM/PM"
    datetime_str = f"{date_str} at {time_str}"
    
    return {
        "date": date_str,
        "time": time_str,
        "datetime": datetime_str,
        "timezone": timezone_name or "local",
        "timestamp": now.timestamp(),
        "iso": now.isoformat()
    }

def main():
    """Main function to run the script from command line"""
    timezone = None
    
    # Check for timezone argument
    if len(sys.argv) > 1:
        timezone = sys.argv[1]
    
    result = format_date_time(timezone)
    
    # Print results
    print("Current Date and Time:")
    print(f"  Date: {result['date']}")
    print(f"  Time: {result['time']}")
    print(f"  Full: {result['datetime']}")
    print(f"  Timezone: {result['timezone']}")
    print(f"  Timestamp: {result['timestamp']}")
    print(f"  ISO: {result['iso']}")
    
    return result

if __name__ == "__main__":
    main()

