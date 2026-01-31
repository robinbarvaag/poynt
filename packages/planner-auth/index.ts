// Server exports
export { auth, type Session, type User } from "./server";

// Client exports
export {
  authClient,
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} from "./client";
