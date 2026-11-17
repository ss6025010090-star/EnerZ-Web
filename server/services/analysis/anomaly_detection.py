
from datetime import datetime
from pprint import pprint

from .database import get_recent_floor_readings
from .energy_analysis import analyze_daily_energy

# Detect meter counter decreases larger than the tolerance
COUNTER_RESET_THRESHOLD_KWH = 0.05
# A meter increase larger than this value between two
# consecutive readings will be investigated.
METER_JUMP_THRESHOLD_KWH = 1.0

# Daily usage above this multiple of the historical median
# will be flagged for investigation.
DAILY_USAGE_MULTIPLIER = 1.5

# Minimum additional usage above the historical median.
# This helps avoid flagging tiny differences.
DAILY_USAGE_MINIMUM_INCREASE = 0.2


def detect_meter_anomalies(floor_number):
    """
    Detect sudden increases or decreases in meter energy
    between consecutive readings.
    """

    readings = get_recent_floor_readings(
        floor_number,
        limit=100000
    )

    # Database results are newest first.
    # Sort them so we can compare readings chronologically.
    readings = sorted(
        readings,
        key=lambda item: item["recorded_at"]
    )

    anomalies = []

    for index in range(1, len(readings)):

        previous = readings[index - 1]
        current = readings[index]

        previous_energy = previous["meter_energy"]
        current_energy = current["meter_energy"]

        if previous_energy is None or current_energy is None:
            continue

        previous_energy = float(previous_energy)
        current_energy = float(current_energy)

        energy_change = current_energy - previous_energy

        if energy_change > METER_JUMP_THRESHOLD_KWH:

            anomalies.append({
                "type": "sudden_meter_increase",
                "floor_number": floor_number,
                "severity": "high",
                "previous_reading": previous_energy,
                "current_reading": current_energy,
                "energy_change_kwh": round(energy_change, 4),
                "recorded_at": current["recorded_at"].isoformat(),
                "message": (
                    "Meter energy increased unusually "
                    "between consecutive readings."
                )
            })

        elif energy_change < -COUNTER_RESET_THRESHOLD_KWH:

            anomalies.append({
                "type": "meter_counter_reset",
                "floor_number": floor_number,
                "severity": "low",
                "previous_reading": previous_energy,
                "current_reading": current_energy,
                "energy_change_kwh": round(energy_change, 4),
                "recorded_at": current["recorded_at"].isoformat(),
                "message": (
                    "Meter energy counter decreased unexpectedly. "
                    "This may indicate a meter reset or data-source reinitialization."
                )
            })

    return anomalies


def detect_high_daily_consumption(floor_number):
    """
    Compare daily consumption with the historical median
    and identify unusually high usage.
    """

    daily_results = analyze_daily_energy(floor_number)

    if not daily_results:
        return []

    historical_median = next(
        (
            day["historical_median_kwh"]
            for day in daily_results
            if day["historical_median_kwh"] is not None
        ),
        None
    )

    if historical_median is None:
        return []

    threshold = max(
        historical_median * DAILY_USAGE_MULTIPLIER,
        historical_median + DAILY_USAGE_MINIMUM_INCREASE
    )

    anomalies = []

    for day in daily_results:

        # Only compare days with enough valid readings.
        # Partial and insufficient-data days are not evaluated.
        if day["status"] != "normal":
            continue

        daily_usage = day["daily_energy_kwh"]

        if daily_usage > threshold:

            increase = daily_usage - historical_median

            percentage_increase = (
                increase / historical_median * 100
                if historical_median > 0
                else None
            )

            anomalies.append({
                "type": "high_daily_consumption",
                "floor_number": floor_number,
                "severity": "medium",
                "usage_date": day["usage_date"],
                "daily_energy_kwh": daily_usage,
                "historical_median_kwh": historical_median,
                "threshold_kwh": round(threshold, 4),
                "increase_kwh": round(increase, 4),
                "increase_percentage": (
                    round(percentage_increase, 2)
                    if percentage_increase is not None
                    else None
                ),
                "message": (
                    "Daily energy consumption is higher "
                    "than the historical pattern."
                )
            })

    return anomalies


def analyze_floor_anomalies(floor_number):
    """
    Run all anomaly checks for one floor.
    """

    meter_anomalies = detect_meter_anomalies(floor_number)

    daily_anomalies = detect_high_daily_consumption(floor_number)

    return {
        "floor_number": floor_number,
        "total_anomalies": (
            len(meter_anomalies) + len(daily_anomalies)
        ),
        "meter_anomalies": meter_anomalies,
        "daily_anomalies": daily_anomalies
    }


def analyze_all_floors():
    """
    Analyze anomalies across Floor 1 and Floor 2.
    """

    results = {}

    for floor_number in [1, 2]:

        results[f"floor_{floor_number}"] = analyze_floor_anomalies(
            floor_number
        )

    return results


if __name__ == "__main__":

    results = analyze_all_floors()

    for floor, analysis in results.items():

        print(f"\n========== {floor.upper()} ==========")

        print("\nTotal anomalies:")
        print(analysis["total_anomalies"])

        print("\nMeter anomalies:")
        pprint(analysis["meter_anomalies"])

        print("\nHigh daily consumption:")
        pprint(analysis["daily_anomalies"])
