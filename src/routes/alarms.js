import { Router } from "express";
import {
  acknowledgeAlarm,
  listAlarms,
} from "../services/alarmsStore.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    return res.json(await listAlarms());
  } catch (error) {
    console.error("Could not load alarms:", error);
    return res.status(500).json({ error: "Could not load alarms" });
  }
});

router.post("/:alarmId/ack", async (req, res) => {
  try {
    const alarm = await acknowledgeAlarm(req.params.alarmId);
    if (!alarm) return res.status(404).json({ error: "Alarm not found" });
    return res.json(alarm);
  } catch (error) {
    console.error("Could not acknowledge alarm:", error);
    return res.status(500).json({ error: "Could not acknowledge alarm" });
  }
});

export default router;
