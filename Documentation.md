# Documentation

# URL:

https://api.tunesync.ecd.space

## WebSockets `wss://api.tunesync.ecd.space/events/`

- WebSockets power all realtime interactions between users such as controlling music, sending messages, and the poll feature.
- The communication of our web sockets are one-directional (server to client).
- Below are example payloads from the web socket.

1. Events - JSON object

- `{"room_id": number, "event_id": number, "event_type": EventType, "user_id": number, "parent_event_id": number, "creation_time": Date, "args": any, "username": string}`
- `EventType = 'MQ' | 'M' | 'U' | 'PL' | 'T' | 'PO' | 'V'`

2. TuneSync - JSON object

- `{last_modify_queue: QueueState | null; last_play: PlayState | null; play_time: string; room_id: number; event_type: 'T';}`
- `QueueState = { event_id: number; // [song id, length, name] queue: [number, number, string][]; }`
- `PlayState = { event_id: number; queue_index: number; is_playing: boolean; timestamp: number; }`

3. Poll - JSON object

- `{ poll_id: number; args: KickPollArgs | AddToQueueArgs; vote_percentage: number; agrees: number; disagrees: number; is_active: boolean; is_successful: boolean; room_id: number; event_type: 'PO'; }`
- `KickPollArgs = { action: PollType.Kick; user: number; username: string; type: UserChangeAction.Kick; }`
- `AddToQueueArgs = { action: PollType.AddToQueue; song: number; song_name: string; }`

## POST Endpoints

1. Create a new user (for signup)

- Method: `POST`
- URL: `/users/`
- Request body (JSON object): `{"username": string, "password": string}`
- Response body (JSON object): `{'token': 'd43250ff938a9b909fff6109783759aa0047233e', 'user_id': 3}`
- Query example: `curl --location --request POST 'http://localhost:8000/users/' \ --header 'Content-Type: application/json' \ --data-raw '{ "username": "Bob", "password": "Saget" }'`
- Response Status Codes:
  - 200: User successfully created
  - 400: Username already exists

2. Retrieve authentication token for a user (for signin)

- Method: `POST`
- URL: `/users/auth/`
- Request body (JSON object): `{"username": string, "password": string}`
- Response body (JSON object): `{'token': 'd43250ff938a9b909fff6109783759aa0047233e', 'user_id': 3}`
- Query example: `curl --location --request POST 'http://localhost:8000/users/auth/' \ --header 'Content-Type: application/json' \ --data-raw '{ "username": "Bob", "password": "Saget" }'`
- Response Status Codes:

  - 200: User successfully authenticated and logged in
  - 401: Invalid credentials, i.e. wrong password for given username

3. Create a room

- Method: `POST`
- URL: `/users/rooms/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={"subtitle": subtitle, "title": title} }` -- subtitle is optional
- Response body (JSON object): `{'id': 3, 'title': 'Best Room', 'subtitle': something random, 'creator': 2, 'members': [2], 'system_user': None}`
- Query example: `curl --location --request POST 'http://localhost:8000/users/rooms/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token d43250ff938a9b909fff6109783759aa0047233e' \ --data-raw '{ "subtitle": "something random", "title": "Best Room" }'`
- Response Status Codes:
  - 200: Room successfully created
  - 400: Title is empty, or Title is 'Personal Room'

4. Upload song files

- Method: `POST`
- URL: `/tunes/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, files={'file': fobj} }` -- can upload multiple files at once
- Response body (JSON object): `[{'id': 6, 'uploader': 2, 'name': 'Drums Urban Percussion Intro 2 (Music For Video)', 'artist': 'TunePocket.com Music Library', 'album': 'TunePocket Unlimited Royalty Free Music Library', 'mime': 'audio/mp3', 'length': 23.412125}]`
- Query example: `curl --location --request POST 'http://localhost:8000/tunes/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token d43250ff938a9b909fff6109783759aa0047233e' \ --form 'file=@/D:/song1.mp3'`
- Response Status Codes:
  - 200: Tune successfully added to database
  - 400: Given file is not a valid audio file

5. Create a TuneSync Event

- Method: `POST`
- URL: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "room": 4, "event_type": "T", "args": { "play":{ "timestamp":0.0, "is_playing": True, "queue_index": 0} }} }` -- can either be "play" or "modify_queue" action inside "args" (only one of the two)
- Response body (JSON object): `{'last_modify_queue': {'queue': [[1, 23.412125, "['Drums Urban Percussion Intro 2 (Music For Video)']"]], 'event_id': 45}, 'last_play': {'timestamp': 0.0, 'is_playing': True, 'queue_index': 0, 'event_id': 50}, 'play_time': '2020-04-09T21:26:54.479062Z', 'room_id': 4, 'event_type': 'T'}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "room": 4, "event_type": "T", "args": { "play": { "timestamp":0.0, "is_playing": true, "queue_index": 0 } } }'`
- Response Status Codes:
  - 200: Event successfully created in given room
  - 400:
    - Given room does not exist or provided parent event is invalid
    - OR Given song file/details do not exist

