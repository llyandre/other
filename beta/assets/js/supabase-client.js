const SUPABASE_CONFIG = Object.freeze({
  url: "https://aiystwombsmsbqbjflgb.supabase.co",
  publishableKey: "sb_publishable_ZZySNNDt44nKVswclyfGDA_TrN_wyMh",
  adminEmail: "lakssanavisch@gmail.com",
  table: "wikaru_quiz_results",
  sdkUrl: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm"
});

const SDK_TIMEOUT_MS = 12_000;
let sdkPromise = null;
let client = null;
let currentSession = null;
let currentUserIsAdmin = false;

function emit(name, detail = {}) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

function withTimeout(promise, timeoutMs = SDK_TIMEOUT_MS, code = "supabase-timeout") {
  let timer = 0;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(code)), timeoutMs);
    })
  ]).finally(() => window.clearTimeout(timer));
}

async function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = withTimeout(import(SUPABASE_CONFIG.sdkUrl))
      .catch(error => {
        sdkPromise = null;
        throw error;
      });
  }
  return sdkPromise;
}

async function getClient() {
  if (client) return client;
  const { createClient } = await loadSdk();
  client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce"
    },
    global: {
      headers: { "X-Client-Info": "wikaru-github-pages/7.0" }
    }
  });
  client.auth.onAuthStateChange((event, session) => {
    currentSession = session || null;
    if (!session) currentUserIsAdmin = false;
    emit("wikaru:cloud-auth", cloudStatus());
    if (session && !isAnonymousSession(session)) {
      emit("wikaru:permanent-auth-ready", {
        ...cloudStatus(),
        event,
        email: session.user?.email || null
      });
    }
  });
  return client;
}

function isAnonymousSession(session = currentSession) {
  return Boolean(session?.user?.is_anonymous);
}

async function refreshAdminStatus() {
  currentUserIsAdmin = false;
  if (!currentSession || isAnonymousSession()) return false;
  const supabase = await getClient();
  const { data, error } = await supabase.rpc("is_wikaru_admin");
  if (error) throw error;
  currentUserIsAdmin = data === true;
  return currentUserIsAdmin;
}

export function cloudStatus() {
  return Object.freeze({
    configured: true,
    connected: Boolean(client),
    authenticated: Boolean(currentSession),
    anonymous: isAnonymousSession(),
    admin: currentUserIsAdmin,
    userId: currentSession?.user?.id || null,
    provider: "supabase"
  });
}

export async function initializeSupabase({ ensureParticipant = false } = {}) {
  const supabase = await getClient();
  const { data, error } = await withTimeout(supabase.auth.getSession());
  if (error) throw error;
  currentSession = data?.session || null;

  if (ensureParticipant && !currentSession) {
    await ensureParticipantSession();
  } else if (currentSession && !isAnonymousSession()) {
    await refreshAdminStatus();
  }

  emit("wikaru:cloud-ready", cloudStatus());
  return cloudStatus();
}

export async function ensureParticipantSession({ replacePermanent = false } = {}) {
  const supabase = await getClient();
  if (!currentSession) {
    const sessionResult = await supabase.auth.getSession();
    if (sessionResult.error) throw sessionResult.error;
    currentSession = sessionResult.data?.session || null;
  }
  if (currentSession && isAnonymousSession()) return currentSession;
  if (currentSession && !replacePermanent) return currentSession;
  if (currentSession && replacePermanent) {
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) throw signOutError;
    currentSession = null;
    currentUserIsAdmin = false;
  }
  const captchaToken = await window.WIKARU_CAPTCHA?.getToken?.().catch(() => "");
  const authOptions = captchaToken ? { options: { captchaToken } } : undefined;
  const { data, error } = await withTimeout(supabase.auth.signInAnonymously(authOptions));
  if (error) throw error;
  currentSession = data?.session || null;
  if (!currentSession) throw new Error("anonymous-session-missing");
  currentUserIsAdmin = false;
  emit("wikaru:cloud-ready", cloudStatus());
  return currentSession;
}

