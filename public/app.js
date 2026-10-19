const page = document.body.dataset.page;
const message = document.getElementById('message');

// Refreshing the page runs the listing request again.
document.getElementById('refresh').addEventListener('click', () => {
  window.location.reload();
});

if (page === 'rooms') {
  const roomList = document.getElementById('rooms-list');

  try {
    const response = await fetch('/api/rooms');
    const rooms = await response.json();
    if (!response.ok) throw new Error(rooms.error || 'Could not load rooms.');

    roomList.textContent = '';
    for (const room of rooms) {
      const item = document.createElement('li');
      item.textContent = `Room: ${room.id} - Floor: ${room.floor} - Type: ${room.type}`;
      roomList.append(item);
    }
    if (rooms.length === 0) roomList.innerHTML = '<li>No rooms yet.</li>';
  } catch (error) {
    roomList.innerHTML = '<li>Could not load rooms.</li>';
    message.textContent = error.message;
    message.className = 'error';
    message.hidden = false;
  }

  const roomForm = document.getElementById('room-form');
  roomForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = roomForm.querySelector('button');
    button.disabled = true;

    try {
      const id = document.getElementById('room-id').value.trim();
      const floor = Number(document.getElementById('room-floor').value);
      const type = document.getElementById('room-type').value.trim();
      if (!id || !type) throw new Error('Please complete all fields.');
      if (!Number.isSafeInteger(floor)) throw new Error('Floor must be a whole number.');

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, floor, type }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Could not create room.');
      }
      // Reload to show the list saved by the server.
      window.location.reload();
    } catch (error) {
      message.textContent = error.message;
      message.className = 'error';
      message.hidden = false;
    } finally {
      button.disabled = false;
    }
  });
}

// DEVICES PAGE
if (page === 'devices') {
  const devicesList = document.getElementById('device-list');

  try {
    const response = await fetch('/api/devices');
    const devices = await response.json();
    if (!response.ok) throw new Error(devices.error || 'Could not load devices.');

    devicesList.textContent = '';
    for (const device of devices) {
      const item = document.createElement('li');
      item.textContent = `Device: ${device.id} - Room: ${device.roomId} - Type: ${device.type} - Label: ${device.label} `;
      devicesList.append(item);
    }
    if (devices.length === 0) devicesList.innerHTML = '<li>No devices yet.</li>';
  } catch (error) {
    devicesList.innerHTML = '<li>Could not load rooms.</li>';
    message.textContent = error.message;
    message.className = 'error';
    message.hidden = false;
  }
  //TODO
  const roomForm = document.getElementById('room-form');
  roomForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = roomForm.querySelector('button');
    button.disabled = true;

    try {
      const id = document.getElementById('room-id').value.trim();
      const floor = Number(document.getElementById('room-floor').value);
      const type = document.getElementById('room-type').value.trim();
      if (!id || !type) throw new Error('Please complete all fields.');
      if (!Number.isSafeInteger(floor)) throw new Error('Floor must be a whole number.');

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, floor, type }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Could not create room.');
      }
      // Reload to show the list saved by the server.
      window.location.reload();
    } catch (error) {
      message.textContent = error.message;
      message.className = 'error';
      message.hidden = false;
    } finally {
      button.disabled = false;
    }
  });
  
  
