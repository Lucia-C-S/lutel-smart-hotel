const roomsFile = new URL("../../data/rooms.json", import.meta.url);
    export async function listRooms() {
        return readJson( roomsfile, []);
    }
export async function addRoom(room){
    if (!room || typeof room.id !== "string" || !room.id.trim()) {
        fail (400, "Invalid room input.");ç
    }
    
    const rooms = await ListRooms();
        if (rooms.some(item => item.id == room.id)){
            fail(409, "Duplicate room", 'A room already exists with ID $(room.id).');
        }
        rooms.push(room);
        await writeJson(roomsfile, rooms);
        return room;
}

export async function deleteRoom(roomId) {
    const rooms = await listRooms();
    if (!rooms.some(room => room.id === roomId)) {
        fail(404, "Unknown room", 'No room exists with id $(roomId).');
    }
    await writeJson(roomsFile, rooms.filter(room => room.id !== roomId));
}