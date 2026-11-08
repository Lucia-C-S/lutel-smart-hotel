const page = document.body.dataset.page;
const message = document.getElementById('message');
const deviceUpdates = typeof BroadcastChannel === 'function'
  ? new BroadcastChannel('device-updates')
  : null;
let messageFadeTimeout;
let messageHideTimeout;

function hideMessage() {
  clearTimeout(messageFadeTimeout);
  clearTimeout(messageHideTimeout);
  message.hidden = true;
  message.classList.remove('is-fading');
}

function showMessage(text, isError = true) {
  hideMessage();
  message.replaceChildren(document.createTextNode(text));
  message.className = `fixed-notice ${isError ? 'error' : 'success'}`;
  message.setAttribute('role', isError ? 'alert' : 'status');
  message.hidden = false;

  if (isError) {
    const dismissButton = document.createElement('button');
    dismissButton.type = 'button';
    dismissButton.className = 'message-dismiss';
    dismissButton.textContent = 'Dismiss';
    dismissButton.setAttribute('aria-label', 'Dismiss notification');
    dismissButton.addEventListener('click', hideMessage);
    message.append(dismissButton);
  } else {
    messageFadeTimeout = setTimeout(() => {
      message.classList.add('is-fading');
      messageHideTimeout = setTimeout(hideMessage, 600);
    }, 3000);
  }
}

// Refreshing the page runs the listing request again.
document.getElementById('refresh').addEventListener('click', () => {
  window.location.reload();
});

if (page === 'rooms') {
  const roomList = document.getElementById('rooms-list');

  function renderRooms(rooms) {
    roomList.textContent = '';
    for (const room of rooms) {
      const item = document.createElement('li');
      item.textContent = `Room: ${room.id} - Floor: ${room.floor} - Type: ${room.type}`;
      roomList.append(item);
    }
    if (rooms.length === 0) roomList.innerHTML = '<li>No rooms yet.</li>';
  }

  async function loadRooms() {
    const response = await fetch('/api/rooms');
    const rooms = await response.json();
    if (!response.ok) throw new Error(rooms.error || 'Could not load rooms.');
    renderRooms(rooms);
  }

  try {
    await loadRooms();
  } catch (error) {
    roomList.innerHTML = '<li>Could not load rooms.</li>';
    showMessage(error.message);
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
      roomForm.reset();
      await loadRooms();
      showMessage('Room created.', false);
    } catch (error) {
      showMessage(error.message);
    } finally {
      button.disabled = false;
    }
  });
}

