# P2 - Monolithic smart-hotel application

Student: Lucía Castrillo Sánchez  
GitHub username: Lucia-C-S

## Goal

Build a small smart-hotel web application with a Node.js and Express backend, a plain browser frontend, a JSON API, and JSON-file persistence.

## Required API

- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/rooms/:roomId`
- `GET /api/devices`
- `POST /api/devices`
- `GET /api/devices/:deviceId`
- `DELETE /api/devices/:deviceId`
- `GET /api/devices/:deviceId/readings`
- `POST /api/devices/:deviceId/readings`
- `GET /api/alarms`
- `POST /api/alarms/:alarmId/ack`

## Required frontend actions

- List and create rooms.
- Browse devices by room and floor, view device details, create devices, and delete individual devices.
- Submit telemetry readings.
- List alarms.
- Acknowledge alarms.

## Run

```bash
npm install
npm start
```


Then I can run with 2 options: 
```bash
- node server.js
- npm start (the real one, the og, the other is the translation defined in package.json)
```

It loos like:

PS C:\Users\lucia\sint\sint-p2-lucia-c-s-main> node server.js

P2 smart-hotel app running at http://localhost:3000/

## DOCUMENTATION
Document the port, alarm thresholds, endpoints, and assumptions here.

## Port

3000

## Alarm thresholds

- Temperature sensor: 26 °C or higher.
- Humidity: 75% or higher.
- CO₂: 1,000 ppm or higher.
- Noise: 65 dB(A) or higher.
- Panic button and alarm button: a reading of `1` triggers an alarm when the corresponding button is active.

## Assumptions

TODO
