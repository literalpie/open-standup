import { component$, useSignal } from "@builder.io/qwik";
import { routeLoader$, useNavigate } from "@builder.io/qwik-city";
import { SeriesForm } from "~/components/series-form/series-form";
import { getSbClient } from "~/server-helpers/get-sb-client";
import { useSaveStandupSeries } from "~/server-helpers/save-standup-series";
import { StandupSeries } from "~/shared/types";

export const useStandupSeries = routeLoader$<StandupSeries>(
  async (requestEventLoader) => {
    const standupId = requestEventLoader.params["standupId"];
    const sbClient = await getSbClient(requestEventLoader);
    const updatePeopleReq = sbClient
      .from("updates")
      .select("*")
      .eq("meeting_id", standupId)
      .order("id", { ascending: true }) as unknown as {
      data: { person_name: string; id: number; meeting_id: number }[];
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
          order: p.id,
        })) ?? [],
      randomizeOnStart: meetings.data?.randomize_order ?? false,
      title: meetings.data?.title ?? "Unknown Title",
    };
  },
);

export default component$(() => {
  const seriesState = useStandupSeries();
  const submitSeries = useSaveStandupSeries();
  const nav = useNavigate();
  const updatedId = useSignal<string | undefined>();
  return (
    <div>
      {updatedId.value !== undefined ? (
        <>
          <p>
            The standup has been updated, but it doesn't always navigate right.
          </p>
          <a class="link" href={`/${updatedId.value}`}>
            Click Here
          </a>
        </>
      ) : (
        <>
          <SeriesForm
            series={seriesState.value}
            onSubmit$={async (series) => {
              const newId = await submitSeries.submit({
                ...series,
                id: seriesState.value.id,
              });
              console.log(
                "created standup with id",
                newId.value,
                "but sometimes nav just doesnt do anything...",
              );
              updatedId.value = newId.value as unknown as string;
              nav(`/${newId.value}`);
            }}
          />
        </>
      )}
    </div>
  );
});
