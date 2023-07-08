import {
  noSerialize,
  useVisibleTask$,
  useContextProvider,
  useSignal,
  useStore,
  useTask$,
} from "@builder.io/qwik";
import { syncedStore, getYjsDoc, observeDeep } from "@syncedstore/core";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import { Person, StandupSeries } from "~/shared/types";
import { seriesContext } from "~/shared/standup-participants.context";

/**
 * The parts of the series state that are synced,
 * not including the people array because that can't be synced as part of an object.
 */
type PartialSeriesState = Partial<{
  id: string;
  title: string;
  randomizeOnStart: boolean;
}>;

type SyncedSeriesStore = {
  seriesState: PartialSeriesState;
  people: Person[];
};

export const makeSeriesRoomName = (id: string) => {
  return `com.literalpie.open-standup.series.${id}`;
};

export const connectToSeriesStore = ({ seriesId }: { seriesId: string }) => {
  const store = syncedStore<{
    seriesState: PartialSeriesState;
    people: Person[];
  }>({
    seriesState: {} as PartialSeriesState,
    people: [],
  });
  const doc = getYjsDoc(store);
  new IndexeddbPersistence(makeSeriesRoomName(seriesId), doc);
  new WebrtcProvider(makeSeriesRoomName(seriesId), doc);
  return { store };
};

/** checks if two arrays of people are exactly equal */
export const allPeopleEqual = (people1: Person[], people2: Person[]) =>
  people1.length === people2.length &&
  people1.every((person) =>
    people2.some(
      (person2) =>
        person2.id === person.id &&
        person2.name === person.name &&
        person2.order === person.order
    )
  );

export const useSyncedSeriesState = (seriesId: string) => {
  const syncedSeriesState = useSignal<SyncedSeriesStore>();
  const seriesState = useStore<StandupSeries>({
    id: seriesId,
    people: [],
    randomizeOnStart: false,
    title: "",
  });
  useContextProvider(seriesContext, seriesState);
  useVisibleTask$(() => {
    if (seriesId && syncedSeriesState.value === undefined) {
      const { store } = connectToSeriesStore({ seriesId });
      syncedSeriesState.value = noSerialize(store);
    }
  });

  useTask$(({ track }) => {
    track(() => seriesState.title);
    syncedSeriesState.value &&
      syncedSeriesState.value.seriesState.title !== seriesState.title &&
      (syncedSeriesState.value.seriesState.title = seriesState.title);
  });
  useTask$(({ track }) => {
    track(() => seriesState.randomizeOnStart);
    syncedSeriesState.value &&
      syncedSeriesState.value.seriesState.randomizeOnStart !==
        seriesState.randomizeOnStart &&
      (syncedSeriesState.value.seriesState.randomizeOnStart =
        seriesState.randomizeOnStart);
  });
  useTask$(({ track }) => {
    track(() => seriesState.people);
    if (
      !syncedSeriesState.value ||
      allPeopleEqual(syncedSeriesState.value.people, seriesState.people)
    ) {
      return;
    }
    // to reassign synced array, splice everything out, and replace it with new values.
    syncedSeriesState.value.people?.splice(
      0,
      syncedSeriesState.value.people.length,
      ...seriesState.people
    );
  });

  useTask$(({ cleanup, track }) => {
    track(() => syncedSeriesState.value);
    if (syncedSeriesState.value === undefined) {
      return;
    }
    const syncedState = syncedSeriesState.value.seriesState;
    seriesState.randomizeOnStart =
      syncedState.randomizeOnStart ?? seriesState.randomizeOnStart;
    seriesState.title = syncedState.title ?? seriesState.title;
    seriesState.people = syncedSeriesState.value.people.map((person) => ({
      id: person.id,
      name: person.name,
      order: person.order,
    }));

    const observeCleanup = observeDeep(
      syncedSeriesState.value.seriesState,
      () => {
        const syncedState = syncedSeriesState.value?.seriesState;
        if (syncedState) {
          seriesState.randomizeOnStart =
            syncedState.randomizeOnStart ?? seriesState.randomizeOnStart;
          seriesState.title = syncedState.title ?? seriesState.title;
        }
      }
    );
    const observePeopleCleanup = observeDeep(
      syncedSeriesState.value.people,
      () => {
        const syncedPeople = syncedSeriesState.value?.people;
        if (syncedPeople && !allPeopleEqual(seriesState.people, syncedPeople)) {
          seriesState.people =
            syncedPeople.map((person) => ({ ...person })) ??
            seriesState.people.map((person) => ({ ...person }));
        }
      }
    );
    // use y obeserve because syncedStore doesn't tell us which property changed
    cleanup(() => {
      observeCleanup();
      observePeopleCleanup();
    });
  });
  return seriesState;
};
