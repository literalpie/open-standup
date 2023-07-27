import { createRouteData, useParams, useRouteData } from "solid-start";
import { createClient } from "@supabase/supabase-js";
import { Database } from "~/shared/db-types";
import { Person, StandupMeeting } from "~/shared/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export function routeData() {
  return createRouteData(async () => {
    const params = useParams();
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
export const hasPersonUpdated = (
  person: Person,
  updates: StandupMeeting["updates"],
) => {
  return updates.some((update) => update.personId === person.id && update.done);
};
export default function StandupMeetingComponent() {
  const params = useParams();
  const standupSeries = useRouteData<typeof routeData>();
  return (
    <div>
      Standup {params.standupId} {standupSeries()?.seriesState.title}
      <div>
        {standupSeries()?.seriesState.people?.map((person) => {
          return <div>{person.name}</div>;
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
              <button class="btn btn-neutral flex-grow" name="reset">
                Reset
              </button>
            </>
          ) : (
            <>
              <button class="btn btn-neutral flex-grow" name="next">
                Next
              </button>
              <button class="btn flex-grow btn-outline" name="skip">
                Skip
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
