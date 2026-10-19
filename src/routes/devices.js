import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(501).json({ error: "TODO: list devices" });
});

router.post("/", (req, res) => {
  res.status(501).json({ error: "TODO: create device" });
});

router.get("/:deviceId", (req, res) => {
  res.status(501).json({ error: "TODO: get device" });
});

router.delete("/:deviceId", (req, res) => {
  res.status(501).json({ error: "TODO: delete device" });
});

router.get("/:deviceId/readings", (req, res) => {
  res.status(501).json({ error: "TODO: list readings" });
});

router.post("/:deviceId/readings", (req, res) => {
  res.status(501).json({ error: "TODO: create reading and generate alarms" });
});

export default router;
