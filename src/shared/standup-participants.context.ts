import { createContext, QRL, useStore } from "@builder.io/qwik";
import { Person, StandupSeries } from "./types";

/** keeps a map of each known standup series. */
export const standupSeriesContext = createContext<Record<string, Person[]>>(
  "standup-series-state"
);

// standup series data will be stored in a separate yjs store.
// in the future, recent series will be in a simple local storage.

// interface SeriesContext {
//   getSeries: QRL<(id: number) => StandupSeries>;
//   setSeries: QRL<(id: number, series: StandupSeries) => void>;
// }

// Take ID as parameter. Use that to join standup series with that ID.
export const StandupSeriesProvider = ({ id }: { id: string }) => {
  const seriesState = useStore({});
};
