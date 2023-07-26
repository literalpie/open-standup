# Open Standup

## About

An app to use during standups.

### Is it cool?

Everyone who opens the app anywhere gets their state synced using p2p tech (no centralized server). That's kinda cool, right?

This is still a pretty basic POC, but some people may find it useful.

### How to use

go to https://open-standup.vercel.app to see a basic demo with a preset list of users. Anyone who is viewing the demo at the same time will see the same state as you.

Go to https://open-standup.vercel.app/new to create a new standup with a custom list of participants. When you click "create standup", the URL will change to one that you can share with others to join your standup.

### Future

I mostly made this app to play with Qwik, and I thought it would be cool to have an OSS standup app.

You can look at the open GitHub issues to see what my rough plans are. I make no promises that these issues will all be done though!

If we want to get serious, it would be cool to support writing updates with certain updates marked for discussion (that's how my team does standups), but including that would make security _much_ more important since engineering progress is confidential in many projects. It is possible to add a password to the webrtc communication. It may be worth trying to use that, but information is also stored locally, so something would need to be done about that too.

Cool integrations with Slack and stuff would also require some centralized server, again increasing the security burden.

## Tech

This is built using:

- [Qwik](https://qwik.builder.io/docs/overview/) - UI framework (like React, but not).
- [yjs](https://docs.yjs.dev) - handles snycronising state that's being modified in multiple places.
- [y-webrtc](https://github.com/yjs/y-webrtc) - webrtc is the way to do peer-to-peer stuff. This makes that integrate with yjs.
- [SyncedStore](https://syncedstore.org/docs/) - Wrapper around yjs to make things easier to work with.

### Deployments

The latest version of this app is deployed to https://open-standup.vercel.app .

## Supabase

This uses Supabase. To run locally, make sure docker is running and `pnpx supabase start`. This will create a local version of the DB with some test data.

When you run `pnpm run preview`, it will point at the real Supabase DB and do a production build of the app.
