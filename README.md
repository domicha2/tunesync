# TuneSync <https://www.tunesync.ecd.space/>

## Team Members

- Roshan Suntharan
- Jason Yuan
- Michael Do

## What is TuneSync?

### Frontend

- Music platform where users can enter a room (similar to Discord) to share music
- Music is synced and everyone hears the same audio within a room
- Rooms will be role-based consisting of Admins, DJs, and regular users
  - Admins
    - can do everything below
    - kick users
  - DJs
    - can do everything below
    - skip ahead/behind in the song
    - play/pause the song
    - add/remove song from queue
  - Regular User
    - create polls to do Admin/DJ actions
    - vote on polls
    - chat
- Voting feature that will allow users to collectively do privileged actions mentioned above
- Anyone can upload music to the server (different than queueing music)
- Music is stored for some amount of time, decided by the admin
- Contains a built-in messaging feature

### Web API

- bulk upload music
- get music metadata
- get list of uploaded songs
- delete music
- queue/dequeue songs
- any other privileged actions (play, pause, skip ahead/behind, kick user from room)
- get list of users in a room
- account creation
- send/receive messages (disconnected users can review a history of messages)

## Key Features for Beta Version

- queue music
- play synced music
- all admin actions but anyone can do it
- chat

## Additional Features for Final Version

- upload music
- implement user roles to restrict access to actions
- creating rooms
- voting feature

## Technology Used

### Frontend

- Angular 9
- RxJs (async event management)
- NgRx (state management)
- WebSocket

### Backend

- Django (backend server)
- Mutagen (handles music metadata tagging)
- PostgreSQL
- Redis

## Top 5 Technical Challenges

1. playing synced music using WebSocket for a room of users
2. messaging system (WebSocket)
3. voting feature

- includes creating polls
- letting users vote on polls
- apply action in real-time once poll is finished

4. music metadata search
5. queueing music

# Documentation

## POST Endpoints

1. Create a new user (for signup)
- Method: `POST`
- Url: `/users/`
- Request body (JSON object): `{"username": string, "password": string}`
- Response body (JSON object): `{'token': 'd43250ff938a9b909fff6109783759aa0047233e', 'user_id': 3}`
- Query example: `curl --location --request POST 'http://localhost:8000/users/' \
--header 'Content-Type: application/json' \
--data-raw '{
	"username": "Bob",
	"password": "Saget"
}'`

2. Retrieve authentication token for a user (for signin)
- Method: `POST`
- Url: `/users/auth/`
- Request body (JSON object): `{"username": string, "password": string}`
- Response body (JSON object): `{'token': 'd43250ff938a9b909fff6109783759aa0047233e', 'user_id': 3}`
- Query example: `curl --location --request POST 'http://localhost:8000/users/auth/' \
--header 'Content-Type: application/json' \
--data-raw '{
	"username": "Bob",
	"password": "Saget"
}'`

3. Create a room
- Method: `POST`
- Url: `/users/rooms/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={"subtitle": subtitle, "title": title} }` -- subtitle is optional
- Response body (JSON object): `{'id': 3,
 'title': 'Best Room',
 'subtitle': something random,
 'creator': 2,
 'members': [2],
 'system_user': None}`
- Query example: `curl --location --request POST 'http://localhost:8000/users/rooms/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token d43250ff938a9b909fff6109783759aa0047233e' \
--data-raw '{
	"subtitle": "something random",
	"title": "Best Room"
}'`

4. Create a tune
- Method: `POST`
- Url: `/tunes/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, files={'file': fobj} }` -- can upload multiple files at once
- Response body (JSON object): `[{'id': 6,
  'uploader': 2,
  'name': 'Drums Urban Percussion Intro 2 (Music For Video)',
  'artist': 'TunePocket.com Music Library',
  'album': 'TunePocket Unlimited Royalty Free Music Library',
  'mime': 'audio/mp3',
  'length': 23.412125}]`
- Query example: `curl --location --request POST 'http://localhost:8000/tunes/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token d43250ff938a9b909fff6109783759aa0047233e' \
--form 'file=@/D:/song1.mp3'`

5. Create a TuneSync Event
- Method: `POST`
- Url: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
  "room": 4,
	"event_type": "T",
	"args": {
    "play":{
      "timestamp":0.0,
      "is_playing": True,
      "queue_index": 0}
    }}
  }` -- can either be "play" or "modify_queue" action inside "args" (only one of the two)
- Response body (JSON object): `{'last_modify_queue': {'queue': [[1,
    23.412125,
    "['Drums Urban Percussion Intro 2 (Music For Video)']"]],
  'event_id': 45},
 'last_play': {'timestamp': 0.0,
  'is_playing': True,
  'queue_index': 0,
  'event_id': 50},
 'play_time': '2020-04-09T21:26:54.479062Z',
 'room_id': 4,
 'event_type': 'T'}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
  "room": 4,
  "event_type": "T",
  "args": {
  	"play": {
  		"timestamp":0.0,
  		"is_playing": true,
  		"queue_index": 0
  	}
  }
}'`

