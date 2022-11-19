export interface PersonState {
  name: string;
  order: number;
  done: boolean;
  updateTime?: number;
}

export interface StandupState {
  /** May be undefined if standup is complete */
  orderPosition?: number;
  people: PersonState[];
  allDone: boolean;
}
