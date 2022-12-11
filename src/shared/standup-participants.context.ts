import { createContext } from "@builder.io/qwik";
import { Person } from "./standup-state.types";

/** keeps a map of each known standup, and the participants that are part of that standup. */
export const standupParticipantsContext =
  createContext<Record<string, Person[]>>("standup-state");
