import { auth } from "@poynt/on-poynt-auth/server";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
