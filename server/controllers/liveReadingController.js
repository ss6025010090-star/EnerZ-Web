
import pool from "../config/db.js";

// Get the latest reading for a specific floor.
export const getLatestFloorReading = async (req, res) => {
  try {
    const { floorNumber } = req.params;

    const result = await pool.query(
      `SELECT
          f.id,
          f.floor_number,
          f.voltage,
          f.current,
          f.total_power,
          f.energy_today,
          f.recorded_at,
          l.device_code,
          l.status,
          l.power
       FROM floor_live_readings f
       LEFT JOIN light_readings l
          ON f.id = l.reading_id
       WHERE f.floor_number = $1
       AND f.recorded_at = (
          SELECT MAX(recorded_at)
          FROM floor_live_readings
          WHERE floor_number = $1
       )
       ORDER BY l.device_code`,
      [floorNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No live readings found for this floor.",
      });
    }

    const reading = {
      floorNumber: result.rows[0].floor_number,
      voltage: Number(result.rows[0].voltage),
      current: Number(result.rows[0].current),
      totalPower: Number(result.rows[0].total_power),
      energyToday: Number(result.rows[0].energy_today),
      recordedAt: result.rows[0].recorded_at,
      lights: result.rows
        .filter((row) => row.device_code !== null)
        .map((row) => ({
          deviceCode: row.device_code,
          status: row.status,
          power: Number(row.power),
        })),
    };

    res.json(reading);
  } catch (error) {
    console.error("Error retrieving live readings:", error);

    res.status(500).json({
      message: "Failed to retrieve live readings.",
    });
  }
};


export const getTodayFloorReadings = async (req, res) => {
    try {
      const { floorNumber } = req.params;
  
      if (!["1", "2"].includes(floorNumber)) {
        return res.status(400).json({
          message: "Invalid floor number.",
        });
      }
  
      const result = await pool.query(
        `SELECT
            id,
            floor_number,
            total_power,
            energy_today,
            recorded_at
         FROM floor_live_readings
         WHERE floor_number = $1
         AND recorded_at >= (
           date_trunc(
             'day',
             NOW() AT TIME ZONE 'Asia/Phnom_Penh'
           ) AT TIME ZONE 'Asia/Phnom_Penh'
         )
         AND recorded_at < (
           (
             date_trunc(
               'day',
               NOW() AT TIME ZONE 'Asia/Phnom_Penh'
             ) + INTERVAL '1 day'
           ) AT TIME ZONE 'Asia/Phnom_Penh'
         )
         ORDER BY recorded_at ASC`,
        [floorNumber]
      );
  
      const readings = result.rows.map((row) => ({
        id: row.id,
        floorNumber: row.floor_number,
        totalPower: Number(row.total_power),
        energyToday: Number(row.energy_today),
        recordedAt: row.recorded_at,
      }));
  
      res.json(readings);
    } catch (error) {
      console.error("Error retrieving today's readings:", error);
  
      res.status(500).json({
        message: "Failed to retrieve today's readings.",
      });
    }
  };
  