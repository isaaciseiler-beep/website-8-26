import { Clock, Trash2, UserRound } from "lucide-react";

import type { Pin } from "@/lib/fulbrightmap/types";

function relativeTime(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const elapsed = Math.max(0, Date.now() - created);
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Added just now";
  if (minutes < 60) return `Added ${minutes} min ago`;
  if (hours < 24) return `Added ${hours} hr ago`;
  if (days < 7) return `Added ${days} day${days === 1 ? "" : "s"} ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(createdAt));
}

export default function PinPopup({
  pin,
  canDelete,
  onDelete,
}: {
  pin: Pin;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <article className="flex h-full w-full flex-col overflow-hidden bg-white text-neutral-950">
      <div className="relative h-[42svh] max-h-[420px] min-h-64 w-full shrink-0 overflow-hidden bg-neutral-200 sm:h-[48%]">
        <img
          src={pin.imageUrl}
          alt={pin.placeName}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="line-clamp-3 text-3xl font-semibold leading-tight text-white">
            {pin.placeName}
          </h2>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto p-5">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <UserRound aria-hidden="true" className="h-4 w-4 text-neutral-500" />
          <span>Shared by {pin.authorName}</span>
        </div>
        <p className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-base leading-7 text-neutral-800">
          {pin.caption}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-neutral-200 pt-4">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            {relativeTime(pin.createdAt)}
          </div>
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-[7px] border border-neutral-300 bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
