import { Database, HardDrive, Lock } from "lucide-react";

import type { StorageMode } from "@/lib/fulbrightmap/types";
import RandomSpotButton from "./RandomSpotButton";

export default function TopPanel({
  totalPins,
  storageMode,
  loading,
  locked,
  onRandomSpot,
}: {
  totalPins: number;
  storageMode: StorageMode;
  loading: boolean;
  locked: boolean;
  onRandomSpot: () => void;
}) {
  const ModeIcon = storageMode === "supabase" ? Database : HardDrive;

  return (
    <section
      aria-label="Map controls"
      className="fulbright-top-panel fixed left-3 right-3 top-3 z-30 rounded-[1.35rem] border border-white/20 bg-neutral-950/65 p-4 text-white shadow-2xl shadow-black/35 backdrop-blur-2xl transition-[border-color,background-color,box-shadow] duration-300 sm:left-5 sm:right-auto sm:top-5 sm:w-[390px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            New Taipei Cohort&apos;s Favorite Spots
          </h1>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-center shadow-inner shadow-white/5">
          <div className="text-lg font-semibold leading-none">
            {totalPins}
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/55">
            spots
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RandomSpotButton disabled={loading} onClick={onRandomSpot} />
        <span
          className="inline-flex items-center gap-1.5 rounded-[7px] border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/75"
          title={
            storageMode === "local"
              ? "Local mode stores pins only in this browser because Supabase env vars are not configured."
              : "Shared mode is enabled with Supabase."
          }
        >
          <ModeIcon aria-hidden="true" className="h-3.5 w-3.5" />
          {storageMode === "local" ? "Local browser mode" : "Shared mode"}
        </span>
        {locked ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-[7px] border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/75"
            title="Adding and deleting spots are locked."
          >
            <Lock aria-hidden="true" className="h-3.5 w-3.5" />
            Locked
          </span>
        ) : null}
      </div>
    </section>
  );
}
