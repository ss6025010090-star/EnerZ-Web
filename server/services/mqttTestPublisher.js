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

    const current = Number((0.3 + Math.random() * 0.4).toFixed(2));
    const power = Number((floor.voltage * current).toFixed(2));

    const energyIncrease =
      (power / 1000) * (PUBLISH_INTERVAL / 3600000);

    floor.meterEnergy += energyIncrease;

    return {
        floorNumber,
        voltage: floor.voltage,
        current,
        power,
        energy: Number(floor.meterEnergy.toFixed(4)),
      
        ...(floorNumber === 1 && {
          lights: [
            {
              deviceCode: "LT-1",
              status: Math.random() > 0.5 ? "ON" : "OFF",
              power: 0.040,
            },
            {
              deviceCode: "LT-2",
              status: Math.random() > 0.5 ? "ON" : "OFF",
              power: 0.040,
            },
          ],
        }),
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