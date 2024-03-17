import {
  For,
  Show,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import PersonStatus from "~/components/PersonStatus";
import { supabase } from "~/shared/supabase";
import {
  getStandupMeeting,
  getStandupUpdates,
  useStandupState,
} from "~/shared/useStandupState";
import PeopleIcon from "~/components/icons/people.svg?component-solid";
import {
  subscribeToStandupChange,
  advanceCurrentPerson,
  resetStandup,
} from "open-standup-shared";
import {
  QueryClient,
  dehydrate,
  hydrate,
  useQueryClient,
} from "@tanstack/solid-query";
import { A, action, useParams } from "@solidjs/router";

function useReactiveStandupState() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryClient: any = useQueryClient();
  const [meetingParticipantsCount, setMeetingParticipantsCount] =
    createSignal(0);

  onMount(() => {
    const sub = subscribeToStandupChange({
      supabase,
      queryClient,
      onParticipantCountChange: (count) => {
        setMeetingParticipantsCount(count);
      },
    });
    onCleanup(() => {
      sub.unsubscribe();
    });
  });
  return { meetingParticipantsCount };
}

export default function StandupMeetingComponent() {
  const params = useParams();
  const [dehydratedQueryState] = createResource(async () => {
    const params = useParams();
    const standupId = params["standupId"];
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery({
      queryKey: ["standup-series", standupId, "updates"],
      queryFn: () => getStandupUpdates({ standupId }),
    });
    await queryClient.prefetchQuery({
      queryKey: ["standup-series", standupId, "meeting"],
      queryFn: () => getStandupMeeting({ standupId }),
    });
    return dehydrate(queryClient);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryClient: any = useQueryClient();
  hydrate(queryClient, dehydratedQueryState());
  const seriesQuery = useStandupState(params["standupId"]);
  const { meetingParticipantsCount } = useReactiveStandupState();
  const changeCurrentUpdate = action(async (formData: FormData) => {
    if (formData.get("Next") !== null) {
      const result = await advanceCurrentPerson({
        supabase,
        finishUpdate: true,
        standupId: params["standupId"],
        queryClient,
      });
      return result;
    }
    if (formData.get("Skip") !== null) {
      const result = await advanceCurrentPerson({
        supabase,
        finishUpdate: false,
        standupId: params["standupId"],
        queryClient,
      });
      return result;
    }
    if (formData.get("Reset") !== null) {
      const randomizeOrder =
        seriesQuery.seriesState()?.randomizeOnStart ?? false;
      resetStandup({
        supabase,
        queryClient,
        standupId: params["standupId"],
        randomizeOrder,
      });
    }
    return undefined;
  }, "changeCurrentUpdate");

  const sortedPeople = createMemo(
    () => {
      return seriesQuery
        .seriesState()
        ?.people.map((a) => ({ ...a }))
        .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
    },
    undefined,
    {
      equals: (a, b) => {
        return (
          a?.every((p, i) => {
            return (
              a !== undefined &&
              b !== undefined &&
              p.id === b[i].id &&
              p.name === b[i].name &&
              p.order === b[i].order
            );
          }) ?? false
        );
      },
    },
  );

  return (
    <div class="p-3">
      <Show when={params["standupId"] === "1"}>
        <h2 class="font-bold text-lg p-1">Welcome!</h2>
        <p>
          This is Open Standup. An app to help teams have quick and simple sync
          meetings.
        </p>
        <p>Play with the demo below, or make your own meeting</p>
        <div class="flex justify-center py-1">
          <A href={"/new"} class="btn btn-neutral w-1/2">
            Create new standup
          </A>
        </div>
        <details>
          <summary class="cursor-pointer">How does it work?</summary>
          <p>
            The name of the currently updating person is highlighted in blue.
            The name of anyone who has already done their update is highlighted
            in green.
          </p>

          <p>
            Anyone in the world who is viewing the demo at the same time will
            see the same state that you see. Try using the buttons to change
            which participant is currently updating.
          </p>
        </details>
      </Show>
      <div class="flex items-center gap-2 pb-1">
        <div class="flex-grow basis-12" />
        <Show
          when={!seriesQuery?.isLoading()}
          fallback={
            <div class="animate-pulse flex w-1/5 h-4 bg-slate-200 rounded" />
          }
        >
          <h2 class="font-semibold text-lg">
            {seriesQuery?.seriesState()?.title}
          </h2>
        </Show>
        <A
          class="edit-button btn btn-sm btn-outline"
          href={`/${params["standupId"]}/edit`}
        >
          Edit
        </A>
        <span
          class="flex-grow flex gap-1 basis-12 justify-end"
          aria-label={`There are ${meetingParticipantsCount()} participant(s) currently viewing this meeting.`}
          title={`There are ${meetingParticipantsCount()} participant(s) currently viewing this meeting.`}
        >
          <Show when={meetingParticipantsCount() !== 0}>
            {meetingParticipantsCount()}
            <PeopleIcon />
          </Show>
        </span>
      </div>
      <Show
        when={!seriesQuery?.isLoading()}
        fallback={
          <div>
            <div class="animate-pulse h-5 bg-slate-200 rounded m-1" />
            <div class="animate-pulse h-5 bg-slate-200 rounded m-1" />
            <div class="animate-pulse h-5 bg-slate-200 rounded m-1" />
            <div class="animate-pulse h-5 bg-slate-200 rounded m-1" />
            <div class="animate-pulse h-5 bg-slate-200 rounded m-1" />
            <div class="flex">
              <span class="inline animate-pulse w-1/2 h-10 bg-slate-200 rounded m-1" />
              <span class="inline animate-pulse w-1/2 h-10 bg-slate-200 rounded m-1" />
            </div>
          </div>
        }
      >
        <form action={changeCurrentUpdate} method="post">
          <For each={sortedPeople()}>
            {(person) => {
              const thisPersonUpdate = () =>
                seriesQuery
                  ?.meetingState()
                  ?.updates?.find(
                    (update) =>
                      update.personId === person.id &&
                      (update.done || update.startTime !== undefined),
                  );
              const current = () =>
                person.id === seriesQuery?.meetingState().currentlyUpdating;
              const optimistic = () =>
                thisPersonUpdate()?.optimistic ||
                (current() && seriesQuery.meetingState().currentOptimistic);
              const isDone = () => thisPersonUpdate()?.done ?? false;
              const updateStartTime = () => thisPersonUpdate()?.startTime;
              const duration = () => thisPersonUpdate()?.duration;
              return (
                <PersonStatus
                  name={person.name}
                  done={isDone()}
                  current={current()}
                  updateStartTime={updateStartTime()}
                  duration={duration()}
                  optimistic={optimistic()}
                />
              );
            }}
          </For>
          <div class="pt-3 flex gap-1">
            {seriesQuery?.meetingState().allDone ? (
              <>
                <div class="flex-grow">All Done!</div>
                <button class="btn btn-neutral flex-grow" name="Reset">
                  Reset
                </button>
              </>
            ) : (
              <>
                <button class="btn btn-neutral flex-grow" name="Next">
                  Next
                </button>
                <button class="btn flex-grow btn-outline" name="Skip">
                  Skip
                </button>
              </>
            )}
          </div>
        </form>
      </Show>
    </div>
  );
}
