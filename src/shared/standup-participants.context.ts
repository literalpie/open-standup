import { createContext } from "@builder.io/qwik";
import { StandupSeries } from "./types";

/** Context containing the state of the currently selected series */
export const seriesContext = createContext<StandupSeries>("series-state");
