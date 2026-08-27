interface PixelBotProps {
  open: boolean;
  thinking: boolean;
  onToggle: () => void;
}

const PixelBot = ({ open, thinking, onToggle }: PixelBotProps) => (
  <button
    type="button"
    className="ai-pixel-bot-trigger"
    data-open={open ? "true" : "false"}
    data-thinking={thinking ? "true" : "false"}
    onClick={onToggle}
    aria-label={open ? "Close AI assistant" : "Ask AI"}
    aria-expanded={open}
  >
    <svg
      className="ai-pixel-bot"
      viewBox="0 0 100 110"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      <g className="ai-pixel-bot-rig">
        <path className="ai-pixel-bot-contact" d="M28 106h44v3H28z" />

        <g className="ai-pixel-bot-arm ai-pixel-bot-arm--left">
          <circle className="ai-pixel-bot-outline" cx="27" cy="73" r="7" />
          <circle className="ai-pixel-bot-shell-mid" cx="27" cy="73" r="4.5" />
          <rect className="ai-pixel-bot-outline" x="17" y="72" width="11" height="23" rx="5.5" transform="rotate(12 22.5 83.5)" />
          <rect className="ai-pixel-bot-shell" x="19.5" y="74" width="6" height="18" rx="3" transform="rotate(12 22.5 83)" />
          <path className="ai-pixel-bot-hand" d="M14 92h12v9H14z" />
          <rect className="ai-pixel-bot-finger" x="15" y="98" width="3" height="5" />
          <rect className="ai-pixel-bot-finger" x="22" y="98" width="3" height="5" />
        </g>

        <g className="ai-pixel-bot-arm ai-pixel-bot-arm--right">
          <circle className="ai-pixel-bot-outline" cx="73" cy="73" r="7" />
          <circle className="ai-pixel-bot-shell-mid" cx="73" cy="73" r="4.5" />
          <rect className="ai-pixel-bot-outline" x="72" y="72" width="11" height="23" rx="5.5" transform="rotate(-12 77.5 83.5)" />
          <rect className="ai-pixel-bot-shell" x="74.5" y="74" width="6" height="18" rx="3" transform="rotate(-12 77.5 83)" />
          <path className="ai-pixel-bot-hand" d="M74 92h12v9H74z" />
          <rect className="ai-pixel-bot-finger" x="75" y="98" width="3" height="5" />
          <rect className="ai-pixel-bot-finger" x="82" y="98" width="3" height="5" />
        </g>

        <g className="ai-pixel-bot-leg ai-pixel-bot-leg--left">
          <rect className="ai-pixel-bot-outline" x="32" y="88" width="15" height="18" rx="5" />
          <rect className="ai-pixel-bot-shell-shade" x="35" y="90" width="9" height="13" rx="3" />
          <path className="ai-pixel-bot-boot" d="M29 101h19v6H29z" />
        </g>

        <g className="ai-pixel-bot-leg ai-pixel-bot-leg--right">
          <rect className="ai-pixel-bot-outline" x="53" y="88" width="15" height="18" rx="5" />
          <rect className="ai-pixel-bot-shell-shade" x="56" y="90" width="9" height="13" rx="3" />
          <path className="ai-pixel-bot-boot" d="M52 101h19v6H52z" />
        </g>

        <g className="ai-pixel-bot-body">
          <rect className="ai-pixel-bot-outline" x="43" y="60" width="14" height="12" rx="5" />
          <rect className="ai-pixel-bot-shell-shade" x="46" y="61" width="8" height="10" rx="3" />
          <path className="ai-pixel-bot-outline" d="M32 66h36l8 9-3 20-7 7H34l-7-7-3-20z" />
          <path className="ai-pixel-bot-shell" d="M34 69h32l6 7-3 17-5 5H36l-5-5-3-17z" />
          <path className="ai-pixel-bot-shell-light" d="M35 71h28l4 4H31z" />
          <path className="ai-pixel-bot-shell-shade" d="M32 90h36l-4 7H36z" />
          <rect className="ai-pixel-bot-chest-outline" x="36" y="75" width="28" height="15" rx="5" />
          <rect className="ai-pixel-bot-chest-screen" x="39" y="78" width="22" height="9" rx="3" />
          <g className="ai-pixel-bot-chest-pixels">
            <path className="ai-pixel-bot-eye" d="m43 80 4 2.5-4 2.5v-2h-2v-1h2z" />
            <rect className="ai-pixel-bot-eye" x="50" y="83" width="7" height="1.5" rx="0.5" />
          </g>
          <g className="ai-pixel-bot-close">
            <path className="ai-pixel-bot-close-line" d="m43 80 14 5m0-5-14 5" />
          </g>
        </g>

        <g className="ai-pixel-bot-head">
          <path
            className="ai-pixel-bot-head-outline"
            d="M34 7q9-5 16 0 9-5 17 1 8-1 12 7 8 1 9 9 7 5 3 13 5 8-1 14 1 9-8 12-2 8-10 10-6 7-15 4-8 5-16 0-9 3-16-4-9-2-11-10-8-3-10-12-2-7 4-13-1-8 5-13 8-7 17-6 4-7 12-6z"
          />
          <path
            className="ai-pixel-bot-shell"
            d="M35 11q8-4 15 1 8-5 15 0 8-1 11 7 7 1 8 8 6 5 2 11 5 7-2 12 2 8-7 10-3 7-9 8-5 6-13 3-7 4-14 0-8 2-13-4-8-1-9-8-7-3-8-10-3-6 3-11 0-7 5-11 6-6 14-5 4-6 11-5z"
          />
          <path className="ai-pixel-bot-shell-light" d="M30 17q17-12 38-3 7 3 11 10-24-11-56 2 2-6 7-9z" />
          <path className="ai-pixel-bot-shell-shade" d="M17 49q33 18 66 0-2 13-14 16-19 8-38 0-12-3-14-16z" />
          <circle className="ai-pixel-bot-screen-outline" cx="50" cy="39" r="25" />
          <circle className="ai-pixel-bot-screen" cx="50" cy="39" r="21" />
          <path className="ai-pixel-bot-screen-glint" d="M33 31q17-11 34 0-17-6-34 4z" />
          <g className="ai-pixel-bot-eyes">
            <path className="ai-pixel-bot-eye-line" d="m36 38 4 3 4-3" />
            <path className="ai-pixel-bot-eye-line" d="m56 38 4 3 4-3" />
          </g>
          <circle className="ai-pixel-bot-face-status" cx="50" cy="49" r="1.5" />
        </g>
      </g>
    </svg>
  </button>
);

export default PixelBot;
