import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StandupMeeting, StandupSeries } from "../../shared/types";

const mockMeeting: StandupMeeting = {
  allDone: false,
  currentOptimistic: false,
  seriesId: "1",
  updates: [
    { personId: "1", done: true },
    { personId: "2", done: false, startTime: new Date() },
    { personId: "3", done: false },
    { personId: "4", done: false },
  ],
  updateTime: new Date(),
  currentlyUpdating: "2",
};
const mockSeries: StandupSeries = {
  id: "1",
  people: [
    { id: "1", name: "Ben", order: 0 },
    { id: "2", name: "Kasey", order: 1 },
    { id: "3", name: "Gregory", order: 2 },
    { id: "4", name: "Bethany", order: 3 },
  ],
  title: "Test meeting",
  randomizeOnStart: false,
};

@Component({
  selector: "app-standup-meeting",
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (seriesState.title !== undefined) {
    <h1>{{ seriesState.title }}</h1>
    } @else { No Title! }
    <!-- prettier workaround -->
    @for (update of meetingState().updates;track update) {
    <div
      [ngClass]="{
        'px-2 duration-500 flex justify-between': true,
        'bg-su-complete': update.done,
        'bg-su-in-progress': update.startTime !== undefined
      }"
    >
      <div class="px-1">{{ getPerson(update.personId)?.name }}</div>
    </div>

    } @empty {
    <div>Empty Meeting</div>
    }
    <button (click)="handleNextClick()" class="btn btn-primary">Next</button>
  `,
  styles: [],
})
export class StandupMeetingComponent {
  meetingState = signal(mockMeeting);
  seriesState = mockSeries;

  getPerson(id: string) {
    return this.seriesState.people.find((p) => p.id === id);
  }
  handleNextClick() {
    this.meetingState.update((previous) => {
      const current = previous.currentlyUpdating;
      const currentIndex = previous.updates.findIndex(
        (update) => update.personId === current,
      );
      const newCurrent = this.seriesState.people.find((p, i) => {
        return i > currentIndex;
      });
      console.log(previous, {
        ...previous,
        currentlyUpdating: newCurrent?.id,
        updates: previous.updates.map((update) => {
          if (update.personId === current) {
            return { ...update, done: true };
          }
          if (update.personId === newCurrent?.id) {
            return { ...update, startTime: new Date() };
          }
          return update;
        }),
      });
      return {
        ...previous,
        currentlyUpdating: newCurrent?.id,
        updates: previous.updates.map((update) => {
          console.log("update", update, current);

          if (update.personId === current) {
            console.log("margin done");
            return { ...update, done: true, startTime: undefined };
          }
          if (update.personId === newCurrent?.id) {
            return { ...update, startTime: new Date() };
          }
          return update;
        }),
      } as StandupMeeting;
    });
  }
}
