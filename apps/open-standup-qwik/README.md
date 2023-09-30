# Open Standup Qwik

## About

An app to use during standups.

### Is it cool?

Everyone who opens the app anywhere gets their state synced using p2p tech (no centralized server). That's kinda cool, right?

This is still a pretty basic POC, but some people may find it useful.

### How to use

go to https://open-standup.vercel.app to see a basic demo with a preset list of users. Anyone who is viewing the demo at the same time will see the same state as you.

Go to https://open-standup.vercel.app/new to create a new standup with a custom list of participants. When you click "create standup", the URL will change to one that you can share with others to join your standup.

## Supabase

This uses Supabase. To run locally, make sure docker is running and `pnpx supabase start`. This will create a local version of the DB with some test data.

When you run `pnpm run preview`, it will point at the real Supabase DB and do a production build of the app.