6. Create a Message Event
- Method: `POST`
- Url: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
	"room": 1,
	"event_type": "M",
	"args": {
		"content": "this is a message"
	}}
}`
- Response body (JSON object): `{'id': 9,
 'room': 1,
 'creation_time': '2020-03-16T12:40:21.851273Z',
 'event_type': 'M',
 'author': 2,
 'parent_event_id': None,
 'args': {'content': 'this is a message'},
 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
	"room": 1,
	"event_type": "M",
	"args": {
		"content": "this is a message"
	}
}'`

7. a) Create a User Change (Kick) Event
- Method: `POST`
- Url: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
	"room": 1,
	"event_type": "U",
	"args": {
		"type": "K",
    "user": kicked_user_id
	}}
}`
- Response body (JSON object): `{'id': 9,
 'room': 1,
 'creation_time': '2020-03-16T12:40:21.851273Z',
 'event_type': 'U',
 'author': 2,
 'parent_event_id': None,
 'args': {'type': 'K', 'user': 9},
 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
	"room": 1,
	"event_type": "U",
	"args": {
		"type": "K",
    "user": 9
	}
}'`

7. b) Create a User Change (Join) Event
- Method: `POST`
- Url: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
	"room": 1,
	"event_type": "U",
	"args": {
		"type": "J",
    "is_accepted": true/false
	}}
}`
- Response body (JSON object): `{'id': 9,
 'room': 1,
 'creation_time': '2020-03-16T12:40:21.851273Z',
 'event_type': 'U',
 'author': 2,
 'parent_event_id': None,
 'args': {'type': 'J', 'is_accepted': true},
 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
	"room": 1,
	"event_type": "U",
	"args": {
		"type": "J",
    "is_accepted": true
	}
}'`
7. c) Create a User Change (Leave) Event
- Method: `POST`
- Url: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
	"room": 1,
	"event_type": "U",
	"args": {
		"type": "L"
	}}
}`
- Response body (JSON object): `{'id': 9,
 'room': 1,
 'creation_time': '2020-03-16T12:40:21.851273Z',
 'event_type': 'U',
 'author': 2,
 'parent_event_id': None,
 'args': {'type': 'L'},
 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
	"room": 1,
	"event_type": "U",
	"args": {
		"type": "L"
	}
}'`

7. d) Create a User Change (Invite) Event
- Method: `POST`
- Url: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
	"room": 1,
	"event_type": "U",
	"args": {
		"type": "I",
    "users": [ids of users to invite]
	}}
}`
- Response body (JSON object): `{'id': 9,
 'room': 1,
 'creation_time': '2020-03-16T12:40:21.851273Z',
 'event_type': 'U',
 'author': 2,
 'parent_event_id': None,
 'args': {'type': 'I', 'users': [4, 6, 8]},
 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
	"room": 1,
	"event_type": "U",
	"args": {
		"type": "I",
    "users": [4, 6, 8]
	}
}'`

7. e) Create a User Change (Change Role) Event
- Method: `POST`
- Url: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
	"room": 1,
	"event_type": "U",
	"args": {
		"type": "C",
    "user": user_id,
    "role": new role to assign (admin-"A", dj="D", regular="R")
	}}
}`
- Response body (JSON object): `{'id': 9,
 'room': 1,
 'creation_time': '2020-03-16T12:40:21.851273Z',
 'event_type': 'U',
 'author': 2,
 'parent_event_id': None,
 'args': {'type': 'K', 'user': 9, 'role': 'A'},
 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
	"room": 1,
	"event_type": "U",
	"args": {
		"type": "C",
    "user": 9,
    "role": "A"
	}
}'`

8. a) Create a Poll (Play) Event
- Method: `POST`
- Url: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
	"room": 1,
	"event_type": "PO",
	"args": {
		"action": "PL",
		"timestamp": 11.5 (postion to start song at), 
		"queue_index": 1 (where to place in queue),
		"is_playing": true
	} }
}`
- Response body (JSON object): `{'poll_id': 16,
 'args': {'action': 'PL', 'timestamp': 11.5, 'queue_index': 1, 'is_playing': true},
 'vote_percentage': 0.0,
 'agrees': 0,
 'disagrees': 0,
 'is_active': True,
 'is_successful': False,
 'room_id': 3,
 'event_type': 'PO'}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
	"room": 1,
	"event_type": "PO",
	"args": {
		"action": "PL",
		"timestamp": 11.5,
		"queue_index": 1,
		"is_playing": true
	}
}'`

8. b) Create a Poll (Kick) Event
- Method: `POST`
- Url: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
	"room": 1,
	"event_type": "PO",
	"args": {
		"action": "U",
    "type": "K",
    "user": 2
	} }
}`
- Response body (JSON object): `{'poll_id': 16,
 'args': {'action': 'U', 'type': 'K', 'user': 2},
 'vote_percentage': 0.0,
 'agrees': 0,
 'disagrees': 0,
 'is_active': True,
 'is_successful': False,
 'room_id': 3,
 'event_type': 'PO'}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
	"room": 1,
	"event_type": "PO",
	"args": {
		"action": "U",
    "type": "K",
    "user": 2
	}
}'`


