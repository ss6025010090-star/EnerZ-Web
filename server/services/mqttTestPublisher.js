
import mqtt from "mqtt";
import pool from "../config/db.js";

const MQTT_URL = "mqtt://localhost:1883";
const PUBLISH_INTERVAL = 5000;

const floorData = {
  1: {
    voltage: 220,
    meterEnergy: 100.001,
  },
  2: {
    voltage: 220,
    meterEnergy: 50.000,
  },
};

// Restore the latest cumulative energy readings from PostgreSQL.
const restoreMeterEnergy = async () => {
  const result = await pool.query(`
    SELECT DISTINCT ON (floor_number)
      floor_number,
      meter_energy
    FROM floor_live_readings
    WHERE meter_energy IS NOT NULL
    ORDER BY floor_number, recorded_at DESC
  `);

  for (const row of result.rows) {
    const savedEnergy = Number(row.meter_energy);

    if (
      floorData[row.floor_number] &&
      Number.isFinite(savedEnergy)
    ) {
      floorData[row.floor_number].meterEnergy = savedEnergy;
    }
  }

  console.log("MQTT publisher energy readings restored:");

  console.log(
    `Floor 1: ${floorData[1].meterEnergy.toFixed(4)} kWh`
  );
  console.log(
    `Floor 2: ${floorData[2].meterEnergy.toFixed(4)} kWh`
  );
};

export const startMqttTestPublisher = () => {
  const client = mqtt.connect(MQTT_URL);

  let publishTimer = null;
  let initialized = false;

  const generateReading = (floorNumber) => {
    const floor = floorData[floorNumber];

    const deviceCodes =
      floorNumber === 1
        ? ["LT-1", "LT-2"]
        : ["LT-3"];

    const lights = deviceCodes.map((deviceCode) => {
      const status = Math.random() > 0.5 ? "ON" : "OFF";

      const power =
        status === "ON"
          ? Number((0.0425 + Math.random() * 0.005).toFixed(4))
          : 0;

      return {
        deviceCode,
        status,
        power,
      };
    });

    const totalLightPower = lights.reduce(
      (sum, light) => sum + light.power,
      0
    );

    const power = Number((totalLightPower * 1000).toFixed(2));
    const current = Number((power / floor.voltage).toFixed(3));

    const energyIncrease =
      (power / 1000) * (PUBLISH_INTERVAL / 3600000);

    floor.meterEnergy += energyIncrease;

    return {
      floorNumber,
      voltage: floor.voltage,
      current,
      power,
      energy: Number(floor.meterEnergy.toFixed(4)),
      lights,
    };
  };

  const publishFloorReadings = () => {
    [1, 2].forEach((floorNumber) => {
      const reading = generateReading(floorNumber);
      const topic = `enersight/floor${floorNumber}`;

      client.publish(topic, JSON.stringify(reading), (error) => {
        if (error) {
          console.error(
            `Floor ${floorNumber}: Publishing failed`,
            error
          );
        } else {
          console.log(
            `Floor ${floorNumber}: Fake reading published`,
            reading
          );
        }
      });
    });
  };

  client.on("connect", async () => {
    console.log("MQTT Test Publisher connected!");

    try {
      // Restore only once, not every time MQTT reconnects.
      if (!initialized) {
        await restoreMeterEnergy();
        initialized = true;
      }

      if (publishTimer) {
        clearInterval(publishTimer);
      }

      publishFloorReadings();

      publishTimer = setInterval(
        publishFloorReadings,
        PUBLISH_INTERVAL
      );
    } catch (error) {
      console.error(
        "Could not restore publisher energy readings:",
        error.message
      );
    }
  });

  client.on("error", (error) => {
    console.error(
      "MQTT Test Publisher error:",
      error.message
    );
  });

  return client;
};
