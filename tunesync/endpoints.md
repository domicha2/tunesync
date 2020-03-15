# TuneSync REST API Documentation

## Rooms API

### Read
- description: get rooms with user permissions/status
- request: `GET /users/:id/rooms/`
- response: 200
	- body: list of objects
		- id: room id
		- title: room title
		- subtitle: room subtitle
		- role: either 'A', 'D', 'R' (admin, dj, regular)
		- state: the status of the user in the room either 'A', 'P', 'R' (accept, pending, reject)

### Create
- description: create a room
- request: `POST /rooms/`
	- content-type: `application/json`
	- body: object
		- title: room title
		- subtitle: room subtitle
- response: 200
	- body: room id

### Delete
- description: delete a room and the memberships attached to it
- request: `DELETE /rooms/:id/`
- response: 200
 - body: room id