6. Create a Message Event

- Method: `POST`
- URL: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "room": 1, "event_type": "M", "args": { "content": "this is a message" }} }`
- Response body (JSON object): `{'id': 9, 'room': 1, 'creation_time': '2020-03-16T12:40:21.851273Z', 'event_type': 'M', 'author': 2, 'parent_event_id': None, 'args': {'content': 'this is a message'}, 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "room": 1, "event_type": "M", "args": { "content": "this is a message" } }'`
- Response Status Codes:
  - 200: Event successfully created in given room
  - 400:
    - Given room does not exist or provided parent event is invalid
    - OR Incorrect content provided in args

7. a) Create a User Change (Kick) Event

- Method: `POST`
- URL: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "room": 1, "event_type": "U", "args": { "type": "K", "user": kicked_user_id }} }`
- Response body (JSON object): `{'id': 9, 'room': 1, 'creation_time': '2020-03-16T12:40:21.851273Z', 'event_type': 'U', 'author': 2, 'parent_event_id': None, 'args': {'type': 'K', 'user': 9}, 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "room": 1, "event_type": "U", "args": { "type": "K", "user": 9 } }'`
- Response Status Codes:
  - 200: Event successfully created in given room
  - 400:
    - Given room does not exist or provided parent event is invalid
    - OR User to kick not provided (bad args)
    - OR User to kick is not in the room

7. b) Create a User Change (Join) Event

- Method: `POST`
- URL: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "room": 1, "event_type": "U", "args": { "type": "J", "is_accepted": true/false }} }`
- Response body (JSON object): `{'id': 9, 'room': 1, 'creation_time': '2020-03-16T12:40:21.851273Z', 'event_type': 'U', 'author': 2, 'parent_event_id': None, 'args': {'type': 'J', 'is_accepted': true}, 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "room": 1, "event_type": "U", "args": { "type": "J", "is_accepted": true } }'`
- Response Status Codes:
  - 200: Event successfully created in given room
  - 400:
    - Given room does not exist or provided parent event is invalid
    - OR Choice to join not provided (bad args)

7. c) Create a User Change (Leave) Event

- Method: `POST`
- URL: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "room": 1, "event_type": "U", "args": { "type": "L" }} }`
- Response body (JSON object): `{'id': 9, 'room': 1, 'creation_time': '2020-03-16T12:40:21.851273Z', 'event_type': 'U', 'author': 2, 'parent_event_id': None, 'args': {'type': 'L'}, 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "room": 1, "event_type": "U", "args": { "type": "L" } }'`
- Response Status Codes:
  - 200: Event successfully created in given room
  - 400: Given room does not exist or provided parent event is invalid

7. d) Create a User Change (Invite) Event

- Method: `POST`
- URL: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "room": 1, "event_type": "U", "args": { "type": "I", "users": [ids of users to invite] }} }`
- Response body (JSON object): `{'id': 9, 'room': 1, 'creation_time': '2020-03-16T12:40:21.851273Z', 'event_type': 'U', 'author': 2, 'parent_event_id': None, 'args': {'type': 'I', 'users': [4, 6, 8]}, 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "room": 1, "event_type": "U", "args": { "type": "I", "users": [4, 6, 8] } }'`
- Response Status Codes:
  - 200: Event successfully created in given room
  - 400:
    - Given room does not exist or provided parent event is invalid
    - OR Users to invite not provided (bad args)
    - OR User does not exist
    - OR User has already been invited

7. e) Create a User Change (Change Role) Event

- Method: `POST`
- URL: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "room": 1, "event_type": "U", "args": { "type": "C", "user": user_id, "role": new role to assign (admin-"A", dj="D", regular="R") }} }`
- Response body (JSON object): `{'id': 9, 'room': 1, 'creation_time': '2020-03-16T12:40:21.851273Z', 'event_type': 'U', 'author': 2, 'parent_event_id': None, 'args': {'type': 'K', 'user': 9, 'role': 'A'}, 'isDeleted': False}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "room": 1, "event_type": "U", "args": { "type": "C", "user": 9, "role": "A" } }'`
- Response Status Codes:
  - 200: Event successfully created in given room
  - 400:
    - Given room does not exist or provided parent event is invalid
    - OR Missing one or more of "type", "user", "role" fields in request (bad args)
    - OR User to change role for is not in the room

