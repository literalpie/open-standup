export interface PersonState extends Person {
  done: boolean;
  updateTime?: number;
}

export interface Person {
  name: string;
  order: number;
  id: number;
}

export interface StandupState {
  /** May be undefined if standup is complete */
  orderPosition?: number;
  people: PersonState[];
  allDone: boolean;
  standupId: string;
}
