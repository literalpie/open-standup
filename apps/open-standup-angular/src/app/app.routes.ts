import { Routes } from "@angular/router";
import { StandupMeetingComponent } from "./standup-meeting/standup-meeting.component";

export const routes: Routes = [
  {
    title: "Standup Meeting",
    path: ":id",
    component: StandupMeetingComponent,
  },
  {
    title: "Home",
    path: "",
    component: StandupMeetingComponent,
  },
];
