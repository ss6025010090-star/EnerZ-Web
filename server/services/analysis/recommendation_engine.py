import json
import sys
from pprint import pprint

from .anomaly_detection import analyze_floor_anomalies


def create_meter_increase_recommendation(anomaly):
    """
    Generate a recommendation for a sudden meter increase.
    """

    return {
        "recommendation_type": "meter_increase",
        "floor_number": anomaly["floor_number"],
        "title": "Verify Unusual Meter Reading",
        "severity": "high",
        "status": "needs_attention",
        "date": anomaly["recorded_at"],
        "summary": (
            f"The meter recorded a sudden increase of "
            f"{anomaly['energy_change_kwh']} kWh."
        ),
        "recommended_action": (
            "Check whether the meter reading is correct. "
            "If the increase is unexpected, inspect the meter "
            "and check for possible measurement errors."
        ),
        "evidence": {
            "previous_reading_kwh": anomaly["previous_reading"],
            "current_reading_kwh": anomaly["current_reading"],
            "energy_change_kwh": anomaly["energy_change_kwh"]
        }
    }


def create_meter_reset_recommendation(anomalies):
    """
    Generate one recommendation for multiple meter
    counter decreases detected on the same day.
    """

    first_anomaly = anomalies[0]

    largest_decrease = min(
        anomalies,
        key=lambda item: item["energy_change_kwh"]
    )

    usage_date = first_anomaly["recorded_at"][:10]

    return {
        "recommendation_type": "meter_counter_reset",
        "floor_number": first_anomaly["floor_number"],
        "title": "Verify Meter Data Consistency",
        "severity": "low",
        "status": "review_suggested",
        "date": usage_date,
        "summary": (
            f"Detected {len(anomalies)} unexpected meter "
            f"counter decreases. The largest decrease was "
            f"{abs(largest_decrease['energy_change_kwh'])} kWh."
        ),
        "recommended_action": (
            "Check whether the meter was restarted or reset. "
            "Make sure the current energy reading is correct."
        ),
        "evidence": {
            "event_count": len(anomalies),
            "largest_decrease_kwh": abs(
                largest_decrease["energy_change_kwh"]
            ),
            "events": anomalies
        }
    }


def create_high_consumption_recommendation(anomaly):
    """
    Generate a recommendation for unusually high daily consumption.
    """

    percentage = anomaly["increase_percentage"]

    return {
        "recommendation_type": "high_daily_consumption",
        "floor_number": anomaly["floor_number"],
        "title": "Investigate High Energy Consumption",
        "severity": "medium",
        "status": "needs_attention",
        "date": anomaly["usage_date"],
        "summary": (
            f"Daily energy consumption was "
            f"{anomaly['daily_energy_kwh']} kWh, "
            f"{percentage}% above the historical median."
        ),
        "recommended_action": (
            "Check whether lights or electrical equipment "
            "were left on unnecessarily. Review the floor's "
            "daily energy usage and identify where energy "
            "consumption can be reduced."
        ),
        "evidence": {
            "daily_energy_kwh": anomaly["daily_energy_kwh"],
            "historical_median_kwh": anomaly["historical_median_kwh"],
            "increase_kwh": anomaly["increase_kwh"],
            "increase_percentage": percentage
        }
    }


def generate_floor_recommendations(floor_number):
    """
    Generate recommendations for one floor based on anomaly results.
    """

    analysis = analyze_floor_anomalies(floor_number)

    recommendations = []
    reset_groups = {}

    for anomaly in analysis["meter_anomalies"]:

        if anomaly["type"] == "sudden_meter_increase":

            recommendations.append(
                create_meter_increase_recommendation(anomaly)
            )

        elif anomaly["type"] == "meter_counter_reset":

            # Group counter resets by date.
            reset_date = anomaly["recorded_at"][:10]

            if reset_date not in reset_groups:
                reset_groups[reset_date] = []

            reset_groups[reset_date].append(anomaly)

    # Create one recommendation for each date.
    for anomalies in reset_groups.values():

        recommendations.append(
            create_meter_reset_recommendation(anomalies)
        )

    # Handle unusually high daily consumption.
    for anomaly in analysis["daily_anomalies"]:

        recommendations.append(
            create_high_consumption_recommendation(anomaly)
        )

    # Display more serious recommendations first.
    severity_order = {
        "high": 1,
        "medium": 2,
        "low": 3
    }

    recommendations.sort(
        key=lambda item: severity_order[item["severity"]]
    )

    return {
        "floor_number": floor_number,
        "total_recommendations": len(recommendations),
        "recommendations": recommendations
    }


def generate_all_recommendations():
    """
    Generate recommendations for all campus floors.
    """

    results = {}

    for floor_number in [1, 2]:

        results[f"floor_{floor_number}"] = (
            generate_floor_recommendations(floor_number)
        )

    return results


if __name__ == "__main__":

    results = generate_all_recommendations()

    # Return JSON for Node.js integration.
    if "--json" in sys.argv:

        print(json.dumps(results, indent=2))

    # Keep readable output for manual testing.
    else:

        for floor, data in results.items():

            print(f"\n========== {floor.upper()} ==========")

            print(
                f"\nTotal recommendations: "
                f"{data['total_recommendations']}"
            )

            print("\nRecommendations:")

            pprint(data["recommendations"])
