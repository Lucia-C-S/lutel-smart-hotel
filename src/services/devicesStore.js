import { readJson, writeJson } from "./jsonStore.js";
import { listRooms } from "./roomStore.js";

const devicesFile = new URL("../../data/devices.json", import.meta.url);
const readingsFile = new URL("../../data/readings.json", import.meta.url);
const alarmsFile = new URL("../../data/alarms.json", import.meta.url);

function storeError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

export async function listDevices() {
  return readJson(devicesFile, []);
}

export async function getDevice(deviceId) {
  const devices = await listDevices();
  return devices.find((device) => device.id === deviceId) ?? null;
}

export async function addDevice(device) {
  const devices = await listDevices();
  if (devices.some((item) => item.id === device.id)) {
    throw storeError(409, `A device with id ${device.id} already exists`);
  }

  const rooms = await listRooms();
  if (!rooms.some((room) => room.id === String(device.roomId))) {
    throw storeError(404, `Room ${device.roomId} does not exist`);
  }

  devices.push(device);
  await writeJson(devicesFile, devices);
  return device;
}

export async function deleteDevice(deviceId) {
  const devices = await listDevices();
  if (!devices.some((device) => device.id === deviceId)) {
    return false;
  }

  await writeJson(devicesFile, devices.filter((device) => device.id !== deviceId));
  const readings = await readJson(readingsFile, []);
  await writeJson(
    readingsFile,
    readings.filter((reading) => reading.deviceId !== deviceId),
  );
  const alarms = await readJson(alarmsFile, []);
  await writeJson(
    alarmsFile,
    alarms.filter((alarm) => alarm.deviceId !== deviceId),
  );
  return true;
}

export async function listReadings(deviceId) {
  const readings = await readJson(readingsFile, []);
  return readings.filter((reading) => reading.deviceId === deviceId);
}

export async function addReading(reading) {
  const readings = await readJson(readingsFile, []);
  readings.push(reading);
  await writeJson(readingsFile, readings);
  return reading;
}
