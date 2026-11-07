import { Router } from "express";
import { addRoom, getRoom, listRooms } from "../services/roomStore.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rooms = await listRooms();
    res.json(rooms);
  } catch (error) {
    console.error("Could not load rooms:", error);
    res.status(500).json({ error: "Could not load rooms" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { id, floor, type } = req.body ?? {};
    const roomId = typeof id === "string" ? id.trim() : "";
    const roomType = typeof type === "string" ? type.trim() : "";

    if (!roomId || !roomType || !Number.isSafeInteger(floor)) {
      return res.status(400).json({
        error: "id and type must be non-empty strings, and floor must be an integer"
      });
    }

    const newRoom = { id: roomId, floor, type: roomType };
    await addRoom(newRoom);
    return res
      .location(`/api/rooms/${encodeURIComponent(roomId)}`)
      .status(201)
      .json(newRoom);
  } catch (error) {
    const status = error.statusCode ?? 500;
    if (status === 500) console.error("Could not create room:", error);
    return res.status(status).json({
      error: status === 500 ? "Could not create room" : error.message,
    });
  }
});

router.get("/:roomId", async (req, res) => {
  try {
    const room = await getRoom(req.params.roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.status(200).json(room);
  } catch (error) {
    console.error("Could not load room:", error);
    res.status(500).json({ error: "Could not load room" });
  }
});

export default router;