8. a) Create a Poll (Play) Event

- Method: `POST`
- URL: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "room": 1, "event_type": "PO", "args": { "action": "PL", "timestamp": 11.5 (postion to start song at), "queue_index": 1 (where to place in queue), "is_playing": true } } }`
- Response body (JSON object): `{'poll_id': 16, 'args': {'action': 'PL', 'timestamp': 11.5, 'queue_index': 1, 'is_playing': true}, 'vote_percentage': 0.0, 'agrees': 0, 'disagrees': 0, 'is_active': True, 'is_successful': False, 'room_id': 3, 'event_type': 'PO'}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "room": 1, "event_type": "PO", "args": { "action": "PL", "timestamp": 11.5, "queue_index": 1, "is_playing": true } }'`
- Response Status Codes:
  - 200: Poll successfully created in given room
  - 400:
    - Given room does not exist or provided parent event is invalid
    - OR Missing one or more of "queue_index", "is_playing", "timestamp" fields in request (bad args)
    - OR Given arguments have wrong type
    - OR Invalid song index for queue
    - OR There are no songs in the queue to play

8. b) Create a Poll (Kick) Event

- Method: `POST`
- URL: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "room": 1, "event_type": "PO", "args": { "action": "U", "type": "K", "user": 2 } } }`
- Response body (JSON object): `{'poll_id': 16, 'args': {'action': 'U', 'type': 'K', 'user': 2}, 'vote_percentage': 0.0, 'agrees': 0, 'disagrees': 0, 'is_active': True, 'is_successful': False, 'room_id': 3, 'event_type': 'PO'}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "room": 1, "event_type": "PO", "args": { "action": "U", "type": "K", "user": 2 } }'`
- Response Status Codes:
  - 200: Poll successfully created in given room
  - 400:
    - Given room does not exist or provided parent event is invalid
    - OR User to kick not provided (bad args)
    - OR User to kick is not in the room

8. c) Create a Poll (Modify Queue) Event -- check this one over, might be wrong (i think request body should include the tune somehow?)

- Method: `POST`
- URL: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "room":1, "event_type": "PO", "args": { "action": "MQ", "queue": [1] (place in queue) } } }`
- Response body (JSON object): `{'poll_id': 16, 'args': {'song': 1, 'action': 'MQ', 'song_name': 'Ace Attorney ~ Prologue'}, 'vote_percentage': 0.0, 'agrees': 0, 'disagrees': 0, 'is_active': True, 'is_successful': False, 'room_id': 3, 'event_type': 'PO'}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "room":1, "event_type": "PO", "args": { "action": "MQ", "queue": [1] } }'`
- Response Status Codes:
  - 200: Poll successfully created in given room
  - 400:
    - Given room does not exist or provided parent event is invalid
    - OR Given song id is not valid
    - OR Invalid song index for queue
    - OR There are no songs in the queue to play

9. Create a Vote Event

- Method: `POST`
- URL: `/events/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "room":1, "event_type": "V", "parent_event": 16 (id of the poll event you're voting on), "args": { "agree": true } } }`
- Response body (JSON object): `{'poll_id': 16, 'args': {'agree': true}, 'vote_percentage': 1.0, 'agrees': 1, 'disagrees': 0, 'is_active': True, 'is_successful': False, 'room_id': 3, 'event_type': 'V'}`
- Query example: `curl --location --request POST 'http://localhost:8000/events/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "room":1, "event_type": "V", "args": { "agree": true } }'`
- Response Status Codes:
  - 200: Vote successfully added to given poll
  - 400:
    - Given poll does not exist or provided parent event is invalid
    - OR Vote is not given (bad args)
    - OR Vote has completed, can't modify anymore

## GET Endpoints

1. Get all the rooms a user is in

- Method: `GET`
- URL: `/users/:id/rooms/`
- Response: list of JSON obj (200)
  - `{"role": "A" | "D" | "R", "state": "A" | "P" | "R", title: string, subtitle: string; id: number}`
- curl example: `curl --location --request GET 'https://api.tunesync.ecd.space/users/3/rooms/' \ --header 'Authorization: Token token'`

2. Get the latest `TuneSync` object within a room
- `TuneSync` object holds data about the latest song play state and queue state

- Method: `GET`
- URL: `/rooms/:room_id/tunesync/`
- Response:
  the same as a tunesync response for an event
