import { ApiError, createClient, normalizeCode, streakOf, type Fetcher } from "@/lib/api/client";

const res = (status: number, body?: unknown) => ({ status, ok: status >= 200 && status < 300, json: async () => body }) as unknown as Response;

describe("normalizeCode", () => {
  it("formats codes the way the API accepts them", () => {
    expect(normalizeCode("abcd efgh")).toBe("ABCD-EFGH");
    expect(normalizeCode("ab-cd-ef-gh")).toBe("ABCD-EFGH");
    expect(normalizeCode("ABCD-EFGH")).toBe("ABCD-EFGH");
    expect(normalizeCode("abc")).toBe("ABC");
  });
});

describe("createClient", () => {
  it("sends the bearer token and JSON body", async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const fetcher: Fetcher = async (u, init) => {
      calls.push([u, init]);
      return res(201, { flags: [], streak: 3, escalation: null });
    };
    const api = createClient({ base: "https://x/api/v1", getToken: () => "tok", fetcher });
    const r = await api.checkin("current", { mood: 4, pain: 2, sleep: 3, appetite: 3, energy: 3, signs: [], note: "" });
    expect(r.streak).toBe(3);
    expect(calls[0][0]).toBe("https://x/api/v1/journeys/current/checkins");
    const h = calls[0][1]?.headers as Record<string, string>;
    expect(h.Authorization).toBe("Bearer tok");
    expect(h["Content-Type"]).toBe("application/json");
    expect(JSON.parse(String(calls[0][1]?.body)).pain).toBe(2);
  });

  it("omits Authorization when signed out", async () => {
    let headers: Record<string, string> = {};
    const api = createClient({ getToken: () => null, fetcher: async (_u, init) => ((headers = init?.headers as Record<string, string>), res(201, { token: "t", expires_at: "", user: {} })) });
    await api.demo("UTC");
    expect(headers.Authorization).toBeUndefined();
  });

  it("turns the documented error shape into ApiError and signals 401", async () => {
    const onUnauthorized = jest.fn();
    const api = createClient({ getToken: () => "old", onUnauthorized, fetcher: async () => res(401, { error: { code: "unauthorized", message: "Sign in again." } }) });
    await expect(api.today()).rejects.toMatchObject({ status: 401, code: "unauthorized", message: "Sign in again." });
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it("maps no_journey and network failures", async () => {
    const api = createClient({ getToken: () => "t", fetcher: async () => res(404, { error: { code: "no_journey", message: "Enter the code" } }) });
    await expect(api.today()).rejects.toBeInstanceOf(ApiError);
    await expect(api.today()).rejects.toMatchObject({ code: "no_journey" });
    const down = createClient({ getToken: () => "t", fetcher: async () => Promise.reject(new Error("offline")) });
    await expect(down.me()).rejects.toMatchObject({ status: 0, code: "network" });
  });

  it("returns undefined on 204 and normalizes codes in paths", async () => {
    const urls: string[] = [];
    const api = createClient({ base: "b", getToken: () => "t", fetcher: async (u) => (urls.push(u), u.includes("signout") ? res(204) : res(200, { valid: true })) });
    await expect(api.signout()).resolves.toBeUndefined();
    await api.checkCode("abcd efgh");
    expect(urls[1]).toBe("b/codes/ABCD-EFGH");
  });
});

describe("streakOf", () => {
  it("accepts the documented number and the object the server sends", () => {
    expect(streakOf(4)).toBe(4);
    expect(streakOf({ current: 3, best: 5, doneToday: true })).toBe(3);
    expect(streakOf(null)).toBe(0);
  });
});
