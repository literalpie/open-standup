import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get a single meeting by ID. */
export const getMeeting = query({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.meetingId);
  },
});

/** Get all people in a meeting, sorted by order. */
export const getPeople = query({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("people")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .order("asc")
      .collect();
  },
});

/** Get the latest meeting instance for a meeting series. */
export const getLatestInstance = query({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    const instances = await ctx.db
      .query("meetingInstances")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .order("desc")
      .take(1);
    return instances[0] ?? null;
  },
});

/** Get updates for a meeting instance with their associated people. */
export const getUpdates = query({
  args: { meetingInstanceId: v.id("meetingInstances") },
  handler: async (ctx, args) => {
    const updates = await ctx.db
      .query("updates")
      .withIndex("by_meeting_instance", (q) =>
        q.eq("meetingInstanceId", args.meetingInstanceId),
      )
      .collect();

    const withPeople = await Promise.all(
      updates.map(async (u) => ({
        ...u,
        person: await ctx.db.get(u.personId),
      })),
    );

    return withPeople.sort((a, b) => a.order - b.order);
  },
});

/** Get latest instance + updates for a meeting, in a single subscription. */
export const getLatestInstanceWithUpdates = query({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    const instances = await ctx.db
      .query("meetingInstances")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .order("desc")
      .take(1);

    const instance = instances[0] ?? null;
    if (!instance) return null;

    const updates = await ctx.db
      .query("updates")
      .withIndex("by_meeting_instance", (q) =>
        q.eq("meetingInstanceId", instance._id),
      )
      .collect();

    const withPeople = await Promise.all(
      updates.map(async (u) => ({
        ...u,
        person: await ctx.db.get(u.personId),
      })),
    );

    return {
      ...instance,
      updates: withPeople.sort((a, b) => a.order - b.order),
    };
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Given sorted updates, create a fresh instance with first-person started. */
async function createInstanceWithUpdates(
  ctx: MutationCtx,
  meetingId: Id<"meetings">,
  people: Doc<"people">[],
  randomize: boolean,
) {
  const now = Date.now();

  const ordered = randomize
    ? [...people].sort(() => Math.random() - 0.5)
    : [...people].sort((a, b) => a.order - b.order);

  const instanceId = await ctx.db.insert("meetingInstances", {
    meetingId,
    createdAt: now,
  });

  for (let i = 0; i < ordered.length; i++) {
    await ctx.db.insert("updates", {
      meetingInstanceId: instanceId,
      personId: ordered[i]._id,
      order: i,
      ...(i === 0 ? { startedAt: now } : {}),
    });
  }

  return instanceId;
}

/** Find the active update and the next remaining one. */
function getActiveAndNext(updates: Doc<"updates">[]) {
  const active = updates.find(
    (u) => u.startedAt !== undefined && u.endedAt === undefined,
  );
  const remaining = updates.filter((u) => u.endedAt === undefined);

  if (active) {
    const others = remaining.filter((u) => u._id !== active._id);
    const next =
      others.find((u) => u.order > active.order) ?? others[0] ?? undefined;
    return { active, next };
  }

  // No one active — pick first remaining
  return { active: undefined, next: remaining[0] ?? undefined };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new meeting series with people and a first instance. */
export const createMeeting = mutation({
  args: {
    name: v.string(),
    people: v.array(v.object({ name: v.string(), order: v.number() })),
    randomizeOnStart: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const meetingId = await ctx.db.insert("meetings", {
      name: args.name,
      randomizeOnStart: args.randomizeOnStart,
      createdAt: now,
      updatedAt: now,
    });

    const peopleIds: Id<"people">[] = [];
    for (const p of args.people) {
      const id = await ctx.db.insert("people", {
        meetingId,
        name: p.name,
        order: p.order,
      });
      peopleIds.push(id);
    }

    // Fetch the full docs so createInstanceWithUpdates can use them
    const people = await Promise.all(peopleIds.map((id) => ctx.db.get(id)));

    const instanceId = await createInstanceWithUpdates(
      ctx,
      meetingId,
      people.filter(Boolean) as Doc<"people">[],
      args.randomizeOnStart,
    );

    return { meetingId, instanceId };
  },
});

/** Update a meeting template (name, people, randomize). */
export const updateMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
    name: v.string(),
    people: v.array(
      v.object({
        id: v.optional(v.id("people")),
        name: v.string(),
        order: v.number(),
      }),
    ),
    randomizeOnStart: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.meetingId, {
      name: args.name,
      randomizeOnStart: args.randomizeOnStart,
      updatedAt: Date.now(),
    });

    const existing = await ctx.db
      .query("people")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .collect();

    const keptIds = new Set(args.people.map((p) => p.id).filter(Boolean));

    for (const person of existing) {
      if (!keptIds.has(person._id)) await ctx.db.delete(person._id);
    }

    for (const person of args.people) {
      if (person.id) {
        await ctx.db.patch(person.id, {
          name: person.name,
          order: person.order,
        });
      } else {
        await ctx.db.insert("people", {
          meetingId: args.meetingId,
          name: person.name,
          order: person.order,
        });
      }
    }

    const instance = await ctx.db
      .query("meetingInstances")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .order("desc")
      .first();

    if (!instance) return args.meetingId;

    const updates = await ctx.db
      .query("updates")
      .withIndex("by_meeting_instance", (q) =>
        q.eq("meetingInstanceId", instance._id),
      )
      .collect();

    const inProgress = updates.some((u) => !u.endedAt);
    if (!inProgress) return args.meetingId;

    for (const u of updates) await ctx.db.delete(u._id);
    await ctx.db.delete(instance._id);

    const people = await ctx.db
      .query("people")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .collect();

    await createInstanceWithUpdates(
      ctx,
      args.meetingId,
      people,
      args.randomizeOnStart,
    );

    return args.meetingId;
  },
});

