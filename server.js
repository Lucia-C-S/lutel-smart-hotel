import express from "express";
import alarmsRouter from "./src/routes/alarms.js";
import devicesRouter from "./src/routes/devices.js";
import roomsRouter from "./src/routes/rooms.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.static("public"));

app.use("/api/rooms", roomsRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/alarms", alarmsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`P2 smart-hotel app running at http://localhost:${PORT}/`);
});
