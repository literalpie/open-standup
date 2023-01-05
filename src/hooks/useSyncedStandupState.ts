import {
  noSerialize,
  useClientEffect$,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { syncedStore, getYjsDoc, observeDeep } from "@syncedstore/core";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import { YMapEvent } from "yjs";
import { Person, PersonState, StandupMeeting } from "~/shared/types";

interface PartialStandupState {
  orderPosition?: number;
  allDone?: boolean;
  standupId: string;
  people: Person[];
}

type SyncedStore = ReturnType<
  typeof syncedStore<{
    standupState: PartialStandupState;
    completeItems: number[];
  }>
>;

export const makeStandupRoomName = (id: string) => {
  return `com.literalpie.open-standup.standup.${id}`;
};

export const getSyncedStandupStore = ({
  orderPosition,
  allDone,
  completeItems,
  standupId,
  people,
}: PartialStandupState & {
  completeItems: number[];
}) => {
  const store = syncedStore<{
    standupState: PartialStandupState;
    completeItems: number[];
  }>({
    standupState: {} as any,
    completeItems: [],
  });
  store.standupState.allDone = allDone;
  store.standupState.orderPosition = orderPosition;
  store.standupState.standupId = standupId;
  store.standupState.people = people;
  store.completeItems.push(...completeItems);
  const doc = getYjsDoc(store);
  new IndexeddbPersistence(makeStandupRoomName(standupId), doc);
  const rtc = new WebrtcProvider(makeStandupRoomName(standupId), doc);

  // rtc.awareness.
  return { store };
};

export const connectToExistingStandup = ({
  standupId,
}: {
  standupId: string;
}) => {
  const store = syncedStore<{
    standupState: PartialStandupState;
    completeItems: number[];
  }>({
    standupState: {} as PartialStandupState,
    completeItems: [],
  });
  const doc = getYjsDoc(store);
  new IndexeddbPersistence(makeStandupRoomName(standupId), doc);
  new WebrtcProvider(makeStandupRoomName(standupId), doc);
  return { store };
};

export const peopleStateFromPeople =
  (completeItems: number[]) => (p: Person) => ({
    done: completeItems.includes(p.id),
    id: p.id,
    name: p.name,
    order: p.order,
  });

export const useSyncedStandupState = (
  standupState: Partial<StandupMeeting>
) => {
  const syncedStateStore = useSignal<SyncedStore>();
  useClientEffect$(({ track }) => {
    track(() => standupState.allDone);
    track(() => standupState.currentlyUpdating);
    track(() => standupState.people);
    // If the only thing we have is the ID, we want to connect without setting any state.
    if (standupState.seriesId && standupState.people === undefined) {
      const { store } = connectToExistingStandup({
        standupId: standupState.seriesId,
      });
      syncedStateStore.value = noSerialize(store);
      return;
    }
    // probbaly should track people done state too, but not sure how and it changes at the same time as other things anyway
    const completeItems =
      standupState.people
        ?.map((person) => ({
          index: person.order,
          done: person.done,
        }))
        .filter((doneState) => doneState.done)
        .map((doneState) => doneState.index) ?? [];
    if (
      // Possibly undefined on first init, or when discarded because it's not serialized
      syncedStateStore.value &&
      // If the ID changes, we're changing sessions and want the state to start over
      syncedStateStore.value.standupState.standupId === standupState.seriesId
    ) {
      // update existing
      if (
        syncedStateStore.value.standupState.allDone !== standupState.allDone
      ) {
        syncedStateStore.value.standupState.allDone = standupState.allDone;
      }
      if (
        syncedStateStore.value.standupState.orderPosition !==
        standupState.currentlyUpdating
      ) {
        syncedStateStore.value.standupState.orderPosition =
          standupState.currentlyUpdating;
      }
      const storedCompleteItems = syncedStateStore.value.completeItems;
      const newCompleted = completeItems.filter(
        (a) => !storedCompleteItems.includes(a)
      );
      storedCompleteItems.push(...newCompleted);
      // currently, items only get uncompleted when everything is reset.
      if (storedCompleteItems.length > 0 && completeItems.length === 0) {
        storedCompleteItems.splice(0, storedCompleteItems.length);
      }
    } else {
      // store could be set to undefined at any time because it's not serialized. Recover
      const { store } = getSyncedStandupStore({
        orderPosition: standupState.currentlyUpdating,
        allDone: standupState.allDone,
        completeItems,
        standupId: standupState.seriesId!,
        people:
          standupState.people?.map((p) => ({
            id: p.id,
            name: p.name,
            order: p.order,
          })) ?? [],
      });
      syncedStateStore.value = noSerialize(store);
    }
  });
  useTask$(({ cleanup, track }) => {
    track(() => syncedStateStore.value);
    if (syncedStateStore.value !== undefined) {
      standupState.allDone = syncedStateStore.value.standupState.allDone;
      standupState.currentlyUpdating =
        syncedStateStore.value.standupState.orderPosition;
      standupState.people =
        syncedStateStore.value.standupState.people?.map<PersonState>(
          peopleStateFromPeople(syncedStateStore.value.completeItems)
        );

      const observeFunc = (
        mepEvent: YMapEvent<{ allDone: boolean; orderPosition: number }>
      ) => {
        if (mepEvent.keysChanged.has("allDone")) {
          console.debug("allDone change in synced store");
          standupState.allDone =
            syncedStateStore.value?.standupState.allDone ?? false;
        }
        if (mepEvent.keysChanged.has("orderPosition")) {
          console.debug("orderPosition change in synced store");
          standupState.currentlyUpdating =
            syncedStateStore.value?.standupState.orderPosition;
        }
        if (mepEvent.keysChanged.has("people")) {
          console.debug("people change in synced store");
          standupState.people =
            syncedStateStore.value?.standupState.people?.map(
              peopleStateFromPeople(syncedStateStore.value.completeItems)
            );
        }
      };
      const unobserverCompleteItems = observeDeep(
        syncedStateStore.value.completeItems,
        () => {
          console.debug("complete items change in synced store");
          standupState.people = standupState.people?.map((person) => {
            const personIsDone = syncedStateStore.value?.completeItems.includes(
              person.order
            );
            if (personIsDone !== undefined && person.done !== personIsDone) {
              return { ...person, done: personIsDone };
            } else {
              return person;
            }
          });
        }
      );
      const yjs = getYjsDoc(syncedStateStore.value);
      // use y obeserve because syncedStore doesn't tell us which property changed
      yjs.get("standupState").observe(observeFunc);
      cleanup(() => {
        yjs.get("standupState").unobserve(observeFunc);
        unobserverCompleteItems();
      });
    }
  });
  return standupState;
};