8. c) Create a Poll (Modify Queue) Event -- check this one over, might be wrong (i think request body should include the tune somehow?)
- Method: `POST`
- Url: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
  "room":1, 
  "event_type": "PO",
  "args": {
      "action": "MQ",
      "queue": [1] (place in queue)
  } }  
}`
- Response body (JSON object): `{'poll_id': 16,
 'args': {'song': 1, 'action': 'MQ', 'song_name': 'Ace Attorney ~ Prologue'},
 'vote_percentage': 0.0,
 'agrees': 0,
 'disagrees': 0,
 'is_active': True,
 'is_successful': False,
 'room_id': 3,
 'event_type': 'PO'}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
  "room":1, 
  "event_type": "PO",
  "args": {
    "action": "MQ",
    "queue": [1]
  }
}'`

9. Create a Vote Event
- Method: `POST`
- Url: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
  "room":1, 
  "event_type": "V",
  "parent_event": 16 (id of the poll event you're voting on),
  "args": {
      "agree": true
  } }  
}`
- Response body (JSON object): `{'poll_id': 16,
 'args': {'agree': true},
 'vote_percentage': 1.0,
 'agrees': 1,
 'disagrees': 0,
 'is_active': True,
 'is_successful': False,
 'room_id': 3,
 'event_type': 'V'}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
  "room":1, 
  "event_type": "V",
  "args": {
    "agree": true
  }
}'`

## GET Endpoints
1. Return all the rooms a User is in
- Method: `GET`
- Url: `/users/:id/rooms/`

2. 
- Method: `GET`
- Url: `/rooms/:room_id/TuneSync/`
- Response:
the same as a tunesync response for an event

3. 
- Method: `GET`
- Url: `/rooms/:room_id/events/`
- Response:
see paginated response and standard event response combined. does not print PO/VO/T responses. use seperate endpoint

4. 
- Method: `GET`
- Url: `/rooms/:room_id/polls/`
- Response
see paginated response and poll event response. This returns a status of all active polls.

When querying a set of data responses will typically be paginated with a response similar to this:

{'count': 1,
 'next': None,
 'previous': None,
 'results': [{'id': 2, 'username': 'goku'}]}

 count is number of files. enxt is url for the next page. results is the array of results of rthe page they requested

5. 
- Method: `GET`
- Url: `/users/?page=1&username__icontainss=o/`

above is an example query you can make with the users end point and below is the response

 {'count': 1,
 'next': None,
 'previous': None,
 'results': [{'id': 2, 'username': 'goku'}]}

 If you put invalid query params it will return the entire set. Please read my filters.py file to see what params you can users.
 seperate attribute from operator with "__". reach out to me if you need more examples. This kind of syntax will be true for all get methosd
 that return a list. also review the filters.py file to see their available operators

 example results:

6. 
- Method: `GET`
- Url: `/tunes/?name__icontains=urban`

RESPONSE:
 {'count': 1,
 'next': None,
 'previous': None,
 'results': [{'id': 6,
   'uploader': 2,
   'name': 'Drums Urban Percussion Intro 2 (Music For Video)',
   'artist': 'TunePocket.com Music Library',
   'album': 'TunePocket Unlimited Royalty Free Music Library',
   'mime': 'audio/mp3',
   'length': 23.412125}]}

## PATCH Endpoints
1. Update metadata/info about an existing Tune
- Method: `PATCH`
- Url: `/tunes/:id/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={
  "tune_name": str, 
  "tune_artist": str,
  "tune_album": str
  }
}` (can have any combination of these params, even none)
- Response body (JSON object): `[{'id': 6,
  'uploader': 2,
  'name': 'Drums Urban Percussion Intro 2 (Music For Video)',
  'artist': 'TunePocket.com Music Library',
  'album': 'TunePocket Unlimited Royalty Free Music Library',
  'mime': 'audio/mp3',
  'length': 23.412125}]` (name, artist, album fields will be shown updated as wanted)
- Query example: `curl --location --request PATCH 'http://localhost:8000/tunes/6/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \
--data-raw '{
  "tune_name": "Swoogity",
  "tune_artist": "Swooty"
}'`

## DELETE Endpoints

1. Delete an existing Event
- Method: `DELETE`
- Url: `/events/:id/`
- Request body (JSON object): `None`
- Response body (JSON object): `{'id': 9,
 'room': 1,
 'creation_time': '2020-03-16T12:40:21.851273Z',
 'event_type': 'M',
 'author': 2,
 'parent_event_id': None,
 'args': {'content': 'this is a message'},
 'isDeleted': True}` (just an example event - only the isDeleted field changes to True)
- Query example: `curl --location --request DELETE 'http://localhost:8000/events/1/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42'`
