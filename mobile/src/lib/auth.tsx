import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient, type Client } from "./api/client";
import type { AuthResult, User } from "./api/types";
import { secure } from "./storage";

const TOKEN_KEY = "loci.token";
const USER_KEY = "loci.user";

type AuthState = {
  ready: boolean;
  user: User | null;
  signedIn: boolean;
  api: Client;
  accept: (r: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
  forget: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

/** The bearer token lives here, outside React state, so it never lands in props or logs. */
const session: { token: string | null } = { token: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const forget = useCallback(async () => {
    session.token = null;
    setUser(null);
    await secure.remove(TOKEN_KEY);
    await secure.remove(USER_KEY);
  }, []);

  const api = useMemo(
    () =>
      createClient({
        getToken: () => session.token,
        onUnauthorized: () => {
          void forget();
        },
      }),
    [forget],
  );

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [t, u] = await Promise.all([secure.get(TOKEN_KEY), secure.get(USER_KEY)]);
        if (!live) return;
        session.token = t;
        if (t && u) setUser(JSON.parse(u) as User);
      } catch {
        // unreadable storage: start signed out
      } finally {
        if (live) setReady(true);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const accept = useCallback(async (r: AuthResult) => {
    session.token = r.token;
    await secure.set(TOKEN_KEY, r.token);
    await secure.set(USER_KEY, JSON.stringify(r.user));
    setUser(r.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (session.token) await api.signout();
    } catch {
      // the token is dropped locally either way
    }
    await forget();
  }, [api, forget]);

  const value = useMemo<AuthState>(() => ({ ready, user, signedIn: Boolean(user), api, accept, signOut, forget }), [ready, user, api, accept, signOut, forget]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