export async function signInWithMagicLink(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("magic-link-email-invalid");
  }
  const supabase = await getClient();
  const redirectUrl = `${window.location.origin}${window.location.pathname}`;
  const { data, error } = await withTimeout(
    supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: true
      }
    })
  );
  if (error) throw error;
  emit("wikaru:magic-link-sent", { email: normalizedEmail });
  return data;
}

export async function signOutPermanentAccount() {
  const supabase = await getClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
  currentSession = null;
  currentUserIsAdmin = false;
  emit("wikaru:cloud-auth", cloudStatus());
  return true;
}

export async function signInWikaruAdmin(password) {
  const value = String(password || "");
  if (!value) throw new Error("admin-password-required");
  const supabase = await getClient();
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({
      email: SUPABASE_CONFIG.adminEmail,
      password: value
    })
  );
  if (error) throw error;
  currentSession = data?.session || null;
  if (!currentSession) throw new Error("admin-session-missing");
  const allowed = await refreshAdminStatus();
  if (!allowed) {
    await supabase.auth.signOut({ scope: "local" });
    currentSession = null;
    throw new Error("admin-role-denied");
  }
  emit("wikaru:cloud-ready", cloudStatus());
  return currentSession;
}

export async function signOutWikaruAdmin() {
  if (!client) return;
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) throw error;
  currentSession = null;
  currentUserIsAdmin = false;
  emit("wikaru:cloud-auth", cloudStatus());
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function resultToRow(result = {}) {
  const finishedAt = new Date(result.finishedAt || Date.now());
  return {
    local_id: String(result.localId || `local-${Date.now()}`),
    username: String(result.username || "Peserta").trim().slice(0, 100),
    group_name: String(result.group || "-").trim().slice(0, 100),
    selected_language: result.selectedLanguage === "ja" ? "ja" : "id",
    selected_book: result.selectedBook || null,
    selected_material_category: result.selectedMaterialCategory || null,
    selected_chapter: result.selectedChapter || null,
    quiz_direction: result.quizDirection || null,
    shuffle_mode: result.shuffleMode || null,
    fiction_filter: result.fictionFilter ?? null,
    selected_chapter_filters: safeArray(result.selectedChapterFilters),
    selected_section_filters: safeArray(result.selectedSectionFilters),
    selected_type_filters: safeArray(result.selectedTypeFilters),
    total_questions: Math.max(0, Number(result.totalQuestions || 0)),
    correct_count: Math.max(0, Number(result.correctCount || 0)),
    wrong_count: Math.max(0, Number(result.wrongCount || 0)),
    score_percent: Math.min(100, Math.max(0, Number(result.scorePercent || 0))),
    kkm_status: result.kkmStatus || null,
    total_duration: Math.max(0, Number(result.totalDuration || 0)),
    finished_at: Number.isNaN(finishedAt.getTime()) ? new Date().toISOString() : finishedAt.toISOString(),
    details: safeArray(result.details),
    learning_context: result.learningContext ?? null,
    payload: result,
    schema_version: 3
  };
}

function rowToResult(row = {}) {
  const payload = row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
    ? row.payload
    : {};
  return {
    ...payload,
    localId: payload.localId || row.local_id,
    username: payload.username || row.username,
    group: payload.group || row.group_name,
    selectedLanguage: payload.selectedLanguage || row.selected_language,
    selectedBook: payload.selectedBook || row.selected_book,
    selectedMaterialCategory: payload.selectedMaterialCategory || row.selected_material_category,
    selectedChapter: payload.selectedChapter || row.selected_chapter,
    quizDirection: payload.quizDirection || row.quiz_direction,
    shuffleMode: payload.shuffleMode || row.shuffle_mode,
    fictionFilter: payload.fictionFilter ?? row.fiction_filter,
    selectedChapterFilters: payload.selectedChapterFilters || safeArray(row.selected_chapter_filters),
    selectedSectionFilters: payload.selectedSectionFilters || safeArray(row.selected_section_filters),
    selectedTypeFilters: payload.selectedTypeFilters || safeArray(row.selected_type_filters),
    totalQuestions: Number(payload.totalQuestions ?? row.total_questions ?? 0),
    correctCount: Number(payload.correctCount ?? row.correct_count ?? 0),
    wrongCount: Number(payload.wrongCount ?? row.wrong_count ?? 0),
    scorePercent: Number(payload.scorePercent ?? row.score_percent ?? 0),
    kkmStatus: payload.kkmStatus || row.kkm_status,
    totalDuration: Number(payload.totalDuration ?? row.total_duration ?? 0),
    finishedAt: payload.finishedAt || row.finished_at,
    details: payload.details || safeArray(row.details),
    learningContext: payload.learningContext ?? row.learning_context,
    supabaseId: row.id,
    source: "supabase"
  };
}

