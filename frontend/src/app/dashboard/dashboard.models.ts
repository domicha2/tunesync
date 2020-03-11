export interface Song {
  name: string;
  // TODO: add other meta data about song
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
  id: number;
  name: string;
  role: Role;
  // TODO: add more user fields
}

export type EventType = 'M';

export interface AppEvent {
  eventId: number;
  userId: number;
  roomId: number;
  parentEventId: number;
  eventType: EventType;
  args: string;
  creationTime: string;
}

export interface Message {
  content: string;
  userId: number;
  roomId: number;
}