- curl example: `curl --location --request GET 'https://api.tunesync.ecd.space/rooms/3/tunesync/' \ --header 'Authorization: Token token'`

3. Get all active polls in the given room

- Method: `GET`
- URL: `/rooms/:room_id/polls/`
- Response
  see paginated response and poll event response. This returns a status of all active polls.
- curl example: `curl --location --request GET 'https://api.tunesync.ecd.space/rooms/3/polls/' \ --header 'Authorization: Token token'`

When querying a set of data responses will typically be paginated with a response similar to this:

{'count': 1,
'next': None,
'previous': None,
'results': [{'id': 2, 'username': 'goku'}]}

count is the number of results. next and previous is the URL for the previous/next page. results are the array of results of the page they requested

4. Get all users filtered by query parameters

- Method: `GET`
- URL: `/users/?page=1&username__icontains=o`
- curl example: `curl --location --request GET 'https://api.tunesync.ecd.space/users/?page=1`&username\_\_icontains=o' \
  --header 'Authorization: Token token'`

above is an example query you can make with the users endpoint and below is the response. The query params can get very complicated. They look very similar to SQL queries and can be changed with "&". A lot of our endpoints will follow this same syntax. If you put invalid query params it will return the entire set (paginated).

The basic syntax is "field\_\_operator=value" below are some more examples. The equal operator is never explicit. If you want to use the exact field this is the syntax: "field=value"

`/users/?username__iexact=goku`
`/users/?username=goku&page=2`

These are the valid fields with the valid operators:
username: ["icontains", "exact"]
page: exact

example results:

{'count': 1,
'next': None,
'previous': None,
'results': [{'id': 2, 'username': 'goku'}]}

count: number of results returned
next: url for next page
previous: url for previous page
results: array of results for the page queried

5. Get all songs filtered by query parameters

- Method: `GET`
- URL: `/tunes/?name__icontains=urban`
- curl example: `curl --location --request GET 'https://api.tunesync.ecd.space/tunes/?name__icontains=urban' \ --header 'Authorization: Token token'`

This follows the same syntax above with more operators.

album: ["icontains", "contains", "exact", "iexact"],
artist: ["icontains", "contains", "exact", "iexact"],
name: ["icontains", "contains", "exact", "iexact"],
length: ["gt", "gte", "lt", "lte", "exact"],

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

6. Get all events from a room

- Method: `GET`
- URL: `/rooms/:room_id/events/`
- Response:
  see paginated response and standard event response combined. does not print PO/VO/T responses. use separate endpoint

  this end point also allows you to filter with query params.
  creation_time: ["lt"]
  event_type: ["exact"]}

- curl example: `curl --location --request GET 'https://api.tunesync.ecd.space/rooms/1/events/' \ --header 'Authorization: Token token'`

## PATCH Endpoints

1. Update metadata/info about an existing Tune

- Method: `PATCH`
- URL: `/tunes/:id/`
- Request body (JSON object): `{ headers={"Authorization": "Token " + token}, data={ "tune_name": str, "tune_artist": str, "tune_album": str } }` (can have any combination of these params, even none)
- Response body (JSON object): `[{'id': 6, 'uploader': 2, 'name': 'Drums Urban Percussion Intro 2 (Music For Video)', 'artist': 'TunePocket.com Music Library', 'album': 'TunePocket Unlimited Royalty Free Music Library', 'mime': 'audio/mp3', 'length': 23.412125}]` (name, artist, album fields will be shown updated as wanted)
- Query example: `curl --location --request PATCH 'http://localhost:8000/tunes/6/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42' \ --data-raw '{ "tune_name": "Swoogity", "tune_artist": "Swooty" }'`
- Response Status Codes:
  - 200: Poll successfully created in given room
  - 400: Given tune id doesn't exist in the database

## DELETE Endpoints

1. Delete an existing Event

- Method: `DELETE`
- URL: `/events/:id/`
- Request body (JSON object): `None`
- Response body (JSON object): `{'id': 9, 'room': 1, 'creation_time': '2020-03-16T12:40:21.851273Z', 'event_type': 'M', 'author': 2, 'parent_event_id': None, 'args': {'content': 'this is a message'}, 'isDeleted': True}` (just an example event - only the isDeleted field changes to True)
- Query example: `curl --location --request DELETE 'http://localhost:8000/events/1/' \ --header 'Content-Type: application/json' \ --header 'Authorization: Token fee1c2377bc8fb26cbee1fa4c2786aaa989b2a42'`
- Response Status Codes:
  - 200: Poll successfully created in given room
  - 400: Invalid event id
