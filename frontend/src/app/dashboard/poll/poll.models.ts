import { UserChangeAction, EventType } from '../dashboard.models';

export enum PollType {
  Kick = 'U',
  AddToQueue = 'MQ',
}

export interface KickPollArgs {
  action: PollType.Kick;
  user: number;
  type: UserChangeAction.Kick;
}

export interface AddToQueueArgs {
  action: PollType.AddToQueue;
  song: number;
}

export interface Poll {
  poll_id: number;
  args: KickPollArgs | AddToQueueArgs;
  vote_percentage: number;
  agrees: number;
  disagrees: number;
  is_active: boolean;
  is_successful: number;
  room_id: number;
  event_type: EventType.CreatePoll;
}

export interface PollState {
  [pollId: number]: Poll;
}
