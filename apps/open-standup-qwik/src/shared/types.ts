export interface Person {
  name: string;
  order: number;
  id: string;
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
  currentlyUpdating?: string;
  updates: { personId: string; done: boolean /** updateTime: number */ }[];
  allDone: boolean;
  seriesId: string;
  updateTime: Date;
}
