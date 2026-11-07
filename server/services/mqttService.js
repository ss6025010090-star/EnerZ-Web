
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
      SELECT DISTINCT ON (floor_number)
        floor_number,
        meter_energy,
        (recorded_at AT TIME ZONE 'Asia/Phnom_Penh')::date AS reading_date
      FROM floor_live_readings
      WHERE meter_energy IS NOT NULL
        AND (recorded_at AT TIME ZONE 'Asia/Phnom_Penh')::date =
            (NOW() AT TIME ZONE 'Asia/Phnom_Penh')::date
      ORDER BY floor_number, recorded_at ASC
    `);
  
    for (const row of result.rows) {
      const floorData = floorEnergyData[row.floor_number];
  
      floorData.firstEnergy = Number(row.meter_energy);
      floorData.readingDate = new Date(row.reading_date)
        .toLocaleDateString("en-CA", {
            timeZone: "Asia/Phnom_Penh",
        });
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


        const dbClient = await pool.connect();

        try {
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
          // Save simulated light readings.
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
          await dbClient.query("ROLLBACK");
          console.error("Error saving MQTT reading:", error);
        } finally {
            dbClient.release();
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
