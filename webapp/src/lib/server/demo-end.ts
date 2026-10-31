import "server-only";
import { one, q } from "./db";
import * as repo from "./repo";

/** Erases a demo account and its paired demo account, with every journey they created. */
export async function endDemoUser(id: string) {
  const pair = await one<{ demo_pair: string | null }>("SELECT demo_pair FROM users WHERE id = $1 AND is_demo", [id]).catch(() => null);
  if (pair?.demo_pair) {
    await q("DELETE FROM journeys WHERE created_by = $1", [pair.demo_pair]).catch(() => undefined);
    await repo.deleteUser(pair.demo_pair).catch(() => undefined);
  }
  await q("DELETE FROM journeys WHERE created_by = $1", [id]).catch(() => undefined);
  await repo.deleteUser(id).catch(() => undefined);
}
