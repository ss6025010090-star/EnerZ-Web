
import pool from "../config/db.js";

const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const LIGHT_POWER_MIN = 0.0425;
const LIGHT_POWER_MAX = 0.0475;

const floors = [
  {
    floorNumber: 1,
    devices: ["LT-1", "LT-2"],
    lights: {},
    energyToday: 0,
    previousPower: 0,
    lastGeneratedAt: Date.now(),
  },
  {
    floorNumber: 2,
    devices: ["LT-3"],
    lights: {},
    energyToday: 0,
    previousPower: 0,
    lastGeneratedAt: Date.now(),
  },
];

// Give each light an initial status
function initializeLights(floor) {
  for (const device of floor.devices) {
    floor.lights[device] =
      Math.random() < 0.5 ? "ON" : "OFF";
  }
}

// Restore the latest saved data from PostgreSQL
async function restoreFloorState(floor) {
  // Set default light statuses first
  initializeLights(floor);

  const result = await pool.query(
    `SELECT id, total_power, energy_today
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
     ORDER BY recorded_at DESC
     LIMIT 1`,
    [floor.floorNumber]
  );

  // No reading exists for this floor today
  if (result.rows.length === 0) {
    floor.energyToday = 0;
    floor.previousPower = 0;
    floor.lastGeneratedAt = Date.now();

    console.log(
      `Floor ${floor.floorNumber}: No previous reading today. Starting fresh.`
    );

    return;
  }

  const latestReading = result.rows[0];

  // Restore previous energy and power
  floor.energyToday = Number(latestReading.energy_today);
  floor.previousPower = Number(latestReading.total_power);

  // Start counting elapsed time from now,
  // so we do not estimate energy during downtime.
  floor.lastGeneratedAt = Date.now();

  // Restore the previous light statuses
  const lightResult = await pool.query(
    `SELECT device_code, status
     FROM light_readings
     WHERE reading_id = $1`,
    [latestReading.id]
  );

  for (const light of lightResult.rows) {
    floor.lights[light.device_code] = light.status;
  }

  console.log(
    `Floor ${floor.floorNumber}: Previous data restored.`
  );

  console.log(
    `Energy Today: ${floor.energyToday} kWh`
  );

  console.log(
    `Previous Power: ${floor.previousPower} kW`
  );
}

// Generate one new reading for a floor
async function generateFloorReading(floor) {
  for (const device of floor.devices) {
    if (Math.random() < 0.3) {
      floor.lights[device] =
        floor.lights[device] === "ON" ? "OFF" : "ON";
    }
  }

  const lightData = floor.devices.map((device) => {
    const status = floor.lights[device];
  
    const power =
      status === "ON"
        ? Number(
            (
              LIGHT_POWER_MIN +
              Math.random() * (LIGHT_POWER_MAX - LIGHT_POWER_MIN)
            ).toFixed(4)
          )
        : 0;
  
    return {
      device,
      status,
      power,
    };
  });

  const totalPower = lightData.reduce(
    (sum, light) => sum + light.power,
    0
  );

  const now = Date.now();

  const elapsedHours =
    (now - floor.lastGeneratedAt) / 3600000;

  const averagePower =
    (floor.previousPower + totalPower) / 2;

  floor.energyToday += averagePower * elapsedHours;

  const voltage = Number(
    (219 + Math.random() * 3).toFixed(2)
  );

  const current = Number(
    ((totalPower * 1000) / voltage).toFixed(3)
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO floor_live_readings
       (floor_number, voltage, current, total_power, energy_today)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        floor.floorNumber,
        voltage,
        current,
        totalPower,
        floor.energyToday,
      ]
    );

    const readingId = result.rows[0].id;

    for (const light of lightData) {
      await client.query(
        `INSERT INTO light_readings
         (reading_id, device_code, status, power)
         VALUES ($1, $2, $3, $4)`,
        [
          readingId,
          light.device,
          light.status,
          light.power,
        ]
      );
    }

    await client.query("COMMIT");

    // Update the previous values after saving successfully
    floor.previousPower = totalPower;
    floor.lastGeneratedAt = now;

    console.log(
        `Floor ${floor.floorNumber}:`,
        lightData.map((light) => `${light.device}=${light.status} (${light.power} kW)`).join(", "),
        `Total Power=${totalPower.toFixed(4)} kW`
    );
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving floor reading:", error);
  } finally {
    client.release();
  }
}

// Generate readings for both floors
async function generateAllReadings() {
  for (const floor of floors) {
    await generateFloorReading(floor);
  }
}

// Start the simulator
export async function startLiveDataSimulator() {
  try {
    console.log("Restoring previous floor data...");

    // Restore both floors before generating new readings
    for (const floor of floors) {
      await restoreFloorState(floor);
    }

    console.log("Previous floor data restored.");

    // Generate the first readings
    await generateAllReadings();

    // Continue generating readings every 5 minutes
    setInterval(() => {
      generateAllReadings();
    }, UPDATE_INTERVAL);

    console.log("Live data simulator started.");
  } catch (error) {
    console.error(
      "Could not start live data simulator:",
      error
    );
  }
}
