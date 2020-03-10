export interface Song {
  name: string;
  // TODO: add other meta data about song
}

export type Role = 'Admin' | 'DJ' | 'Regular';

export interface Room {
  id: number;
  name: string;
  role: Role;
}

export interface User {
  id: number;
  name: string;
  role: Role;
  // TODO: add more user fields
}

export interface Message {
  content: string;
  userId: number;
}
