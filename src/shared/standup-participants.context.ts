import { createContextId } from "@builder.io/qwik";
import { StandupSeries } from "./types";

/** Context containing the state of the currently selected series */
export const seriesContext = createContextId<StandupSeries>("series-state");
