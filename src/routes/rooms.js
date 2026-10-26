import { Router } from "express";
import { listRooms } from "../services/roomStore.js"

const router = Router();

router.get("/", async (req, res) => {
  try{
    const rooms = await listRooms();
    res.json(rooms)
  }catch{
    res.status(500).json({error: "Could not load room"})
  };
});


      // `TODO: implement POST /devices for ${roomId}, ${floor}, ${type}`);
router.post("/", async (req, res) => {
  try {
    const rooms = await listRooms();
    const { id, floor, type } = req.body ?? {};

    const roomId = typeof id === "string" ? id.trim() : "";
    const roomType = typeof type === "string" ? type.trim() : "";

    if (!roomId || !roomType || !Number.isSafeInteger(floor)) {
      return res.status(400).json({
        error: "id and type must be non-empty strings, and floor must be an integer"
      });
    }

    if (rooms.some((room) => room.id === roomId)) {
      return res.status(409).json({ error: "A room with that id already exists" });
    }

    const newRoom = { id: roomId, floor, type: roomType };
    rooms.push(newRoom);

    await writeJson(dataFile, rooms);

    res
      .location(`/api/rooms/${encodeURIComponent(roomId)}`)
      .status(201)
      .json(newRoom);
  } catch (error) {
    next(error);
  }
});


router.get("/:roomId", async (req, res) => {
  //res.status(501).json({ error: "TODO: get room" });
  try {
    const rooms = await listRooms();
    const room = rooms.find((item) => item.id === req.params.roomId);

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.status(200).json(room);
  } catch (error) {
    next(error);
  }
});

export default router;
