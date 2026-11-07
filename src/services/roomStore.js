import { readJson, writeJson } from "./jsonStore.js";

const roomsFile = new URL("../../data/rooms.json", import.meta.url);

function storeError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

export async function listRooms() {
  return readJson(roomsFile, []);
}

export async function getRoom(roomId) {
  const rooms = await listRooms();
  return rooms.find((room) => room.id === roomId) ?? null;
}

export async function addRoom(room) {
  if (!room || typeof room.id !== "string" || !room.id.trim()) {
    throw storeError(400, "A non-empty room id is required");
  }

  const rooms = await listRooms();
  if (rooms.some((item) => item.id === room.id)) {
    throw storeError(409, `A room with id ${room.id} already exists`);
  }

  rooms.push(room);
  await writeJson(roomsFile, rooms);
  return room;
}

export async function deleteRoom(roomId) {
  const rooms = await listRooms();
  if (!rooms.some((room) => room.id === roomId)) {
    throw storeError(404, `No room exists with id ${roomId}`);
  }

  await writeJson(roomsFile, rooms.filter((room) => room.id !== roomId));
}
