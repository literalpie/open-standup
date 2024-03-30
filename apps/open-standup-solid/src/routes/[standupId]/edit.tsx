import { useAction, useParams } from "@solidjs/router";
import {
  QueryClient,
  dehydrate,
  hydrate,
  useQueryClient,
} from "@tanstack/solid-query";
import { createResource } from "solid-js";
import { SeriesForm } from "~/components/SeriesForm";
import { updateMeeting } from "~/shared/updateMeeting";
import {
  getStandupMeeting,
  getStandupUpdates,
  useStandupState,
} from "~/shared/useStandupState";

export default function EditStandupMeetingComponent() {
  const client = useQueryClient();
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

  hydrate(client, dehydratedQueryState());
  const params = useParams();
  const standupId = params["standupId"];
  const standupQuery = useStandupState(params["standupId"]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const action = useAction(updateMeeting);
  return (
    <SeriesForm
      onSubmit={(series) => {
        action({ ...series, id: standupId });
      }}
      initialSeries={standupQuery.seriesState()}
    />
  );
}