// DEVICES PAGE
if (page === 'devices') {
  const floorPlan = document.getElementById('floor-plan');
  const roomSelect = document.getElementById('room-id');
  const devicePanel = document.getElementById('device-panel');
  const selectedHeading = document.getElementById('selected-device-heading');
  const deviceActions = devicePanel.querySelector('.device-actions');
  const showDetailsButton = document.getElementById('show-device-details');
  const cancelDetailsButton = document.getElementById('cancel-device-details');
  const readingForm = document.getElementById('reading-form');
  const readingValue = document.getElementById('reading-value');
  const buttonState = document.getElementById('button-state');
  const readingValueLabel = document.getElementById('reading-value-label');
  const deviceDetails = document.getElementById('device-details');
  const deleteConfirmation = document.getElementById('delete-confirmation');
  const confirmDeleteButton = document.getElementById('confirm-delete-device');
  const cancelDeleteButton = document.getElementById('cancel-delete-device');
  let selectedDevice = null;
  let selectedDeviceButton = null;
  let returnToDetailsAfterReading = false;

  async function loadRoomsAndDevices() {
    const [roomsResponse, devicesResponse] = await Promise.all([
      fetch('/api/rooms'),
      fetch('/api/devices'),
    ]);
    const [rooms, devices] = await Promise.all([
      roomsResponse.json(),
      devicesResponse.json(),
    ]);
    if (!roomsResponse.ok) throw new Error(rooms.error || 'Could not load rooms.');
    if (!devicesResponse.ok) throw new Error(devices.error || 'Could not load devices.');

    floorPlan.textContent = '';
    roomSelect.replaceChildren(new Option('Select a room', ''));
    const roomsByFloor = new Map();
    for (const room of rooms) {
      const floorRooms = roomsByFloor.get(room.floor) ?? [];
      floorRooms.push(room);
      roomsByFloor.set(room.floor, floorRooms);
      roomSelect.add(new Option(`Room ${room.id} (Floor ${room.floor})`, room.id));
    }

    const floors = [...roomsByFloor.keys()].sort((a, b) => a - b);
    if (!floors.length) {
      floorPlan.textContent = 'No rooms yet. Create a room before assigning devices.';
      return;
    }

    for (const floor of floors) {
      const row = document.createElement('div');
      row.className = 'floor-row';
      const floorLabel = document.createElement('h3');
      floorLabel.className = 'floor-label';
      floorLabel.textContent = `Floor ${floor}`;
      const roomsGrid = document.createElement('div');
      roomsGrid.className = 'rooms-grid';

      const sortedRooms = roomsByFloor.get(floor).sort((a, b) =>
        String(a.id).localeCompare(String(b.id), undefined, { numeric: true }),
      );
      for (const room of sortedRooms) {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        const roomButton = document.createElement('button');
        roomButton.className = 'room-button';
        roomButton.type = 'button';
        roomButton.setAttribute('aria-haspopup', 'true');
        roomButton.setAttribute('aria-expanded', 'false');
        roomButton.textContent = `Room ${room.id}`;

        const deviceMenu = document.createElement('div');
        deviceMenu.className = 'room-device-menu';
        const menuHeading = document.createElement('strong');
        menuHeading.textContent = `Devices in room ${room.id}`;
        deviceMenu.append(menuHeading);
        const roomDevices = devices.filter((device) => String(device.roomId) === String(room.id));
        if (roomDevices.length) {
          for (const device of roomDevices) {
            const deviceItem = document.createElement('div');
            deviceItem.className = 'room-device-item';
            const deviceButton = document.createElement('button');
            deviceButton.type = 'button';
            deviceButton.className = 'room-device-button';
            deviceButton.setAttribute('aria-haspopup', 'true');
            deviceButton.setAttribute('aria-expanded', 'false');
            deviceButton.textContent = `${device.label} (${device.type})`;
            deviceButton.addEventListener('click', () => selectDevice(device, deviceButton));

            const actionsMenu = document.createElement('div');
            actionsMenu.className = 'device-hover-actions';
            actionsMenu.setAttribute('aria-label', `Actions for ${device.label}`);
            const actions = [
              ['Record reading', 'show-reading-form'],
              ['View details', 'show-device-details'],
              ['Delete device', 'delete-device'],
            ];
            for (const [label, actionId] of actions) {
              const actionButton = document.createElement('button');
              actionButton.type = 'button';
              actionButton.textContent = label;
              if (actionId === 'delete-device') actionButton.className = 'danger-button';
              actionButton.addEventListener('click', () => {
                deviceItem.classList.add('action-chosen');
                selectDevice(device, deviceButton);
                document.getElementById(actionId).click();
                deviceButton.focus();
              });
              actionsMenu.append(actionButton);
            }

            deviceItem.addEventListener('mouseenter', () => {
              deviceItem.classList.remove('action-chosen');
              deviceButton.setAttribute('aria-expanded', 'true');
            });
            deviceItem.addEventListener('mouseleave', () => {
              deviceItem.classList.remove('action-chosen');
              deviceButton.setAttribute('aria-expanded', 'false');
            });
            deviceItem.addEventListener('focusin', () => {
              deviceButton.setAttribute('aria-expanded', 'true');
            });
            deviceItem.addEventListener('focusout', (event) => {
              if (!deviceItem.contains(event.relatedTarget)) {
                deviceItem.classList.remove('action-chosen');
                deviceButton.setAttribute('aria-expanded', 'false');
              }
            });
            deviceItem.append(deviceButton, actionsMenu);
            deviceMenu.append(deviceItem);
          }
        } else {
          const emptyMessage = document.createElement('span');
          emptyMessage.textContent = 'No devices in this room.';
          deviceMenu.append(emptyMessage);
        }

        roomButton.addEventListener('click', () => {
          const isOpen = roomCard.classList.toggle('room-open');
          roomButton.setAttribute('aria-expanded', String(isOpen));
          for (const otherCard of roomsGrid.querySelectorAll('.room-card')) {
            if (otherCard !== roomCard) {
              otherCard.classList.remove('room-open');
              otherCard.querySelector('.room-button').setAttribute('aria-expanded', 'false');
            }
          }
        });
        roomCard.append(roomButton, deviceMenu);
        roomsGrid.append(roomCard);
      }

      row.append(floorLabel, roomsGrid);
      floorPlan.append(row);
    }
  }

  function selectDevice(device, triggerButton) {
    selectedDevice = device;
    selectedDeviceButton = triggerButton;
    devicePanel.hidden = false;
    selectedHeading.textContent = device.label;
    deviceActions.hidden = false;
    readingForm.hidden = true;
    deviceDetails.hidden = true;
    deviceDetails.textContent = '';
    showDetailsButton.hidden = false;
    deleteConfirmation.hidden = true;
    hideMessage();
  }

  cancelDetailsButton.addEventListener('click', () => {
    const triggerButton = selectedDeviceButton;
    triggerButton?.closest('.room-device-item')?.classList.remove('action-chosen');
    selectedDevice = null;
    selectedDeviceButton = null;
    devicePanel.hidden = true;
    deviceActions.hidden = true;
    readingForm.hidden = true;
    deviceDetails.hidden = true;
    deviceDetails.replaceChildren(cancelDetailsButton);
    returnToDetailsAfterReading = false;
    triggerButton?.focus();
  });

  try {
    await loadRoomsAndDevices();
  } catch (error) {
    floorPlan.textContent = 'Could not load rooms and devices.';
    showMessage(error.message);
  }

  document.getElementById('show-reading-form').addEventListener('click', () => {
    returnToDetailsAfterReading = !deviceDetails.hidden;
    const deviceType = selectedDevice?.type.trim().toLowerCase();
    const isButtonDevice = ['panic-button', 'panic button', 'alarm-button', 'alarm button']
      .includes(deviceType);
    readingValue.hidden = isButtonDevice;
    readingValue.required = !isButtonDevice;
    buttonState.hidden = !isButtonDevice;
    buttonState.required = isButtonDevice;
    readingValueLabel.hidden = isButtonDevice;
    readingValueLabel.textContent = isButtonDevice ? 'Button state' : 'Value';
    readingValueLabel.htmlFor = isButtonDevice ? 'button-state' : 'reading-value';
    if (isButtonDevice) buttonState.value = 'false';
    readingForm.hidden = false;
    deviceDetails.hidden = true;
    deviceActions.hidden = true;
    (isButtonDevice ? buttonState : readingValue).focus();
  });

  document.getElementById('cancel-reading').addEventListener('click', () => {
    readingForm.hidden = true;
    readingValue.hidden = false;
    readingValue.required = true;
    buttonState.hidden = true;
    buttonState.required = false;
    readingValueLabel.hidden = false;
    readingValueLabel.textContent = 'Value';
    readingValueLabel.htmlFor = 'reading-value';
    deviceDetails.hidden = !returnToDetailsAfterReading;
    deviceActions.hidden = false;
    showDetailsButton.hidden = returnToDetailsAfterReading;
  });

  document.getElementById('show-device-details').addEventListener('click', async () => {
    if (!selectedDevice) return;
    try {
      const [deviceResponse, readingsResponse] = await Promise.all([
        fetch(`/api/devices/${encodeURIComponent(selectedDevice.id)}`),
        fetch(`/api/devices/${encodeURIComponent(selectedDevice.id)}/readings`),
      ]);
      const [device, readings] = await Promise.all([
        deviceResponse.json(),
        readingsResponse.json(),
      ]);
      if (!deviceResponse.ok) throw new Error(device.error || 'Could not load device details.');
      if (!readingsResponse.ok) throw new Error(readings.error || 'Could not load readings.');

      deviceDetails.replaceChildren();
      const detailsHeading = document.createElement('h3');
      detailsHeading.textContent = 'Device information';
      const details = document.createElement('p');
      details.textContent = `ID: ${device.id} | Room: ${device.roomId} | Type: ${device.type} | Label: ${device.label}`;
      const readingsHeading = document.createElement('h3');
      readingsHeading.textContent = 'Readings';
      deviceDetails.append(detailsHeading, details, readingsHeading);
      if (readings.length) {
        const readingsList = document.createElement('ul');
        for (const reading of readings) {
          const item = document.createElement('li');
          item.textContent = `${reading.value} - ${new Date(reading.timestamp).toLocaleString()}`;
          readingsList.append(item);
        }
        deviceDetails.append(readingsList);
      } else {
        const emptyReadings = document.createElement('p');
        emptyReadings.textContent = 'No readings recorded.';
        deviceDetails.append(emptyReadings);
      }
      deviceDetails.append(cancelDetailsButton);
      readingForm.hidden = true;
      deviceDetails.hidden = false;
      deviceActions.hidden = false;
      showDetailsButton.hidden = true;
    } catch (error) {
      showMessage(error.message);
    }
  });

  document.getElementById('delete-device').addEventListener('click', () => {
    if (!selectedDevice) return;
    document.getElementById('delete-confirmation-message').textContent =
      `Delete "${selectedDevice.label}"? Its readings will also be deleted.`;
    deleteConfirmation.hidden = false;
    confirmDeleteButton.focus();
  });

  cancelDeleteButton.addEventListener('click', () => {
    deleteConfirmation.hidden = true;
    document.getElementById('delete-device').focus();
  });

  deleteConfirmation.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cancelDeleteButton.click();
  });

  confirmDeleteButton.addEventListener('click', async () => {
    if (!selectedDevice) return;
    confirmDeleteButton.disabled = true;
    try {
      const response = await fetch(`/api/devices/${encodeURIComponent(selectedDevice.id)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Could not delete device.');
      }
      const deletedDeviceId = selectedDevice.id;
      const deletedLabel = selectedDevice.label;
      selectedDevice = null;
      devicePanel.hidden = true;
      deleteConfirmation.hidden = true;
      showMessage(`${deletedLabel} was deleted.`, false);
      deviceUpdates?.postMessage({ type: 'device-deleted', deviceId: deletedDeviceId });
      await loadRoomsAndDevices();
    } catch (error) {
      showMessage(error.message);
    } finally {
      confirmDeleteButton.disabled = false;
    }
  });

  readingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedDevice) return;
    const button = readingForm.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const value = buttonState.hidden
        ? Number(readingValue.value)
        : (buttonState.value === 'true' ? 1 : 0);
      if (!Number.isFinite(value)) throw new Error('Reading value must be a finite number.');
      const response = await fetch(`/api/devices/${encodeURIComponent(selectedDevice.id)}/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          timestamp: new Date().toISOString(),
          value,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Could not record reading.');
      }
      readingForm.reset();
      showMessage('Reading recorded.', false);
    } catch (error) {
      showMessage(error.message);
    } finally {
      button.disabled = false;
    }
  });

  const deviceForm = document.getElementById('devices-form');
  deviceForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = deviceForm.querySelector('button');
    button.disabled = true;

    try {
      const id = document.getElementById('device-id').value.trim();
      const roomId = document.getElementById('room-id').value;
      const type = document.getElementById('device-type').value.trim();
      const label = document.getElementById('device-label').value.trim();
      if (!id || !type || !label) throw new Error('Please complete all fields.');
      if (!roomId) throw new Error('Please select a room.');

      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, roomId, type, label }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Could not create device.');
      }
      deviceForm.reset();
      await loadRoomsAndDevices();
      showMessage('Device created.', false);
    } catch (error) {
      showMessage(error.message);
    } finally {
      button.disabled = false;
    }
  });
}

