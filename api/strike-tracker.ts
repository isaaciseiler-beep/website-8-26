import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readJsonBody, sendJson, type ApiRequest, type ApiResponse } from "./http.js";

const STRIKE_TRACKER_NAMES = ["Ricky", "Perry", "John", "Yasser", "Isaac"] as const;
const SUPABASE_TABLE = "strike_tracker_counts";
const DEFAULT_ACCESS_CODE = "9999";

type StrikeTrackerName = (typeof STRIKE_TRACKER_NAMES)[number];
type StrikeTrackerCounts = Record<StrikeTrackerName, number>;
type StrikeTrackerAction = "read" | "increment" | "reset";

let supabaseClient: SupabaseClient | null = null;

const initialCounts = STRIKE_TRACKER_NAMES.reduce(
  (counts, name) => ({
    ...counts,
    [name]: 0,
  }),
  {} as StrikeTrackerCounts,
);

const getEnvValue = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "undefined" ? trimmed : undefined;
};

const getAccessCode = (hasSharedStorage: boolean) => {
  const configuredCode = getEnvValue(process.env.STRIKE_TRACKER_ACCESS_CODE);
  return configuredCode ?? (hasSharedStorage ? undefined : DEFAULT_ACCESS_CODE);
};

const getSupabaseClient = () => {
  const url = getEnvValue(process.env.SUPABASE_URL) ?? getEnvValue(process.env.VITE_SUPABASE_URL);
  const key =
    getEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
    getEnvValue(process.env.SUPABASE_ANON_KEY) ??
    getEnvValue(process.env.VITE_SUPABASE_ANON_KEY);

  if (!url || !key) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
  }

  return supabaseClient;
};

const isStrikeTrackerName = (value: unknown): value is StrikeTrackerName =>
  typeof value === "string" && STRIKE_TRACKER_NAMES.includes(value as StrikeTrackerName);

const normalizeCounts = (rows: Array<{ name: string; count: number }> = []) =>
  STRIKE_TRACKER_NAMES.reduce(
    (counts, name) => ({
      ...counts,
      [name]: Number(rows.find((row) => row.name === name)?.count ?? 0),
    }),
    {} as StrikeTrackerCounts,
  );

const getAction = (value: unknown): StrikeTrackerAction | null => {
  if (value === "read" || value === "increment" || value === "reset") return value;
  return null;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Strike Tracker request failed";
};

const readCounts = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("name, count")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return normalizeCounts(data ?? []);
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = (await readJsonBody(request)) as {
      action?: unknown;
      code?: unknown;
      name?: unknown;
    };
    const action = getAction(body.action);

    if (!action) {
      sendJson(response, 400, { error: "A valid Strike Tracker action is required." });
      return;
    }

    const supabase = getSupabaseClient();
    const accessCode = getAccessCode(Boolean(supabase));
    if (!accessCode) {
      sendJson(response, 503, { error: "Strike Tracker access is not configured." });
      return;
    }

    if (String(body.code ?? "") !== accessCode) {
      sendJson(response, 401, { error: "Wrong code" });
      return;
    }

    if (!supabase) {
      sendJson(response, 200, {
        counts: initialCounts,
        mode: "local",
        warning: "Shared Strike Tracker storage is not configured on the server.",
      });
      return;
    }

    if (action === "read") {
      sendJson(response, 200, { counts: await readCounts(supabase), mode: "live" });
      return;
    }

    if (action === "increment") {
      if (!isStrikeTrackerName(body.name)) {
        sendJson(response, 400, { error: "A valid Strike Tracker name is required." });
        return;
      }

      const { data, error } = await supabase.rpc("increment_strike_count", {
        strike_name: body.name,
      });

      if (error) throw new Error(error.message);
      sendJson(response, 200, { counts: normalizeCounts(data ?? []), mode: "live" });
      return;
    }

    const { data, error } = await supabase.rpc("reset_strike_counts");
    if (error) throw new Error(error.message);
    sendJson(response, 200, { counts: normalizeCounts(data ?? []), mode: "live" });
  } catch (error) {
    console.error("Strike Tracker request failed", error);
    sendJson(response, 500, { error: getErrorMessage(error) });
  }
}