/** Create a new meeting instance for an existing meeting. */
export const createMeetingInstance = mutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const people = await ctx.db
      .query("people")
      .withIndex("by_meeting", (q) => q.eq("meetingId", args.meetingId))
      .order("asc")
      .collect();

    return await createInstanceWithUpdates(
      ctx,
      args.meetingId,
      people,
      meeting.randomizeOnStart,
    );
  },
});

/** Mark the current person as done, start the next person. */
export const completeUpdate = mutation({
  args: { meetingInstanceId: v.id("meetingInstances") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updates = (
      await ctx.db
        .query("updates")
        .withIndex("by_meeting_instance", (q) =>
          q.eq("meetingInstanceId", args.meetingInstanceId),
        )
        .collect()
    ).sort((a, b) => a.order - b.order);

    const { active, next } = getActiveAndNext(updates);

    if (active) {
      await ctx.db.patch(active._id, { endedAt: now });
    }
    if (next) {
      await ctx.db.patch(next._id, { startedAt: now });
    }
  },
});

/** Skip the current person (clear their startedAt), start the next. */
export const skipUpdate = mutation({
  args: { meetingInstanceId: v.id("meetingInstances") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updates = (
      await ctx.db
        .query("updates")
        .withIndex("by_meeting_instance", (q) =>
          q.eq("meetingInstanceId", args.meetingInstanceId),
        )
        .collect()
    ).sort((a, b) => a.order - b.order);

    const { active, next } = getActiveAndNext(updates);

    if (active) {
      await ctx.db.patch(active._id, { startedAt: undefined });
    }
    if (next) {
      await ctx.db.patch(next._id, { startedAt: now });
    }
  },
});

/** End current instance and start a new one. */
export const resetAll = mutation({
  args: { meetingInstanceId: v.id("meetingInstances") },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.meetingInstanceId);
    if (!instance) throw new Error("Instance not found");

    const meeting = await ctx.db.get(instance.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const now = Date.now();

    const updates = await ctx.db
      .query("updates")
      .withIndex("by_meeting_instance", (q) =>
        q.eq("meetingInstanceId", args.meetingInstanceId),
      )
      .collect();

    for (const u of updates) {
      if (!u.endedAt) {
        await ctx.db.patch(u._id, { endedAt: now });
      }
    }

    const people = await ctx.db
      .query("people")
      .withIndex("by_meeting", (q) => q.eq("meetingId", instance.meetingId))
      .collect();

    await createInstanceWithUpdates(
      ctx,
      instance.meetingId,
      people,
      meeting.randomizeOnStart,
    );
  },
});
