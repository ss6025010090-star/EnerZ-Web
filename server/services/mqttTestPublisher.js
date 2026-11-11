import mqtt from "mqtt";

const MQTT_URL = "mqtt://localhost:1883";
const PUBLISH_INTERVAL = 5000;

export const startMqttTestPublisher = () => {
  const client = mqtt.connect(MQTT_URL);

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

  const generateReading = (floorNumber) => {
    const floor = floorData[floorNumber];
  
    // Generate light readings for each floor
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
  
    // Calculate total power from all lights
    const totalLightPower = lights.reduce(
      (sum, light) => sum + light.power,
      0
    );
  
    // Convert kW to W
    const power = Number((totalLightPower * 1000).toFixed(2));
  
    // Calculate current using power and voltage
    const current = Number((power / floor.voltage).toFixed(3));
  
    // Calculate energy increase
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

  let publishTimer = null;

  client.on("connect", () => {
    console.log("MQTT Test Publisher connected!");

    if (publishTimer) {
      clearInterval(publishTimer);
    }

    publishFloorReadings();

    publishTimer = setInterval(
      publishFloorReadings,
      PUBLISH_INTERVAL
    );
  });

  client.on("error", (error) => {
    console.error("MQTT Test Publisher error:", error.message);
  });

  return client;
};