function assertSignedIn() {
  if (!currentSession?.user?.id) throw new Error("supabase-auth-required");
}

function assertAdmin() {
  assertSignedIn();
  if (!currentUserIsAdmin) throw new Error("supabase-admin-required");
}

export async function saveCloudResult(result) {
  await ensureParticipantSession();
  assertSignedIn();
  const supabase = await getClient();
  const row = resultToRow(result);
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.table)
    .upsert(row, { onConflict: "owner_id,local_id" })
    .select()
    .single();
  if (error) throw error;
  return rowToResult(data);
}

export async function fetchParticipantResults(username, groupName) {
  await ensureParticipantSession();
  assertSignedIn();
  const participantKey = `${String(groupName || "-").trim().toLowerCase()}::${String(username || "").trim().toLowerCase()}`;
  const supabase = await getClient();
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.table)
    .select("*")
    .eq("participant_key", participantKey)
    .order("finished_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return safeArray(data).map(rowToResult);
}

export async function fetchAdminResults() {
  assertAdmin();
  const supabase = await getClient();
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG.table)
    .select("*")
    .order("finished_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return safeArray(data).map(rowToResult);
}

export async function deleteAllCloudResults() {
  assertAdmin();
  const supabase = await getClient();
  const { error } = await supabase
    .from(SUPABASE_CONFIG.table)
    .delete()
    .not("id", "is", null);
  if (error) throw error;
  return true;
}

export async function cloudHealthCheck() {
  assertSignedIn();
  const supabase = await getClient();
  const { error } = await supabase
    .from(SUPABASE_CONFIG.table)
    .select("id", { head: true, count: "exact" })
    .limit(1);
  if (error) throw error;
  return true;
}

export async function cloudRoundTripTest() {
  await ensureParticipantSession();
  assertSignedIn();
  const supabase = await getClient();
  const localId = `diag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const row = resultToRow({
    localId,
    username: "__WIKARU_SYNC_TEST__",
    group: "Diagnostic",
    selectedLanguage: "id",
    totalQuestions: 0,
    correctCount: 0,
    wrongCount: 0,
    scorePercent: 0,
    totalDuration: 0,
    finishedAt: new Date().toISOString(),
    details: [],
    _diagnostic: true
  });
  const inserted = await supabase
    .from(SUPABASE_CONFIG.table)
    .insert(row)
    .select("id,local_id")
    .single();
  if (inserted.error) throw inserted.error;
  const id = inserted.data?.id;
  if (!id) throw new Error("supabase-diagnostic-insert-missing");
  const readBack = await supabase
    .from(SUPABASE_CONFIG.table)
    .select("id")
    .eq("id", id)
    .single();
  if (readBack.error || readBack.data?.id !== id) {
    throw readBack.error || new Error("supabase-diagnostic-read-missing");
  }
  const removed = await supabase
    .from(SUPABASE_CONFIG.table)
    .delete()
    .eq("id", id);
  if (removed.error) throw removed.error;
  return true;
}

export const WIKARU_SUPABASE_CONFIG = SUPABASE_CONFIG;

window.WIKARU_CLOUD = Object.freeze({
  initialize: initializeSupabase,
  ensureParticipantSession,
  signInAdmin: signInWikaruAdmin,
  signOutAdmin: signOutWikaruAdmin,
  signInWithMagicLink,
  signOutPermanentAccount,
  saveResult: saveCloudResult,
  fetchParticipantResults,
  fetchAdminResults,
  deleteAllResults: deleteAllCloudResults,
  healthCheck: cloudHealthCheck,
  roundTripTest: cloudRoundTripTest,
  status: cloudStatus,
  provider: "supabase"
});
