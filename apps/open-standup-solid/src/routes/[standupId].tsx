import {
  createRouteAction,
  createRouteData,
  useParams,
  useRouteData,
} from "solid-start";
import { createClient } from "@supabase/supabase-js";
import { Database } from "~/shared/db-types";
import { Person, StandupMeeting } from "~/shared/types";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://tbxhyxckwpqjqadqsehu.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieGh5eGNrd3BxanFhZHFzZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODg0ODk4NDksImV4cCI6MjAwNDA2NTg0OX0.BN4nSodYgrBMqt1UWrSRAdPZc9-0j6-x6O_g2ectrAU";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export function routeData() {
  return createRouteData(async () => {
    // const params = useParams();
    const params = { standupId: 2 };
    const updatePeopleReq = supabase
      .from("updates")
      .select("*")
      .eq("meeting_id", params.standupId)
      .order("id", { ascending: true }) as unknown as {
      data: { person_name: string; id: number; meeting_id: number }[];
    };
    const meetingsReq = supabase
      .from("meetings")
      .select("*")
      .eq("id", params.standupId)
      .single();
    const [people, meetings] = await Promise.all([
      updatePeopleReq,
      meetingsReq,
    ]);
    const seriesState = {
      id: params.standupId,
      people:
        people.data?.map((p) => ({
          id: String(p.id),
          name: p.person_name,
          order: p.id,
        })) ?? [],
      randomizeOnStart: meetings.data?.randomize_order ?? false,
      title: meetings.data?.title ?? "Unknown Title",
    };

    const updates = await supabase
      .from("updates")
      .select("*")
      .eq("meeting_id", params.standupId)
      .order("id", { ascending: true });
    const updatedAt = updates.data?.reduce((soFar, newOne) => {
      return new Date(newOne.updated_at).getTime() > soFar
        ? new Date(newOne.updated_at).getTime()
        : soFar;
    }, 0);
    const meetingState = {
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

    return { seriesState, meetingState };
  });
}

export const advanceCurrentPerson = async function ({
  finishUpdate,
}: {
  finishUpdate: boolean;
}) {
  // const params = useParams();
  const params = { standupId: 2 };

  const standupId = params["standupId"];

  const sbClient = supabase;
  const updates = await sbClient
    .from("updates")
    .select("*")
    .eq("meeting_id", standupId);
  if (updates.data?.every((up) => up.duration !== null)) {
    return;
  }
  const sortedUpdates = [...(updates.data ?? [])]?.sort((a, b) => a.id - b.id);
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
};

export const hasPersonUpdated = (
  person: Person,
  updates: StandupMeeting["updates"],
) => {
  return updates.some((update) => update.personId === person.id && update.done);
};
export default function StandupMeetingComponent() {
  const params = useParams();
  const standupSeries = useRouteData<typeof routeData>();
  const [_, { Form }] = createRouteAction(async (formData: FormData) => {
    if (formData.get("Next") !== null) {
      return advanceCurrentPerson({ finishUpdate: true });
    }
    if (formData.get("Skip") !== null) {
      return advanceCurrentPerson({ finishUpdate: false });
    }
    if (formData.get("Reset") !== null) {
      return supabase
        .from("updates")
        .update({ duration: null, started_at: null })
        .eq("meeting_id", 2);
    }
  });

  return (
    <div class="p-3">
      Standup {params.standupId} {standupSeries()?.seriesState.title}
      <Form>
        {standupSeries()?.seriesState.people?.map((person) => {
          const personDone = standupSeries()?.meetingState.updates.some(
            (up) => up.personId === person.id && up.done,
          );
          return (
            <div
              class={
                personDone
                  ? "bg-slate-200"
                  : person.id ===
                    standupSeries()?.meetingState.currentlyUpdating
                  ? "bg-slate-600"
                  : ""
              }
            >
              {person.name}
            </div>
          );
          // return (
          //   <PersonStatus
          //     key={person.name}
          //     name={person.name}
          //     done={hasPersonUpdated(person, standupState.updates)}
          //     current={person.id === standupState.currentlyUpdating}
          //   />
          // );
        })}
        <div class="pt-3 flex gap-1">
          {standupSeries()?.meetingState?.allDone ? (
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
      </Form>
    </div>
  );
}
