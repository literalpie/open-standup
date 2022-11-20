import {
  noSerialize,
  useClientEffect$,
  useWatch$,
  useSignal,
} from "@builder.io/qwik";
import { StandupState } from "~/shared/types";
import { syncedStore, getYjsDoc, observeDeep } from "@syncedstore/core";
import { WebrtcProvider } from "y-webrtc";
import { YMapEvent } from "yjs";
interface PartialStandupState {
  orderPosition?: number;
  allDone?: boolean;
}

type SyncedStore = ReturnType<
  typeof syncedStore<{
    standupState: PartialStandupState;
    completeItems: number[];
  }>
>;

export const getSyncedStandupStore = ({
  orderPosition,
  allDone,
  completeItems,
}: PartialStandupState & {
  completeItems: number[];
}) => {
  const store = syncedStore<{
    standupState: PartialStandupState;
    completeItems: number[];
  }>({
    standupState: {} as any,
    completeItems: [] as any,
  });
  store.standupState.allDone = allDone;
  store.standupState.orderPosition = orderPosition;
  store.completeItems.push(...completeItems);
  const doc = getYjsDoc(store);
  const webrtcProvider = new WebrtcProvider("literalpie-open-standup", doc);
  return { webrtcProvider, store };
};

export const useSyncedStandupState = (state: StandupState) => {
  const syncedStateStore = useSignal<SyncedStore>();
  useClientEffect$(({ track }) => {
    track(() => state.allDone);
    track(() => state.orderPosition);
    // probbaly should track people done state too, but not sure how and it changes at the same time as other things anyway
    const completeItems = state.people
      .map((person) => ({
        index: person.order,
        done: person.done,
      }))
      .filter((doneState) => doneState.done)
      .map((doneState) => doneState.index);
    if (syncedStateStore.value) {
      // update existing
      if (syncedStateStore.value.standupState.allDone !== state.allDone) {
        syncedStateStore.value.standupState.allDone = state.allDone;
      }
      if (
        syncedStateStore.value.standupState.orderPosition !==
        state.orderPosition
      ) {
        syncedStateStore.value.standupState.orderPosition = state.orderPosition;
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
        orderPosition: state.orderPosition,
        allDone: state.allDone,
        completeItems,
      });
      syncedStateStore.value = noSerialize(store);
    }
  });
  useWatch$(({ cleanup, track }) => {
    track(() => syncedStateStore.value);
    if (syncedStateStore.value !== undefined) {
      const observeFunc = (
        mepEvent: YMapEvent<{ allDone: boolean; orderPosition: number }>
      ) => {
        if (mepEvent.keysChanged.has("allDone")) {
          console.log("allDone change in synced store");
          state.allDone = syncedStateStore.value?.standupState.allDone ?? false;
        }
        if (mepEvent.keysChanged.has("orderPosition")) {
          console.log("orderPosition change in synced store");
          state.orderPosition =
            syncedStateStore.value?.standupState.orderPosition;
        }
      };
      const unobserverCompleteItems = observeDeep(
        syncedStateStore.value.completeItems,
        () => {
          console.log("complete items change in synced store");
          state.people.forEach((person) => {
            const personIsDone = syncedStateStore.value?.completeItems.includes(
              person.order
            );
            if (personIsDone !== undefined && person.done !== personIsDone) {
              person.done = personIsDone;
            }
          });
        }
      );
      const yjs = getYjsDoc(syncedStateStore.value);
      // use y obeserve because syncedStore doesn't tell us which property changed
      yjs.get("standupState").observe(observeFunc);
      cleanup(() => {
        console.log("cleaning");
        yjs.get("standupState").unobserve(observeFunc);
        unobserverCompleteItems();
      });
    }
  });
};
