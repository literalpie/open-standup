import type { Signal } from "@builder.io/qwik";
import {
  component$,
  useComputed$,
  useSignal,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { server$, Form } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { Link, useLocation, routeAction$ } from "@builder.io/qwik-city";
import { StandupFormComponent } from "~/components/standup-component/standup-form-component";
import type {
  Person,
  StandupMeeting,
  StandupSeries,
} from "open-standup-shared";
import { getSbClient } from "~/server-helpers/get-sb-client";
import { Introduction } from "~/components/introduction/introduction";

// this is duplicated in the edit page
export const useStandupSeries = routeLoader$<StandupSeries>(
  async (requestEventLoader) => {
    const standupId = requestEventLoader.params["standupId"];
    const sbClient = await getSbClient(requestEventLoader);
    const updatePeopleReq = sbClient
      .from("updates")
      .select("*")
      .eq("meeting_id", standupId)
      .order("id", { ascending: true }) as unknown as {
      data: {
        person_name: string;
        id: number;
        meeting_id: number;
        order: number;
      }[];
    };
    const meetingsReq = sbClient
      .from("meetings")
      .select("*")
      .eq("id", standupId)
      .single();
    const [people, meetings] = await Promise.all([
      updatePeopleReq,
      meetingsReq,
    ]);
    return {
      id: standupId,
      people:
        people.data?.map((p) => ({
          id: String(p.id),
          name: p.person_name,
          order: p.order ?? p.id,
        })) ?? [],
      randomizeOnStart: meetings.data?.randomize_order ?? false,
      title: meetings.data?.title ?? "Unknown Title",
    };
  },
);

export const getStandupMeeting = server$(async function () {
  const sbClient = await getSbClient(this);
  const standupId = this.params["standupId"];

  const updates = await sbClient
    .from("updates")
    .select("*")
    .eq("meeting_id", standupId)
    .order("id", { ascending: true });
  const updatedAt = updates.data?.reduce((soFar, newOne) => {
    return new Date(newOne.updated_at).getTime() > soFar
      ? new Date(newOne.updated_at).getTime()
      : soFar;
  }, 0);
  return {
    allDone: updates.data?.every((update) => (update.duration ?? 0) > 0),
    seriesId: "1",
    updates: updates.data?.map((update) => ({
      done: (update.duration ?? 0) > 0,
      personId: String(update.id),
    })),
    updateTime: updatedAt !== undefined ? new Date(updatedAt) : new Date(),
    currentlyUpdating: updates.data
      ? String(updates.data?.find((update) => update.started_at !== null)?.id)
      : undefined,
  } as StandupMeeting;
});
export const useStandupMeeting = routeLoader$<StandupMeeting>(async () => {
  return getStandupMeeting();
});

export const advanceCurrentPerson = server$(async function ({
  finishUpdate,
}: {
  finishUpdate: boolean;
}) {
  const standupId = this.params["standupId"];

  const sbClient = await getSbClient(this);
  const updates = await sbClient
    .from("updates")
    .select("*")
    .eq("meeting_id", standupId);
  if (updates.data?.every((up) => up.duration !== null)) {
    return;
  }
  const sortedUpdates = [...(updates.data ?? [])]?.sort(
    (a, b) => (a.order ?? a.id) - (b.order ?? b.id),
  );
  const updatingIndex = sortedUpdates.findIndex(
    (person) => person.started_at !== null && person.duration === null,
  );
  const updatingUpdate =
    updatingIndex >= 0 ? sortedUpdates[updatingIndex] : undefined;
  const nextAfterCurrent = sortedUpdates.find(
    (person, index) => index > updatingIndex && person.duration === null,
  );
  const firstNotDone = sortedUpdates.find((person) => person.duration === null);
  const nextUpdate = nextAfterCurrent ?? firstNotDone;
  const updatedCurrentUpdate = updatingUpdate
    ? [
        {
          started_at: null,
          meeting_id: +standupId,
          person_name: updatingUpdate.person_name,
          id: updatingUpdate.id,
          duration: finishUpdate
            ? Date.now() - new Date(updatingUpdate.started_at!).getTime()
            : undefined,
        },
      ]
    : [];
  const updatedNextUpdate =
    nextUpdate && nextUpdate.id !== updatingUpdate?.id
      ? [
          {
            id: nextUpdate.id,
            meeting_id: +standupId,
            person_name: nextUpdate.person_name,
            started_at: new Date().toISOString(),
          },
        ]
      : [];
  const removeOldUpdating = sbClient
    .from("updates")
    .upsert([...updatedCurrentUpdate, ...updatedNextUpdate]);

  await removeOldUpdating;
  return true;
});

export const useStandupNext = routeAction$(
  async (formValue, requestEventAction) => {
    const standupId = requestEventAction.params["standupId"];

    if (formValue["Next"] !== undefined) {
      return advanceCurrentPerson({ finishUpdate: true });
    } else if (formValue["Skip"] !== undefined) {
      return advanceCurrentPerson({ finishUpdate: false });
    } else if (formValue["Reset"] !== undefined) {
      const sbClient = await getSbClient(requestEventAction);
      await sbClient
        .from("updates")
        .update({ duration: null, started_at: null })
        .eq("meeting_id", standupId);
    }
    return true;
  },
);

/** Gets updated meeting state every 2 seconds when the window is visible and focused. If the window is un-focused, updates every 20s. */
export const usePollingMeeting = () => {
  const loaderMeeting = useStandupMeeting();
  const meeting = useSignal(loaderMeeting.value);
  const lastUpdated = useSignal(new Date());
  useVisibleTask$(async ({ cleanup }) => {
    // allows us to stop polling when the component is unmounted
    let keepListening = true;
    cleanup(() => (keepListening = false));
    while (keepListening) {
      const dueForUnfocusedUpdate =
        new Date().getTime() - lastUpdated.value.getTime() > 20_000;
      if (
        document.visibilityState === "visible" &&
        (document.hasFocus() || dueForUnfocusedUpdate)
      ) {
        const newMeetingState = await getStandupMeeting();
        meeting.value = newMeetingState;
        lastUpdated.value = new Date();
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  });
  const numValue = useComputed$(() => {
    // get the most updated value. the loader will be most up-to-date if this instance made a change.
    const loaderCountDate = new Date(loaderMeeting.value.updateTime ?? 0);
    const pollingCount = new Date(meeting.value.updateTime ?? 0);
    return loaderCountDate > pollingCount ? loaderMeeting.value : meeting.value;
  });
  return numValue;
};

export const useEagerMeetingState = (
  standupNextAction: ReturnType<typeof useStandupNext>,
  meetingState: Signal<StandupMeeting>,
  people: Person[],
) => {
  const submitTime = useSignal<Date | undefined>();
  useTask$(({ track }) => {
    track(() => standupNextAction.isRunning);
    if (standupNextAction.isRunning) {
      submitTime.value = new Date();
    } else {
      submitTime.value = undefined;
    }
  });

  /**
   * The meetingState with optimistic updates if an action is in-progress.
   * There is also logic to make sure it doesn't optimistically update
   * if the real data is newer than the start of the action (for example, from polling).
   */
  return useComputed$(() => {
    /** We don't want to use an eager state update if the meeting state is newer and might already have the updated value. */
    const submitNewerThanMeetingState =
      submitTime.value &&
      meetingState.value.updateTime.getTime() < submitTime.value?.getTime();

    const skipping = standupNextAction.formData?.get("Skip") !== null;
    const nexting = standupNextAction.formData?.get("Next") !== null;
    const reseting = standupNextAction.formData?.get("Reset") !== null;
    if ((skipping || nexting) && submitNewerThanMeetingState) {
      const sortedUpdates = [...(meetingState.value.updates ?? [])]?.sort(
        (a, b) => {
          const matchingPersonA = people.find((p) => p.id === a.personId);
          const matchingPersonB = people.find((p) => p.id === b.personId);
          if (matchingPersonA !== undefined && matchingPersonB) {
            return matchingPersonA.order - matchingPersonB.order;
          }
          return +a.personId - +b.personId;
        },
      );
      console.log("sorted updates", sortedUpdates, people);

      const updatingIndex = sortedUpdates.findIndex(
        (person) => person.personId === meetingState.value.currentlyUpdating,
      );
      const updatingUpdate =
        updatingIndex >= 0 ? sortedUpdates[updatingIndex] : undefined;
      const nextAfterCurrent = sortedUpdates.find(
        (person, index) => index > updatingIndex && !person.done,
      );
      const firstNotDone = sortedUpdates.find((person) => !person.done);
      const nextUpdate = nextAfterCurrent ?? firstNotDone;
      const updates = meetingState.value.updates.map((up) =>
        nexting && up.personId === updatingUpdate?.personId
          ? { ...up, done: true }
          : up,
      );
      return {
        ...meetingState.value,
        updates,
        allDone: updates.every((up) => up.done === true),
        currentlyUpdating: nextUpdate?.personId,
      };
    }
    if (reseting && submitNewerThanMeetingState) {
      return {
        ...meetingState.value,
        updates: meetingState.value.updates.map((u) => ({ ...u, done: false })),
        allDone: false,
      };
    }
    return meetingState.value;
  });
};

export default component$(() => {
  const location = useLocation();
  const loaderSeriesState = useStandupSeries();
  const standupNextAction = useStandupNext();
  const serverMeetingState = usePollingMeeting();
  const meetingState = useEagerMeetingState(
    standupNextAction,
    serverMeetingState,
    loaderSeriesState.value.people,
  );

  return (
    <div class="flex flex-col gap-1">
      {location.params["standupId"] === "1" ? <Introduction /> : undefined}
      <h2 class="meeting-title flex items-center justify-center gap-2 text-center text-lg font-bold">
        <div>{loaderSeriesState.value.title}</div>
        <Link
          class="edit-button btn btn-sm btn-outline"
          href={`/${location.params["standupId"]}/edit`}
        >
          Edit
        </Link>
      </h2>
      <Form action={standupNextAction}>
        <StandupFormComponent
          seriesState={loaderSeriesState.value}
          standupState={meetingState.value}
        />
      </Form>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Open Standup",
  meta: [
    {
      name: "name",
      content: "description",
    },
  ],
};
