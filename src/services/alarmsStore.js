import { readJson, writeJson } from "./jsonStore.js";

const alarmsFile = new URL("../../data/alarms.json", import.meta.url);

export async function listAlarms() {
  return readJson(alarmsFile, []);
}

export async function addAlarm(alarm) {
  const alarms = await listAlarms();
  if (alarms.some((item) => item.alarmId === alarm.alarmId)) {
    throw Object.assign(new Error(`Alarm ${alarm.alarmId} already exists`), {
      statusCode: 409,
    });
  }

  alarms.push(alarm);
  await writeJson(alarmsFile, alarms);
  return alarm;
}

export async function acknowledgeAlarm(alarmId) {
  const alarms = await listAlarms();
  const alarm = alarms.find((item) => item.alarmId === alarmId);
  if (!alarm) {
    return null;
  }

  alarm.acknowledged = true;
  await writeJson(alarmsFile, alarms);
  return alarm;
}
