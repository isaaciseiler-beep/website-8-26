# Claude review log

Review chat: https://claude.ai/chat/01618505-6ef6-4761-bbd5-71f5707fbde9

The first sandboxed CLI attempt returned “Not logged in.” Passes 1–3 used the signed-in Claude desktop app (Opus 5.5 Medium); the final read-only CLI review succeeded outside the sandbox without changing authentication. Reviews reasoned from supplied source excerpts and reported verification; Claude did not independently inspect screenshots or run tests.

## Pass 1: aesthetics and selection motion

Claude recommended a single sliding selection marker with per-instance isolation, no first-paint travel, resize/font handling, and reduced motion. It identified the Lab product control appearing after its image on mobile, and recommended moving it ahead of the grid in DOM order. It also recommended a consistent artifact frame to avoid image-driven layout shifts.

Implemented using the installed Motion layout projection and existing motion constants, keeping selected states announced by native pressed buttons. Bold widths are reserved to prevent the controls shifting when selection changes. The Lab picker precedes the reading/media grid. Artifact images use a bounded, full-width, contain frame with existing theme tokens.

## Pass 2: backend capacity

Claude agreed with bounded instance admission, emphasized synchronous check/acquire/quota consumption and a finally boundary around the complete stream, and suggested 503 + Retry-After for temporary capacity exhaustion. It requested coverage of cache/local bypass, cancellation, deadline, errors, and idempotent cleanup.

Implemented 503 admission rejection and idempotent permits, held across advice, streaming, final validation and usage. Capacity rejection does not consume the daily call budget; it does count toward the existing network rate safeguard. No automatic client retries were added. This is process-local admission, not a distributed quota or guarantee that an upstream transport honors cancellation.

## Pass 3: ranking state transitions

Claude endorsed `layout="position"` with `initial={false}` for keyed ranking rows, keeping exact numeric values and the existing CSS bar-width interpolation. It cautioned about crossing rows, long jumps, scroll coordinates, focus and mid-animation coverage. The compact ranking now uses the existing bounded motion duration; expanded rankings remain immediate. Rows already use positioned isolation, and the list uses normal page scrolling. The facet marker's LayoutGroup contains only the facet control.

Claude suggested a separate static rank column. That was not adopted: this dataset has tied scores and skipped ranks, so each government's actual rank stays attached to its row. Settled-order/transform and reduced-motion browser checks were added instead. The root also removed CSS transform interpolation from the row owner to avoid competing animation engines.

## Pass 4: final regression review

The final CLI review found no blocking issues in the earlier motion, capacity, cache and media changes. It flagged the temporary textarea's invalid combobox role and conflict with multiline arrow keys. The root verified the role restriction against the W3C ARIA-in-HTML specification, then retained the original native search combobox and added only an aria-hidden wrapping display for the committed question. This removes the textarea-specific keyboard, paste and role risks while keeping the requested readability improvement. The native input has a Search keyboard hint. Final unit and browser checks cover Enter, IME, suggestions, query wrapping and responsive resizing.
