import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(501).json({ error: "TODO: list alarms" });
});

router.post("/:alarmId/ack", (req, res) => {
  res.status(501).json({ error: "TODO: acknowledge alarm" });
});

export default router;
