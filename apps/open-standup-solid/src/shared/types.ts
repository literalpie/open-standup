import { Database } from "./db-types";

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
  /** if the currentlyUpdating value is based on an optimistic update */
  currentOptimistic: boolean;
  updates: {
    personId: string;
    done: boolean;
    optimistic?: boolean /** updateTime: number */;
  }[];
  allDone: boolean;
  seriesId: string;
  updateTime: Date;
}

export type StandupUpdate = Database["public"]["Tables"]["updates"]["Row"] & {
  optimistic?: boolean;
};
