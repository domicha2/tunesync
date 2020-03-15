export interface Song {
  id: number;
  name: string;
  length: number;
  // TODO: add other meta data about song
}

export enum UserChangeAction {
  Invite = 'I',
  Kick = 'K',
}

export enum EventType {
  ModifyQueue = 'MQ',
  Messaging = 'M',
  UserChange = 'U',
  Play = 'PL',
}

export enum Role {
  Admin = 'A',
  DJ = 'D',
  Regular = 'R',
}

export enum State {
  Accepted = 'A',
  Pending = 'P',
  Rejected = 'R',
}

export interface Room {
  id?: number;
  title: string;
  subtitle: string;
  role?: Role;
  creator?: number;
  state?: State;
}

export interface User {
  userId: number;
  name: string;
  role: Role;
  state: State;
  membershipId: number;
}

export interface ModifyQueueEvent {
  queue: Song[];
}

export interface PlayEvent {
  isPlaying: boolean;
}

export interface AppEvent {
  event_id: number;
  user_id: number;
  room_id: number;
  parent_event_id: number;
  event_type: EventType;
  args: ModifyQueueEvent | any;
  creation_time: string;
  username: string;
}

export interface Message {
  content: string;
  userId: number;
  roomId: number;
}
