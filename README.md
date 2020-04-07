# TuneSync

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

## Top 5 Technical Challenges

1. playing synced music using WebSocket for a room of users
2. messaging system (WebSocket)
3. voting feature

- includes creating polls
- letting users vote on polls
- apply action in real-time once poll is finished

4. music metadata search
5. queueing music
