import {
  Injectable,
  OnDestroy,
  PLATFORM_ID,
  inject,
  signal,
} from "@angular/core";
import { RealtimeChannel, createClient } from "@supabase/supabase-js";
import { environment } from "../environment";
import { injectQuery, injectQueryClient } from "@ngneat/query";
import { combineLatest, map, from } from "rxjs";
import { isPlatformBrowser } from "@angular/common";
import {
  resetStandup,
  advanceCurrentPerson,
  subscribeToStandupChange,
  getMeetingState,
  defaultMeetingState,
} from "open-standup-shared";

const supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseAnonKey,
);
@Injectable({
  providedIn: "root",
})
export class SupabaseService implements OnDestroy {
  participantCount = signal(0);
  queryClient = injectQueryClient();
  query = injectQuery();
  sub?: RealtimeChannel;

  constructor() {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      this.sub = subscribeToStandupChange({
        supabase: supabase,
        queryClient: this.queryClient,
        onParticipantCountChange: (count) => {
          this.participantCount.set(count);
        },
      });
    }
  }

  getSeries(id: string) {
    const updatesQuery$ = this.query({
      queryKey: ["standup-series", id, "updates"],
      queryFn: () =>
        from(
          supabase
            .from("updates")
            .select("*")
            .eq("meeting_id", id)
            .order("id", { ascending: true }),
        ),
    });
    const seriesQuery$ = this.query({
      queryKey: ["standup-series", id, "meeting"],
      queryFn: () =>
        from(supabase.from("meetings").select("*").eq("id", id).single()),
    });
    return combineLatest(updatesQuery$.result$, seriesQuery$.result$).pipe(
      map(([a, b]) => {
        const isLoading = a.isLoading || b.isLoading;
        const isError = a.isError || b.isError;
        const updates = a.data?.data;
        const fetchedSeries = b.data?.data;
        const seriesState = {
          id,
          people:
            updates?.map((p) => ({
              id: String(p.id),
              name: p.person_name,
              order: p.order ?? p.id,
            })) ?? [],
          randomizeOnStart: fetchedSeries?.randomize_order,
          title: fetchedSeries?.title ?? "Unknown Title",
        };
        const meetingState = updates
          ? getMeetingState({ updates, id })
          : defaultMeetingState;

        return { isLoading, isError, seriesState, meetingState };
      }),
    );
  }

  advanceCurrentPerson(standupId: string, finishUpdate: boolean) {
    advanceCurrentPerson({
      standupId,
      finishUpdate,
      queryClient: this.queryClient,
      supabase,
    });
  }
  resetStandup({
    randomize,
    standupId,
  }: {
    randomize: boolean;
    standupId: string;
  }) {
    resetStandup({
      queryClient: this.queryClient,
      randomizeOrder: randomize,
      standupId,
      supabase,
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
