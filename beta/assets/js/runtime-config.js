/* Public runtime configuration. Turnstile Site Key is safe to expose. */
window.WIKARU_RUNTIME_CONFIG = Object.freeze({
  captchaProvider: "turnstile",
  /* Isi Site Key produksi dari Cloudflare Turnstile. Secret Key hanya disimpan
     di dashboard Supabase dan tidak boleh ditaruh di repository GitHub. */
  turnstileSiteKey: "",
  productionOrigin: "",
  diagnosticsMode: "local-only"
});
