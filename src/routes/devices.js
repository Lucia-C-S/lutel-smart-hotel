import { Router } from "express";
import { randomUUID } from "node:crypto";
import {
  addDevice,
  addReading,
  deleteDevice,
  getDevice,
  listDevices,
  listReadings,
} from "../services/devicesStore.js";
import { addAlarm } from "../services/alarmsStore.js";

const router = Router();

const HIGH_TEMPERATURE_THRESHOLD = 26;
const HIGH_HUMIDITY_THRESHOLD = 75;
const HIGH_CO2_THRESHOLD = 1000;
const HIGH_NOISE_THRESHOLD = 65;
const DEVICE_TYPES = new Set([
  "temperature",
  "humidity",
  "co2",
  "noise",
  "panic-button",
  "alarm-button",
]);
const ALARM_RULES = {
  temperature: {
    threshold: HIGH_TEMPERATURE_THRESHOLD,
    type: "high-temperature",
    message: (reading) =>
      `Temperature ${reading}°C meets or exceeds the ${HIGH_TEMPERATURE_THRESHOLD}°C threshold.`,
  },
  humidity: {
    threshold: HIGH_HUMIDITY_THRESHOLD,
    type: "high-humidity",
    message: (reading) =>
      `Humidity ${reading}% meets or exceeds the ${HIGH_HUMIDITY_THRESHOLD}% threshold.`,
  },
  co2: {
    threshold: HIGH_CO2_THRESHOLD,
    type: "high-co2",
    message: (reading) =>
      `CO₂ ${reading} ppm meets or exceeds the ${HIGH_CO2_THRESHOLD} ppm threshold.`,
  },
  noise: {
    threshold: HIGH_NOISE_THRESHOLD,
    type: "high-noise",
    message: (reading) =>
      `Noise ${reading} dB(A) meets or exceeds the ${HIGH_NOISE_THRESHOLD} dB(A) threshold.`,
  },
};
const ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

// Handle route errors consistently.
function sendError(res, error, fallback) {
  const status = error.statusCode ?? 500;
  if (status === 500) console.error(`${fallback}:`, error);
  return res.status(status).json({
    error: status === 500 ? fallback : error.message,
  });
}

// Get an alarm for each supported device type.
function getAlarmForReading(deviceType, value) {
  const type = deviceType.trim().toLowerCase();
  const normalizedType = type === "temp" ? "temperature" : type;
  const rule = ALARM_RULES[normalizedType];

  if (rule && value >= rule.threshold) {
    return { type: rule.type, message: rule.message(value) };
  }
  if (
    (type === "panic-button" || type === "alarm-button") &&
    value === 1
  ) {
    return {
      type,
      message: `${type === "panic-button" ? "Panic" : "Alarm"} button activated.`,
    };
  }

  return null;
}

router.get("/", async (req, res) => {
  try {
    res.json(await listDevices());
  } catch (error) {
    sendError(res, error, "Could not load devices");
  }
});

router.post("/", async (req, res) => {
  const { id, roomId, type, label } = req.body ?? {};
  const deviceId = typeof id === "string" ? id.trim() : "";
  const deviceType = typeof type === "string" ? type.trim() : "";
  const normalizedType = deviceType.toLowerCase();
  const deviceLabel = typeof label === "string" ? label.trim() : "";
  const validRoomId =
    (typeof roomId === "string" && roomId.trim().length > 0) ||
    (typeof roomId === "number" && Number.isSafeInteger(roomId));

  if (
    !deviceId ||
    !DEVICE_TYPES.has(normalizedType) ||
    !deviceLabel ||
    !validRoomId
  ) {
    return res.status(400).json({
      error: `id and label must be non-empty strings, type must be one of ${[...DEVICE_TYPES].join(", ")}, and roomId must identify a room`,
    });
  }

  try {
    const device = await addDevice({
      id: deviceId,
      roomId,
      type: normalizedType,
      label: deviceLabel,
    });
    return res
      .location(`/api/devices/${encodeURIComponent(device.id)}`)
      .status(201)
      .json(device);
  } catch (error) {
    return sendError(res, error, "Could not create device");
  }
});

router.get("/:deviceId", async (req, res) => {
  try {
    const device = await getDevice(req.params.deviceId);
    if (!device) return res.status(404).json({ error: "Device not found" });
    return res.json(device);
  } catch (error) {
    return sendError(res, error, "Could not load device");
  }
});

router.delete("/:deviceId", async (req, res) => {
  try {
    const deleted = await deleteDevice(req.params.deviceId);
    if (!deleted) return res.status(404).json({ error: "Device not found" });
    return res.status(204).end();
  } catch (error) {
    return sendError(res, error, "Could not delete device");
  }
});

router.get("/:deviceId/readings", async (req, res) => {
  try {
    const device = await getDevice(req.params.deviceId);
    if (!device) return res.status(404).json({ error: "Device not found" });
    return res.json(await listReadings(device.id));
  } catch (error) {
    return sendError(res, error, "Could not load readings");
  }
});

router.post("/:deviceId/readings", async (req, res) => {
  const { deviceId, timestamp, value } = req.body ?? {};
  if (
    typeof deviceId !== "string" ||
    deviceId !== req.params.deviceId ||
    typeof timestamp !== "string" ||
    !ISO_TIMESTAMP.test(timestamp) ||
    !Number.isFinite(Date.parse(timestamp)) ||
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return res.status(400).json({
      error: "deviceId must match the URL, timestamp must be a valid date string, and value must be finite",
    });
  }

  try {
    const device = await getDevice(req.params.deviceId);
    if (!device) return res.status(404).json({ error: "Device not found" });

    const reading = await addReading({
      ...(req.body ?? {}),
      deviceId,
      timestamp,
      value,
    });
    const alarm = getAlarmForReading(device.type, value);
    if (alarm) {
      await addAlarm({
        alarmId: `alarm-${randomUUID()}`,
        deviceId,
        ...alarm,
        timestamp,
        acknowledged: false,
      });
    }

    return res.status(201).json(reading);
  } catch (error) {
    return sendError(res, error, "Could not record reading");
  }
});

export default router;
