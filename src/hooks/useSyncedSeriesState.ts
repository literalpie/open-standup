import {
  noSerialize,
  useClientEffect$,
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

type PartialSeriesState = Partial<{
  id: string;
  title: string;
  randomizeOnStart: boolean;
}>;

type SyncedStore = {
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

export const useSyncedSeriesState = (seriesId: string) => {
  const syncedStateStore = useSignal<SyncedStore>();
  const returnedSeriesState = useStore<StandupSeries>({
    id: seriesId,
    people: [],
    randomizeOnStart: false,
    title: "",
  });
  useContextProvider(seriesContext, returnedSeriesState);
  useClientEffect$(() => {
    if (seriesId && syncedStateStore.value === undefined) {
      const { store } = connectToSeriesStore({ seriesId });
      syncedStateStore.value = noSerialize(store);
    }
  });

  useTask$(({ track }) => {
    track(() => returnedSeriesState.title);
    syncedStateStore.value &&
      syncedStateStore.value.seriesState.title !== returnedSeriesState.title &&
      (syncedStateStore.value.seriesState.title = returnedSeriesState.title);
  });
  useTask$(({ track }) => {
    track(() => returnedSeriesState.randomizeOnStart);
    syncedStateStore.value &&
      syncedStateStore.value.seriesState.randomizeOnStart !==
        returnedSeriesState.randomizeOnStart &&
      (syncedStateStore.value.seriesState.randomizeOnStart =
        returnedSeriesState.randomizeOnStart);
  });
  useTask$(({ track }) => {
    track(() => returnedSeriesState.people);
    if (
      !syncedStateStore.value ||
      syncedStateStore.value.people.length === returnedSeriesState.people.length
    ) {
      return;
    }
    // to reassign synced array, splice everything out, and replace it with new values.
    syncedStateStore.value.people?.splice(
      0,
      syncedStateStore.value.people.length,
      ...returnedSeriesState.people
    );
  });

  useTask$(({ cleanup, track }) => {
    track(() => syncedStateStore.value);
    if (syncedStateStore.value === undefined) {
      return;
    }
    const syncedState = syncedStateStore.value.seriesState;
    returnedSeriesState.randomizeOnStart =
      syncedState.randomizeOnStart ?? returnedSeriesState.randomizeOnStart;
    returnedSeriesState.title = syncedState.title ?? returnedSeriesState.title;
    returnedSeriesState.people = syncedStateStore.value.people.map(
      (person) => ({
        id: person.id,
        name: person.name,
        order: person.order,
      })
    );

    const observeCleanup = observeDeep(
      syncedStateStore.value.seriesState,
      () => {
        const syncedState = syncedStateStore.value?.seriesState;
        if (syncedState) {
          returnedSeriesState.randomizeOnStart =
            syncedState.randomizeOnStart ??
            returnedSeriesState.randomizeOnStart;
          returnedSeriesState.title =
            syncedState.title ?? returnedSeriesState.title;
        }
      }
    );
    const observePeopleCleanup = observeDeep(
      syncedStateStore.value.people,
      () => {
        const syncedPeople = syncedStateStore.value?.people;
        // TODO: actually check equality, not just length
        if (
          syncedPeople &&
          returnedSeriesState.people.length !== syncedPeople.length
        ) {
          returnedSeriesState.people =
            syncedPeople.map((person) => ({ ...person })) ??
            returnedSeriesState.people.map((person) => ({ ...person }));
        }
      }
    );
    // use y obeserve because syncedStore doesn't tell us which property changed
    cleanup(() => {
      observeCleanup();
      observePeopleCleanup();
    });
  });
  return returnedSeriesState;
};
