import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  meetings: defineTable({
    name: v.string(),
    randomizeOnStart: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  people: defineTable({
    meetingId: v.id("meetings"),
    name: v.string(),
    order: v.number(),
  }).index("by_meeting", ["meetingId"]),

  meetingInstances: defineTable({
    meetingId: v.id("meetings"),
    createdAt: v.number(),
  }).index("by_meeting", ["meetingId"]),

  updates: defineTable({
    meetingInstanceId: v.id("meetingInstances"),
    personId: v.id("people"),
    order: v.number(),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  })
    .index("by_meeting_instance", ["meetingInstanceId"])
    .index("by_meeting_instance_and_person", ["meetingInstanceId", "personId"]),
});
