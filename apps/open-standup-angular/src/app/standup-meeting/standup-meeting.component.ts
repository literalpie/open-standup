import { toSignal } from "@angular/core/rxjs-interop";
import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SupabaseService } from "../supabase.service";
import { ActivatedRoute } from "@angular/router";
import { map, mergeMap } from "rxjs";

@Component({
  selector: "app-standup-meeting",
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading()) {
      <div>
        <div class="m-1 h-5 animate-pulse rounded bg-slate-200"></div>
        <div class="m-1 h-5 animate-pulse rounded bg-slate-200"></div>
        <div class="m-1 h-5 animate-pulse rounded bg-slate-200"></div>
        <div class="m-1 h-5 animate-pulse rounded bg-slate-200"></div>
        <div class="m-1 h-5 animate-pulse rounded bg-slate-200"></div>
        <div class="flex">
          <span
            class="m-1 inline h-10 w-1/2 animate-pulse rounded bg-slate-200"
          ></span>
          <span
            class="m-1 inline h-10 w-1/2 animate-pulse rounded bg-slate-200"
          ></span>
        </div>
      </div>
    } @else {
      <h1>{{ seriesState()?.title }}</h1>
      @for (person of sortedPeople(); track person) {
        <div
          [ngClass]="{
            'flex justify-between px-2 duration-500': true,
            'bg-su-complete': getUpdate(person.id)?.done,
            'bg-su-in-progress': getUpdate(person.id)?.startTime !== undefined,
          }"
        >
          <div class="px-1">{{ person.name }}</div>
        </div>
      } @empty {
        <div>Empty Meeting</div>
      }
      <div class="flex gap-1 pt-3">
        @if (meetingState()?.allDone) {
          <div class="flex-grow">All Done!</div>
          <button
            (click)="handleResetClick()"
            class="btn btn-neutral flex-grow"
          >
            Reset
          </button>
        } @else {
          <button (click)="handleNextClick()" class="btn btn-neutral flex-grow">
            Next
          </button>
          <button (click)="handleSkipClick()" class="btn btn-outline flex-grow">
            Skip
          </button>
        }
      </div>
    }
  `,
  styles: [],
})
export class StandupMeetingComponent {
  meetingService = inject(SupabaseService);
  meetingId$ = inject(ActivatedRoute).params.pipe(
    map((params) => params["id"] as string),
  );
  meetingId = toSignal(this.meetingId$);

  private state = toSignal(
    this.meetingId$.pipe(
      mergeMap((meetingId) => {
        return this.meetingService.getSeries(meetingId);
      }),
    ),
  );
  isLoading = computed(() => {
    return this.state()?.isLoading;
  });
  seriesState = computed(() => this.state()?.seriesState);
  meetingState = computed(() => this.state()?.meetingState);
  sortedPeople = computed(() =>
    this.seriesState()
      ?.people.map((p) => ({ ...p }))
      .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id)),
  );

  getPerson(id: string) {
    return this.seriesState()?.people.find((p) => p.id === id);
  }
  getUpdate(id: string) {
    return this.meetingState()?.updates.find((u) => u.personId === id);
  }
  handleNextClick() {
    const id = this.meetingId();
    if (id) {
      this.meetingService.advanceCurrentPerson(id, true);
    }
  }
  handleSkipClick() {
    const id = this.meetingId();
    if (id) {
      this.meetingService.advanceCurrentPerson(id, false);
    }
  }
  handleResetClick() {
    const id = this.meetingId();
    if (id) {
      this.meetingService.resetStandup({
        standupId: id,
        randomize: this.seriesState()?.randomizeOnStart ?? false,
      });
    }
  }
}
