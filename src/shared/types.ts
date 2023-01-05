export interface PersonState extends Person {
  done: boolean;
}

export interface Person {
  name: string;
  order: number;
  id: number;
}

/** A series of standups. Multiple StandupMeetings can be associated with a single series. */
export interface StandupSeries {
  id: string;
  title: string;
  randomizeOnStart: boolean;
  people: Person[];
}

/** The state of an in-progress standup */
export interface StandupMeeting {
  /** The ID of the person currently updating. May be undefined if standup is complete */
  currentlyUpdating?: number;
  // people: PersonState[];
  // instead of people, StandupMeeting will have updates
  updates: { personId?: number; done: boolean }[];
  allDone: boolean;
  seriesId: string;
}
