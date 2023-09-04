import {
  QueryClient,
  dehydrate,
  hydrate,
  useQueryClient,
} from "@tanstack/solid-query";
import {
  createRouteAction,
  createRouteData,
  useParams,
  useRouteData,
} from "solid-start";
import { SeriesForm } from "~/components/SeriesForm";
import { updateMeeting } from "~/shared/updateMeeting";
import {
  getStandupMeeting,
  getStandupUpdates,
  useStandupState,
} from "~/shared/useStandupState";

export function routeData() {
  const params = useParams();
  const standupId = params.standupId;
  const queryClient = new QueryClient();

  return createRouteData(async () => {
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
}

export default function EditStandupMeetingComponent() {
  const client = useQueryClient();
  const dehydratedQueryState = useRouteData<typeof routeData>();
  hydrate(client, dehydratedQueryState());
  const params = useParams();
  const standupId = params.standupId;
  const standupQuery = useStandupState(params.standupId);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, action] = createRouteAction(updateMeeting);
  return (
    <SeriesForm
      onSubmit={(series) => {
        action({ ...series, id: standupId });
      }}
      initialSeries={standupQuery.seriesState()}
    />
  );
}
