
import mqtt from "mqtt";
import pool from "../config/db.js";   

const MQTT_URL = "mqtt://localhost:1883";
const floorEnergyData = {
    1: {
      firstEnergy: null,
      energyToday: 0,
      readingDate: null,
    },
    2: {
      firstEnergy: null,
      energyToday: 0,
      readingDate: null,
    },
};


const restoreFloorEnergyData = async () => {
    const result = await pool.query(`
      SELECT
        floor_number,
        MIN(recorded_at) AS first_recorded_at,
        (ARRAY_AGG(meter_energy ORDER BY recorded_at ASC))[1]
          AS first_energy,
        (ARRAY_AGG(meter_energy ORDER BY recorded_at DESC))[1]
          AS latest_energy,
        TO_CHAR(
          (MAX(recorded_at) AT TIME ZONE 'Asia/Phnom_Penh')::date,
          'YYYY-MM-DD'
        ) AS reading_date
      FROM floor_live_readings
      WHERE meter_energy IS NOT NULL
        AND (recorded_at AT TIME ZONE 'Asia/Phnom_Penh')::date =
            (NOW() AT TIME ZONE 'Asia/Phnom_Penh')::date
      GROUP BY floor_number
    `);
  
    for (const row of result.rows) {
      const floorDataItem = floorEnergyData[row.floor_number];
  
      if (!floorDataItem) continue;
  
      const firstEnergy = Number(row.first_energy);
      const latestEnergy = Number(row.latest_energy);
  
      // If the latest reading is lower than the first,
      // the simulated meter counter has gone backwards.
      const meterWasReset = latestEnergy < firstEnergy;
  
      floorDataItem.firstEnergy = meterWasReset
        ? latestEnergy
        : firstEnergy;
  
      floorDataItem.energyToday = 0;
      floorDataItem.readingDate = row.reading_date;
  
      console.log(
        `Floor ${row.floor_number}:`,
        `Starting energy = ${floorDataItem.firstEnergy}`,
        meterWasReset ? "(reset detected)" : "(normal)"
      );
    }
  
    console.log("Today's energy baseline restored from database.");
  };
  


export const startMqttService = () => {
  const client = mqtt.connect(MQTT_URL);
  restoreFloorEnergyData().catch((error) => {
    console.error("Error restoring energy data:", error);
  });

  client.on("connect", () => {
    console.log("Connected to MQTT Broker!");

    client.subscribe("enersight/#", (error) => {
      if (error) {
        console.error("MQTT subscription error:", error);
      } else {
        console.log("Subscribed to EnerSight topics!");
      }
    });
  });

  client.on("message", async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
  
      console.log("Topic:", topic);
      console.log("Received data:", data);
      if (
        ![1, 2].includes(data.floorNumber) ||
        !Number.isFinite(data.voltage) ||
        !Number.isFinite(data.current) ||
        !Number.isFinite(data.power) ||
        !Number.isFinite(data.energy) ||
        data.voltage < 0 ||
        data.current < 0 ||
        data.power < 0 ||
        data.energy < 0
      ) {
        console.error("Invalid MQTT data:", data);
        return;
      }

      const totalPower = data.power / 1000;
      const floorData = floorEnergyData[data.floorNumber];

    const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Phnom_Penh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    }).format(new Date());

    // Check whether this is a new day
    if (floorData.readingDate !== today) {
    floorData.firstEnergy = data.energy;
    floorData.energyToday = 0;
    floorData.readingDate = today;
    } else {
    floorData.energyToday = Number(
        (data.energy - floorData.firstEnergy).toFixed(4)
    );
    }


    let dbClient;
    let dbClientHasError = false;

    try {
      dbClient = await pool.connect();

      dbClient.on("error", (clientError) => {
        dbClientHasError = true;

        console.error(
          "PostgreSQL client connection error:",
          clientError.message
        );
      });
    
      await dbClient.query("BEGIN");
    
      const result = await dbClient.query(
        `INSERT INTO floor_live_readings
        (floor_number, voltage, current, total_power, energy_today, meter_energy)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          data.floorNumber,
          data.voltage,
          data.current,
          totalPower,
          floorData.energyToday,
          data.energy,
        ]
      );
    
      if (Array.isArray(data.lights)) {
        for (const light of data.lights) {
          await dbClient.query(
            `INSERT INTO light_readings
            (reading_id, device_code, status, power)
            VALUES ($1, $2, $3, $4)`,
            [
              result.rows[0].id,
              light.deviceCode,
              light.status,
              light.status === "ON" ? light.power : 0,
            ]
          );
        }
      }
    
      await dbClient.query("COMMIT");
    
      console.log(
        `Floor ${data.floorNumber}: Reading saved successfully!`
      );
    
    } catch (error) {
      if (dbClient) {
        try {
          await dbClient.query("ROLLBACK");
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError.message);
        }
      }
    
      console.error("Error saving MQTT reading:", error.message);
    
    } finally {
      if (dbClient) {
        dbClient.release(dbClientHasError);
      }
    }
  
    } catch (error) {
      console.error("Error processing MQTT message:", error.message);
    }
  });

  client.on("error", (error) => {
    console.error("MQTT connection error:", error.message);
  });

  return client;
};
