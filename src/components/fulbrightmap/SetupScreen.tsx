import { KeyRound, MapPinned } from "lucide-react";

export default function SetupScreen() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#101513] px-5 py-10 text-white">
      <section className="w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
        <div className="h-44 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_34%),linear-gradient(135deg,#2a2a2a,#101010_58%,#050505)] p-6">
          <div className="flex h-full items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-[7px] border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                <MapPinned aria-hidden="true" className="h-3.5 w-3.5" />
                Fulbright Map
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Add a Mapbox token to launch the map
              </h1>
            </div>
            <KeyRound aria-hidden="true" className="hidden h-12 w-12 text-white/80 sm:block" />
          </div>
        </div>

        <div className="space-y-5 p-6">
          <p className="text-sm leading-6 text-white/75">
            This page is ready, but it needs a public Mapbox access token before
            it can render the New Taipei map. Add this environment variable to
            `.env.local`, then restart the dev server.
          </p>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-4 font-mono text-sm text-white/85">
            VITE_MAPBOX_ACCESS_TOKEN=pk_your_token_here
          </div>

          <p className="text-xs leading-5 text-white/50">
            Supabase is optional. Without the Supabase public URL and anon key,
            pins are saved locally in this browser for demo mode.
          </p>
        </div>
      </section>
    </main>
  );
}
