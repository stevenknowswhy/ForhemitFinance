#!/usr/bin/env python3
"""
Mock Data Generation Script
Generates date ranges and timestamps for 3 months of mock financial data
Supports business hours vs personal hours patterns
"""

import sys
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional

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


def generate_date_ranges(
    months: int = 3,
    timezone_name: Optional[str] = None,
    include_business_hours: bool = True,
    include_personal_hours: bool = True
) -> Dict:
    """
    Generate date ranges for mock data generation.
    
    Args:
        months: Number of months to generate (default: 3)
        timezone_name: IANA timezone name (e.g., 'America/New_York')
        include_business_hours: Generate transactions during business hours (9 AM - 5 PM)
        include_personal_hours: Generate transactions during personal hours (all day)
    
    Returns:
        Dictionary with date ranges, timestamps, and transaction time patterns
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
    
    # Calculate start date (months ago)
    start_date = now - timedelta(days=months * 30)
    
    # Generate date ranges
    dates = []
    current_date = start_date
    
    while current_date <= now:
        # Business hours: 9 AM - 5 PM (9:00 - 17:00)
        # Personal hours: 6 AM - 11 PM (6:00 - 23:00)
        
        # Determine transaction times based on day of week
        day_of_week = current_date.weekday()  # 0 = Monday, 6 = Sunday
        
        # Business transactions: Monday-Friday, 9 AM - 5 PM
        if include_business_hours and day_of_week < 5:  # Mon-Fri
            business_hours = list(range(9, 17))  # 9 AM to 5 PM
        else:
            business_hours = []
        
        # Personal transactions: All days, 6 AM - 11 PM
        if include_personal_hours:
            personal_hours = list(range(6, 23))  # 6 AM to 11 PM
        else:
            personal_hours = []
        
        dates.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "timestamp": int(current_date.timestamp() * 1000),  # Milliseconds
            "iso": current_date.isoformat(),
            "day_of_week": day_of_week,
            "is_weekend": day_of_week >= 5,
            "business_hours": business_hours,
            "personal_hours": personal_hours,
        })
        
        current_date += timedelta(days=1)
    
    return {
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": now.strftime("%Y-%m-%d"),
        "start_timestamp": int(start_date.timestamp() * 1000),
        "end_timestamp": int(now.timestamp() * 1000),
        "timezone": timezone_name or "local",
        "total_days": len(dates),
        "dates": dates,
    }


def generate_transaction_times(
    date_info: Dict,
    transaction_type: str = "mixed",
    count: int = 1
) -> List[Dict]:
    """
    Generate specific transaction times for a given date.
    
    Args:
        date_info: Date information from generate_date_ranges
        transaction_type: "business", "personal", or "mixed"
        count: Number of transactions to generate
    
    Returns:
        List of transaction time dictionaries with timestamps
    """
    import random
    
    transactions = []
    base_date = datetime.fromisoformat(date_info["iso"].replace("Z", "+00:00"))
    
    for i in range(count):
        hour = None
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        if transaction_type == "business":
            # Business hours only
            if date_info["business_hours"]:
                hour = random.choice(date_info["business_hours"])
        elif transaction_type == "personal":
            # Personal hours only
            if date_info["personal_hours"]:
                hour = random.choice(date_info["personal_hours"])
        else:
            # Mixed: prefer business hours on weekdays, personal hours on weekends
            if not date_info["is_weekend"] and date_info["business_hours"]:
                # 70% business hours, 30% personal hours on weekdays
                if random.random() < 0.7:
                    hour = random.choice(date_info["business_hours"])
                else:
                    hour = random.choice(date_info["personal_hours"])
            else:
                # Weekend: all personal hours
                if date_info["personal_hours"]:
                    hour = random.choice(date_info["personal_hours"])
        
        if hour is None:
            # Fallback to any hour if no hours available
            hour = random.randint(6, 23)
        
        transaction_time = base_date.replace(
            hour=hour,
            minute=minute,
            second=second,
            microsecond=0
        )
        
        transactions.append({
            "date": date_info["date"],
            "time": transaction_time.strftime("%H:%M:%S"),
            "datetime": transaction_time.isoformat(),
            "timestamp": int(transaction_time.timestamp() * 1000),
            "hour": hour,
            "type": transaction_type,
        })
    
    return transactions


def main():
    """Main function to run the script from command line"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate mock data date ranges")
    parser.add_argument("--months", type=int, default=3, help="Number of months to generate")
    parser.add_argument("--timezone", type=str, default=None, help="Timezone (e.g., America/New_York)")
    parser.add_argument("--format", type=str, default="json", choices=["json", "dates"], help="Output format")
    parser.add_argument("--business-only", action="store_true", help="Only business hours")
    parser.add_argument("--personal-only", action="store_true", help="Only personal hours")
    
    args = parser.parse_args()
    
    include_business = not args.personal_only
    include_personal = not args.business_only
    
    result = generate_date_ranges(
        months=args.months,
        timezone_name=args.timezone,
        include_business_hours=include_business,
        include_personal_hours=include_personal
    )
    
    if args.format == "json":
        print(json.dumps(result, indent=2))
    else:
        print(f"Date Range: {result['start_date']} to {result['end_date']}")
        print(f"Total Days: {result['total_days']}")
        print(f"Timezone: {result['timezone']}")
        print(f"Start Timestamp: {result['start_timestamp']}")
        print(f"End Timestamp: {result['end_timestamp']}")
    
    return result


if __name__ == "__main__":
    main()