// ALARMS PAGE
if (page === 'alarms') {
  const alarmsTableBody = document.getElementById('alarms-table-body');

  function appendCell(row, text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    row.append(cell);
    return cell;
  }

  async function loadAlarms() {
    const [alarmsResponse, devicesResponse, roomsResponse] = await Promise.all([
      fetch('/api/alarms'),
      fetch('/api/devices'),
      fetch('/api/rooms'),
    ]);
    const [alarms, devices, rooms] = await Promise.all([
      alarmsResponse.json(),
      devicesResponse.json(),
      roomsResponse.json(),
    ]);
    if (!alarmsResponse.ok) throw new Error(alarms.error || 'Could not load alarms.');
    if (!devicesResponse.ok) throw new Error(devices.error || 'Could not load devices.');
    if (!roomsResponse.ok) throw new Error(rooms.error || 'Could not load rooms.');

    const devicesById = new Map(devices.map((device) => [String(device.id), device]));
    const roomsById = new Map(rooms.map((room) => [String(room.id), room]));
    const activeDeviceAlarms = alarms.filter((alarm) =>
      devicesById.has(String(alarm.deviceId)),
    );
    alarmsTableBody.replaceChildren();

    if (!activeDeviceAlarms.length) {
      const row = document.createElement('tr');
      const cell = appendCell(row, 'No alarms yet. Readings over the configured threshold will appear here.');
      cell.colSpan = 6;
      alarmsTableBody.append(row);
      return;
    }

    for (const alarm of activeDeviceAlarms) {
      const row = document.createElement('tr');
      const status = appendCell(row, alarm.acknowledged ? 'Acknowledged' : 'Active');
      status.className = alarm.acknowledged ? 'alarm-acknowledged' : 'alarm-active';
      const alarmCell = appendCell(row, '');
      const alarmType = document.createElement('strong');
      alarmType.textContent = alarm.type || 'Alarm';
      alarmCell.append(alarmType);
      if (alarm.message) {
        const alarmDescription = document.createElement('p');
        alarmDescription.textContent = alarm.message;
        alarmCell.append(alarmDescription);
      }
      const device = devicesById.get(String(alarm.deviceId));
      appendCell(row, device ? `${device.label} (${device.id})` : String(alarm.deviceId));
      const room = device && roomsById.get(String(device.roomId));
      appendCell(
        row,
        room
          ? `Room ${room.id} - Floor ${room.floor} - ${room.type}`
          : (device ? String(device.roomId) : 'Unknown'),
      );
      const timestamp = Date.parse(alarm.timestamp);
      appendCell(
        row,
        Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString() : String(alarm.timestamp),
      );

      const actionCell = document.createElement('td');
      if (alarm.acknowledged) {
        actionCell.textContent = '—';
      } else {
        const acknowledgeButton = document.createElement('button');
        acknowledgeButton.type = 'button';
        acknowledgeButton.textContent = 'Acknowledge';
        acknowledgeButton.addEventListener('click', async () => {
          acknowledgeButton.disabled = true;
          try {
            const response = await fetch(
              `/api/alarms/${encodeURIComponent(alarm.alarmId)}/ack`,
              { method: 'POST' },
            );
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Could not acknowledge alarm.');
            }
            showMessage('Alarm acknowledged.', false);
            await loadAlarms();
          } catch (error) {
            showMessage(error.message);
            acknowledgeButton.disabled = false;
          }
        });
        actionCell.append(acknowledgeButton);
      }
      row.append(actionCell);
      alarmsTableBody.append(row);
    }
  }

  deviceUpdates?.addEventListener('message', (event) => {
    if (event.data?.type === 'device-deleted') {
      loadAlarms().catch((error) => showMessage(error.message));
    }
  });

  try {
    await loadAlarms();
  } catch (error) {
    alarmsTableBody.replaceChildren();
    const row = document.createElement('tr');
    const cell = appendCell(row, 'Could not load alarms.');
    cell.colSpan = 6;
    alarmsTableBody.append(row);
    showMessage(error.message);
  }
}

