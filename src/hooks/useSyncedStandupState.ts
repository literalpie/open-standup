import {
  noSerialize,
  useClientEffect$,
  useSignal,
  useStore,
  useTask$,
} from "@builder.io/qwik";
import { syncedStore, getYjsDoc, observeDeep } from "@syncedstore/core";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import { YMapEvent } from "yjs";
import { Person, StandupMeeting, StandupSeries } from "~/shared/types";

type SyncedStandupState = Partial<
  Pick<StandupMeeting, "currentlyUpdating" | "allDone">
>;

type SyncedStore = {
  standupState: SyncedStandupState;
  completeItems: string[];
  /** The personID of each participant, in the order for this meeting. */
  order: string[];
};

export const makeStandupRoomName = (id: string) => {
  return `com.literalpie.open-standup.standup.${id}`;
};

export const connectToStandupStore = ({ standupId }: { standupId: string }) => {
  const store = syncedStore<{
    standupState: SyncedStandupState;
    completeItems: string[];
    order: string[];
  }>({
    standupState: {} as SyncedStandupState,
    completeItems: [],
    order: [],
  });
  const doc = getYjsDoc(store);
  new IndexeddbPersistence(makeStandupRoomName(standupId), doc);
  new WebrtcProvider(makeStandupRoomName(standupId), doc);
  return { store };
};

export const peopleStateFromPeople =
  (completeItems: string[], order: string[]) => (p: Person) => ({
    done: completeItems.includes(p.id),
    id: p.id,
    name: p.name,
    order: order.indexOf(p.id),
  });

export const useSyncedStandupState = (seriesState: StandupSeries) => {
  console.log("series state", seriesState);
  const syncedStateStore = useSignal<SyncedStore>();
  const standupState = useStore<StandupMeeting>({
    allDone: false,
    seriesId: seriesState.id,
    updates: [],
    currentlyUpdating: undefined,
    order: seriesState.people.map((p) => p.id),
  });

  useClientEffect$(({ track }) => {
    track(() => standupState.seriesId);
    if (standupState.seriesId) {
      const { store } = connectToStandupStore({
        standupId: standupState.seriesId,
      });
      syncedStateStore.value = noSerialize(store);
    }
  });

  // Update remote state when local state changes. (only update if not already equal)
  useTask$(({ track }) => {
    track(() => standupState.currentlyUpdating);
    if (
      !syncedStateStore.value ||
      syncedStateStore.value.standupState.currentlyUpdating ===
        standupState.currentlyUpdating
    ) {
      return;
    }
    syncedStateStore.value.standupState.currentlyUpdating =
      standupState.currentlyUpdating;
  });
  useTask$(({ track }) => {
    track(() => standupState.allDone);
    if (
      !syncedStateStore.value ||
      syncedStateStore.value.standupState.allDone === standupState.allDone
    ) {
      return;
    }
    syncedStateStore.value.standupState.allDone = standupState.allDone;
  });
  useTask$(({ track }) => {
    track(() => standupState.order);
    if (
      !syncedStateStore.value ||
      (syncedStateStore.value.order.length === standupState.order.length &&
        syncedStateStore.value.order.every(
          (personId, index) => standupState.order.at(index) === personId
        ))
    ) {
      return;
    }
    syncedStateStore.value.order.splice(
      0,
      syncedStateStore.value.order.length,
      ...standupState.order
    );
  });
  // useTask$(({ track }) => {
  //   track(() => seriesState.people);
  //   if (seriesState.people.length !== standupState.order.length) {
  //     standupState.order = seriesState.people.map((p) => p.id);
  //   }
  // });
  useTask$(({ track }) => {
    track(() => standupState.updates);

    if (!syncedStateStore.value) {
      return;
    }
    const completeItems =
      seriesState.people
        .filter((doneState) =>
          standupState.updates.some(
            (update) => update.personId === doneState.id && update.done
          )
        )
        .map((doneState) => doneState.id) ?? [];

    const completeItemsEqual =
      completeItems.length === syncedStateStore.value.completeItems.length &&
      syncedStateStore.value.completeItems.every((item) =>
        completeItems.includes(item)
      );

    if (!completeItemsEqual) {
      syncedStateStore.value.completeItems.splice(
        0,
        syncedStateStore.value.completeItems.length,
        ...completeItems
      );
    }
  });

  // Update local state when remote state changes
  useTask$(({ cleanup, track }) => {
    track(() => syncedStateStore.value);
    if (!syncedStateStore.value) {
      return;
    }

    // Set all local state to remote state when the remote state first loads.
    standupState.allDone = syncedStateStore.value.standupState.allDone ?? false;
    standupState.currentlyUpdating =
      syncedStateStore.value.standupState.currentlyUpdating;
    standupState.updates = syncedStateStore.value.completeItems.map(
      (completeId) => ({
        done: true,
        personId: completeId,
      })
    );
    console.log(
      "syned order",
      syncedStateStore.value.order.length,
      standupState.order
    );
    syncedStateStore.value.order.length > 0
      ? (standupState.order = syncedStateStore.value.order.map((item) => item))
      : void 0;

    const observeFunc = (
      mepEvent: YMapEvent<{ allDone: boolean; currentlyUpdating: string }>
    ) => {
      console.debug("changed keys", mepEvent.keysChanged);
      if (mepEvent.keysChanged.has("allDone")) {
        const synedAllDone = syncedStateStore.value?.standupState.allDone;
        synedAllDone !== undefined &&
          standupState.allDone !== synedAllDone &&
          (standupState.allDone = synedAllDone!);
      }
      if (mepEvent.keysChanged.has("currentlyUpdating")) {
        standupState.currentlyUpdating =
          syncedStateStore.value?.standupState.currentlyUpdating;
      }
    };
    const unobserverCompleteItems = observeDeep(
      syncedStateStore.value.completeItems,
      () => {
        console.debug("complete items change in synced store");
        const newUpdates =
          syncedStateStore.value?.completeItems.map((complete) => ({
            done: true,
            personId: complete,
          })) ?? [];
        if (newUpdates.length !== standupState.updates.length) {
          standupState.updates = newUpdates;
        }
      }
    );
    const unobserverOrder = observeDeep(syncedStateStore.value.order, () => {
      console.debug("order change in synced store");
      if (!syncedStateStore.value) {
        return;
      }
      const ordersEqual = syncedStateStore.value?.order.every(
        (personId, index) => standupState.order.at(index) === personId
      );
      if (
        ordersEqual !== undefined &&
        !ordersEqual &&
        syncedStateStore.value.order.length > 0
      ) {
        standupState.order = [...syncedStateStore.value.order];
      }
    });
    const yjs = getYjsDoc(syncedStateStore.value);
    // use y obeserve because syncedStore doesn't tell us which property changed
    yjs.get("standupState").observe(observeFunc);
    cleanup(() => {
      yjs.get("standupState").unobserve(observeFunc);
      unobserverCompleteItems();
      unobserverOrder();
    });
  });
  return standupState;
};
