import { ConvexClient } from "convex/browser";
import {
  FunctionReference,
  FunctionReturnType,
  OptionalRestArgs,
} from "convex/server";
import { Context, createContext, from, onCleanup, useContext } from "solid-js";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.error("VITE_CONVEX_URL is not set");
}

export const client = new ConvexClient(convexUrl as string);

/** Create a reactive SolidJS signal subscribed to a Convex query. */
export function createQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...args: OptionalRestArgs<Query>
): () => FunctionReturnType<Query> | undefined {
  return from((setter: (v: FunctionReturnType<Query>) => void) => {
    const unsubscribe = client.onUpdate(query, args[0] ?? {}, setter);
    return unsubscribe;
  });
}

/** Create a callable function for a Convex mutation. */
export function createMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation,
): (
  ...args: OptionalRestArgs<Mutation>
) => Promise<FunctionReturnType<Mutation>> {
  return (...args: OptionalRestArgs<Mutation>) => {
    return client.mutation(mutation, args[0] ?? {});
  };
}
