export interface IUser {
  _id: number;
  isXpFrozen: boolean;
  isMuted: boolean;
  xp: number;
  level: number;
  birthday?: number[];
}
