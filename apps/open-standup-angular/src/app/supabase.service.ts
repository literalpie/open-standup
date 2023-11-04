import {
  Injectable,
  OnDestroy,
  PLATFORM_ID,
  inject,
  signal,
} from "@angular/core";
import { RealtimeChannel, createClient } from "@supabase/supabase-js";
import { environment } from "../environment";
import { QueryClientService, UseQuery } from "@ngneat/query";
import { combineLatest, map, from } from "rxjs";
import { isPlatformBrowser } from "@angular/common";
import {
  resetStandup,
  advanceCurrentPerson,
  subscribeToStandupChange,
  Database,
  getMeetingState,
  defaultMeetingState,
} from "open-standup-shared";

@Injectable({
  providedIn: "root",
})
export class SupabaseService implements OnDestroy {
  private supabase = createClient<Database>(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );
  private useQuery = inject(UseQuery);
  participantCount = signal(0);
  queryClient = inject(QueryClientService);
  sub?: RealtimeChannel;

  constructor() {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      this.sub = subscribeToStandupChange({
        supabase: this.supabase,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryClient: this.queryClient as any,
        onParticipantCountChange: (count) => {
          this.participantCount.set(count);
        },
      });
    }
  }

  getSeries(id: string) {
    const updatesQuery$ = this.useQuery({
      queryKey: ["standup-series", id, "updates"],
      queryFn: () =>
        from(
          this.supabase
            .from("updates")
            .select("*")
            .eq("meeting_id", id)
            .order("id", { ascending: true }),
        ),
    });
    const seriesQuery$ = this.useQuery({
      queryKey: ["standup-series", id, "meeting"],
      queryFn: () =>
        from(this.supabase.from("meetings").select("*").eq("id", id).single()),
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient: this.queryClient as any,
      supabase: this.supabase,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient: this.queryClient as any,
      randomizeOrder: randomize,
      standupId,
      supabase: this.supabase,
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
