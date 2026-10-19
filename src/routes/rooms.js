import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json([
    { id: "101", floor: 1, type: "single" },
    { id: "102", floor: 1, type: "double" },
    { id: "201", floor: 2, type: "double" },
    { id: "202", floor: 2, type: "suite" }
  ]);
});

router.post("/", (req, res) => {
  res.status(501).json({ error: "TODO: create room" });
});

router.get("/:roomId", (req, res) => {
  res.status(501).json({ error: "TODO: get room" });
});

export default router;
