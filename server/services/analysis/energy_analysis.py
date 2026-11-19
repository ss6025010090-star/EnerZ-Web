import json
from collections import defaultdict
from datetime import datetime
from statistics import median
from zoneinfo import ZoneInfo
from pprint import pprint

from .database import get_recent_floor_readings


TIMEZONE = ZoneInfo("Asia/Phnom_Penh")

# Based on the historical data currently available.
MIN_DAILY_READINGS = 3000

# A daily usage value above this multiple of the historical median
# will be flagged as abnormal.
ANOMALY_MULTIPLIER = 5

# Additional allowance above the historical median, in kWh.
ANOMALY_MINIMUM_INCREASE = 1.0
# Minimum decrease required to identify a counter reset (kWh).
COUNTER_RESET_THRESHOLD_KWH = 0.05


def convert_to_float(value):
    """Convert PostgreSQL numeric values into Python floats."""

    if value is None:
        return None

    return float(value)


def get_local_date(timestamp):
    """Convert a timestamp into the Cambodia local date."""

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=TIMEZONE)

    return timestamp.astimezone(TIMEZONE).date()


def is_complete_day(day):
    """
    Check whether readings cover nearly the entire day.
    """

    first_reading = datetime.fromisoformat(
        day["first_reading"]
    )

    last_reading = datetime.fromisoformat(
        day["last_reading"]
    )

    start_limit = first_reading.replace(
        hour=0,
        minute=30,
        second=0
    )

    end_limit = last_reading.replace(
        hour=23,
        minute=30,
        second=0
    )

    return (
        first_reading <= start_limit
        and last_reading >= end_limit
    )


def calculate_positive_energy_usage(records, field):
    """
    Calculate energy usage from consecutive counter readings.

    Positive differences represent energy consumption.
    Negative differences indicate a counter reset and are ignored.
    """

    total_usage = 0.0
    reset_count = 0
    previous_value = None

    for record in records:

        current_value = convert_to_float(record[field])

        if current_value is None:
            continue

        if previous_value is not None:

            difference = current_value - previous_value

            if difference < -COUNTER_RESET_THRESHOLD_KWH:
                # A significant decrease indicates a counter reset.
                reset_count += 1

            elif difference > 0:
                # Count positive energy increases.
                total_usage += difference

            # Small negative differences are ignored.

        previous_value = current_value

    return round(total_usage, 4), reset_count


def collect_daily_readings(floor_number):
    """
    Retrieve energy readings and group them by Cambodia local date.

    Daily usage is calculated from positive consecutive meter-energy
    differences rather than max(energy_today) - min(energy_today).
    """

    readings = get_recent_floor_readings(
        floor_number,
        days=30
    )
    daily_groups = defaultdict(list)

    for reading in readings:

        recorded_at = reading["recorded_at"]

        usage_date = get_local_date(recorded_at)

        daily_groups[usage_date].append(reading)

    daily_results = []

    for usage_date, records in daily_groups.items():

        # Database readings are returned newest first.
        # Sort oldest first before calculating consecutive differences.
        records.sort(
            key=lambda record: record["recorded_at"]
        )

        energy_values = [
            convert_to_float(record["energy_today"])
            for record in records
            if record["energy_today"] is not None
        ]

        meter_values = [
            convert_to_float(record["meter_energy"])
            for record in records
            if record["meter_energy"] is not None
        ]

        if not energy_values and not meter_values:
            continue

        # Use meter_energy as the primary energy counter.
        if meter_values:

            daily_energy, reset_count = (
                calculate_positive_energy_usage(
                    records,
                    "meter_energy"
                )
            )

            energy_source = "meter_energy"

        else:

            # Fallback only when meter_energy is unavailable.
            daily_energy, reset_count = (
                calculate_positive_energy_usage(
                    records,
                    "energy_today"
                )
            )

            energy_source = "energy_today"

        meter_difference = None

        if meter_values:
            meter_difference = round(
                max(meter_values) - min(meter_values),
                4
            )

        timestamps = [
            record["recorded_at"]
            for record in records
        ]

        daily_results.append({
            "floor_number": floor_number,
            "usage_date": usage_date.isoformat(),
            "reading_count": len(records),

            "first_reading": min(timestamps).isoformat(),
            "last_reading": max(timestamps).isoformat(),

            "lowest_energy": (
                min(energy_values)
                if energy_values
                else None
            ),

            "highest_energy": (
                max(energy_values)
                if energy_values
                else None
            ),

            "daily_energy_kwh": daily_energy,

            "meter_energy_difference": meter_difference,

            "energy_source": energy_source,

            "counter_reset_count": reset_count,

            "counter_reset_detected": reset_count > 0
        })

    return sorted(
        daily_results,
        key=lambda item: item["usage_date"]
    )


def analyze_daily_energy(floor_number):
    """
    Analyze daily energy consumption and identify abnormal days.
    """

    daily_results = collect_daily_readings(floor_number)

    if not daily_results:
        return []

    today = datetime.now(TIMEZONE).date().isoformat()

    # Only use complete historical days without detected counter resets.
    historical_values = [
        day["daily_energy_kwh"]
        for day in daily_results
        if (
            day["usage_date"] != today
            and day["reading_count"] >= MIN_DAILY_READINGS
            and is_complete_day(day)
            and not day["counter_reset_detected"]
        )
    ]

    if historical_values:

        historical_median = median(historical_values)

        anomaly_threshold = max(
            historical_median * ANOMALY_MULTIPLIER,
            historical_median + ANOMALY_MINIMUM_INCREASE
        )

    else:

        historical_median = None
        anomaly_threshold = None

    for day in daily_results:

        usage = day["daily_energy_kwh"]

        if day["counter_reset_detected"]:

            status = "data_quality_issue"

        elif day["usage_date"] == today:

            status = "partial"

        elif (
            anomaly_threshold is not None
            and usage > anomaly_threshold
        ):

            status = "anomaly"

        elif day["reading_count"] < MIN_DAILY_READINGS:

            status = "insufficient_data"

        elif not is_complete_day(day):

            status = "partial"

        else:

            status = "normal"

        day["historical_median_kwh"] = (
            round(historical_median, 4)
            if historical_median is not None
            else None
        )

        day["anomaly_threshold_kwh"] = (
            round(anomaly_threshold, 4)
            if anomaly_threshold is not None
            else None
        )

        day["status"] = status

        day["usable_for_baseline"] = (
            status == "normal"
            and not day["counter_reset_detected"]
        )

    return daily_results


def analyze_all_floors():
    """Analyze energy consumption for Floor 1 and Floor 2."""

    results = {}

    for floor_number in [1, 2]:

        results[f"floor_{floor_number}"] = analyze_daily_energy(
            floor_number
        )

    return results


if __name__ == "__main__":

    analysis_results = analyze_all_floors()

    print(json.dumps(analysis_results))
