import { createSelector } from '@ngrx/store';
import { selectUserId } from './auth/auth.selectors';
import { selectActiveRoom } from './dashboard/store/dashboard.selectors';

export const selectUserAndRoom = createSelector(
  selectUserId,
  selectActiveRoom,
  (userId, roomId) => ({ userId, roomId }),
);
