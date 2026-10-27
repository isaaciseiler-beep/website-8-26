import { Shuffle } from "lucide-react";

export default function RandomSpotButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Choose a random favorite spot"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-[7px] bg-white px-4 text-sm font-semibold text-neutral-950 shadow-lg shadow-black/25 transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-200 hover:shadow-xl hover:shadow-black/35 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-white/80 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/45 disabled:shadow-none disabled:hover:translate-y-0"
    >
      <Shuffle aria-hidden="true" className="h-4 w-4" />
      Random spot
    </button>
  );
}
