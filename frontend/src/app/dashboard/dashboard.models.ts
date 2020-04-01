export const SYSTEM_USER_ID = 1;

export interface Song {
  id: number;
  name: string;
  length: number;
  // TODO: add other meta data about song
}

export interface Filters {
  name?: string;
  album?: string;
  artist?: string;
}

export enum UserChangeAction {
  Invite = 'I',
  Kick = 'K',
  RoleChange = 'C',
}

export enum PollType {
  Kick = 'U',
  AddToQueue = 'MQ',
}

export enum EventType {
  ModifyQueue = 'MQ',
  Messaging = 'M',
  UserChange = 'U',
  Play = 'PL',
  TuneSync = 'T',
  CreatePoll = 'PO',
  Vote = 'V',
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

export interface InviteEvent {
  type: 'I';
  room_id: number;
  room_name: string;
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

export interface TuneSyncEvent {
  last_modify_queue: QueueState | null;
  last_play: PlayState | null;
  play_time: string;
  room: number;
}

export interface PlayState {
  event_id: number;
  queue_index: number;
  is_playing: boolean;
  timestamp: number;
}

export interface QueueState {
  event_id: number;
  // [song id, length, name]
  queue: [number, number, string][];
}
