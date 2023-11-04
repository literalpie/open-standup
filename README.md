# Open Standup

An app to help teams have quick and simple sync meetings

## Variations

This app is mostly a playground for me to play around with different frameworks and technologies.
For this reason, there are multiple duplicates of the app, with different implementations and behaviors

### Solid

This is the best version. It uses tanstack-query and the supabase JS client to provide a better UX including SSR, optimistic updates, and practically instant reaction to database changes.

It also has some nice bonuses like customizable colors and animations.

This app shares a Supabase database with the Qwik version, so they can be used together.

It is built using:

- [Solid](https://www.solidjs.com/) - UI framework with excellent runtime performance and impressive simplicity
- [SolidStart](https://start.solidjs.com/getting-started/what-is-solidstart) - The Solid metaframework that handles SSR, routing, and other stuff
- [Tanstack Solid Query](https://tanstack.com/query/latest/) - Helps smoothly handle async requests with standard loading state, optimistic updates, and SSR with hydration
- [Kobalte](https://kobalte.dev/) - A headless component library for Solid
- [Supabase](https://supabase.com) - An open-source realtime database built on PostgreSQL

You can see view the latest deployed version at https://open-standup-solid.vercel.app/

The code is located in ./apps/open-standup-solid

### Qwik

Like the Solid app, this version of the app uses Supabase as a database for the state. In order to avoid loading extra JS in the browser, this version polls the server to check for updates from Supabase. This means the app doesn't update as immediately as the Solid version.

This app shares a Supabase database with the Solid version, so they can be used together.

It is built using:

- [Qwik](https://qwik.builder.io/docs/overview/) - UI framework with an extreme focus on loading the minimum amount of JS possible
- [Supabase](https://supabase.com) - An open-source realtime database built on PostgreSQL

You can see view the latest deployed version at https://open-standup.vercel.app/

The code is located in ./apps/open-standup-qwik

### Qwik P2P

This was the first version I made, and is the least stable. It attempts to keep track of standup state entirely on users' devices - there is no centralized server. The catch is that it doesn't seem to allow syncing between users who are on different networks.

It is built using:

- [Qwik](https://qwik.builder.io/docs/overview/) - UI framework with an extreme focus on loading the minimum amount of JS possible
- [yjs](https://docs.yjs.dev) - handles snycronising state that's being modified in multiple places.
- [y-webrtc](https://github.com/yjs/y-webrtc) - webrtc is the way to do peer-to-peer stuff. This makes that integrate with yjs.
- [SyncedStore](https://syncedstore.org/docs/) - Wrapper around yjs to make things easier to work with.

You can see view the latest deployed version at https://open-standup.vercel.app/p2p/

The code is located in ./apps/open-standup-qwik/src/routes/2p2

### Angular

This one cannot edit standup series, but it can join a standup and next/skip the current updater.

It is built using:

- [Angular](https://angular.io) - A classic framework with a great ecosytem of strongly-opinionated standards
- [Supabase](https://supabase.com) - An open-source realtime database built on PostgreSQL

You can see view the latest deployed version at https://open-standup.vercel.app/p2p/

The code is located in ./apps/open-standup-qwik/src/routes/2p2

## Development

Pull the code and run `pnpm install`, then a command for the app you want, such as `pnpm --filter ./apps/open-standup-solid run dev`.

If you're using one of the Supabase apps, you'll also need to run `pnpx supabase start` to develop with a local supabase instance, or change the development environment variables (see .env files in the app you're working on)

## Future

I may continue to add more frameworks (Modern Angular, Next, Svelte, etc.), or just keep building out the Solid app since I like how that one's going (error handling, time limits, history, etc.).