// ---- UX additions (all pages) ----

// Highlight the current page in the navigation bar.
document.querySelector(`nav a[href="${location.pathname}"]`)?.setAttribute('aria-current', 'page');

// Inline validation: show the browser's validation message under the field
// instead of a pop-up bubble, and clear it as soon as the user edits the field.
for (const form of document.forms) {
  form.addEventListener('invalid', event => {
    event.preventDefault(); // suppress the native bubble
    const field = event.target;
    if (!field.id) return;
    let hint = document.getElementById(`${field.id}-error`);
    if (!hint) {
      hint = document.createElement('small');
      hint.id = `${field.id}-error`;
      hint.className = 'field-error';
      field.after(hint);
    }
    hint.textContent = field.validationMessage;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', hint.id);
    // preventDefault also stops the automatic focus, so focus the first invalid field.
    if (field === form.querySelector(':invalid')) field.focus();
  }, true); // 'invalid' does not bubble, so listen in the capture phase

  for (const type of ['input', 'change']) {
    form.addEventListener(type, event => {
      event.target.removeAttribute('aria-invalid');
      document.getElementById(`${event.target.id}-error`)?.remove();
    });
  }
}

// Delete dialog: keep Tab inside the dialog and close it when the backdrop is clicked.
const deleteDialog = document.getElementById('delete-confirmation');
if (deleteDialog) {
  deleteDialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const buttons = [...deleteDialog.querySelectorAll('button')];
    const first = buttons[0];
    const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  deleteDialog.addEventListener('click', event => {
    if (event.target === deleteDialog) document.getElementById('cancel-delete-device').click();
  });
}
