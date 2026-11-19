
from sqlalchemy import text

from services.forecasting.database import get_database_engine



def get_recent_floor_readings(floor_number, days=30):
    """
    Retrieve energy readings for a specific floor
    within the last specified number of days.
    """

    engine = get_database_engine()

    query = text("""
        SELECT
            id,
            floor_number,
            voltage,
            current,
            total_power,
            energy_today,
            recorded_at,
            meter_energy
        FROM floor_live_readings
        WHERE floor_number = :floor_number
          AND recorded_at >= NOW() - (:days * INTERVAL '1 day')
        ORDER BY recorded_at ASC
    """)

    with engine.connect() as connection:
        result = connection.execute(
            query,
            {
                "floor_number": floor_number,
                "days": days
            }
        )

        return [dict(row._mapping) for row in result]



def get_recent_light_readings(floor_number, limit=1000):
    """
    Retrieve recent lighting readings for a specific floor.
    """

    engine = get_database_engine()

    query = text("""
        SELECT
            lr.id,
            lr.reading_id,
            fl.floor_number,
            lr.device_code,
            lr.status,
            lr.power,
            fl.recorded_at
        FROM light_readings lr
        JOIN floor_live_readings fl
            ON lr.reading_id = fl.id
        WHERE fl.floor_number = :floor_number
        ORDER BY fl.recorded_at DESC
        LIMIT :limit
    """)

    with engine.connect() as connection:
        result = connection.execute(
            query,
            {
                "floor_number": floor_number,
                "limit": limit
            }
        )

        return [dict(row._mapping) for row in result]


if __name__ == "__main__":

    for floor in [1, 2]:

        print(f"\n========== FLOOR {floor} ==========")

        energy_data = get_recent_floor_readings(floor, 5)

        print("\nEnergy Readings:")
        for reading in energy_data:
            print(reading)

        light_data = get_recent_light_readings(floor, 5)

        print("\nLighting Readings:")
        for reading in light_data:
            print(reading)
