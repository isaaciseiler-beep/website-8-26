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
      viewBox="0 0 100 114"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      <ellipse className="ai-stick-shadow" cx="50" cy="109" rx="21" ry="3" />

      <g className="ai-stick-rig">
        <g className="ai-stick-leg ai-stick-leg--left">
          <path className="ai-stick-limb" d="M49 77 38 91 30 106" />
          <path className="ai-stick-foot" d="M30 106h-8" />
        </g>
        <g className="ai-stick-leg ai-stick-leg--right">
          <path className="ai-stick-limb" d="m51 77 11 14 8 15" />
          <path className="ai-stick-foot" d="M70 106h8" />
        </g>

        <path className="ai-stick-body" d="M50 47v31" />

        <g className="ai-stick-arm ai-stick-arm--left">
          <path className="ai-stick-limb" d="M49 54 34 65 25 81" />
          <circle className="ai-stick-hand" cx="25" cy="81" r="3.5" />
        </g>
        <g className="ai-stick-arm ai-stick-arm--right">
          <path className="ai-stick-limb" d="m51 54 15 11 9 16" />
          <circle className="ai-stick-hand" cx="75" cy="81" r="3.5" />
        </g>

        <g className="ai-stick-head">
          <circle className="ai-stick-head-outline" cx="50" cy="29" r="21" />
          <circle className="ai-stick-head-fill" cx="50" cy="29" r="17.5" />
          <path className="ai-stick-head-shine" d="M38 19c6-6 16-6 23-1" />

          <g className="ai-stick-expression ai-stick-expression--calm">
            <rect x="41" y="25" width="4" height="4" />
            <rect x="55" y="25" width="4" height="4" />
            <rect x="44" y="36" width="12" height="2.5" />
          </g>

          <g className="ai-stick-expression ai-stick-expression--grin">
            <rect x="40" y="25" width="6" height="2.5" />
            <rect x="54" y="25" width="6" height="2.5" />
            <rect x="42" y="34" width="4" height="3" />
            <rect x="46" y="37" width="8" height="3" />
            <rect x="54" y="34" width="4" height="3" />
          </g>

          <g className="ai-stick-expression ai-stick-expression--wink">
            <rect x="40" y="26" width="7" height="2.5" />
            <rect x="55" y="24" width="4" height="4" />
            <rect x="43" y="36" width="4" height="2.5" />
            <rect x="47" y="38" width="9" height="2.5" />
          </g>

          <g className="ai-stick-expression ai-stick-expression--surprise">
            <rect x="41" y="24" width="4" height="6" />
            <rect x="55" y="24" width="4" height="6" />
            <rect x="47" y="34" width="6" height="2" />
            <rect x="45" y="36" width="2" height="4" />
            <rect x="53" y="36" width="2" height="4" />
            <rect x="47" y="40" width="6" height="2" />
          </g>

          <g className="ai-stick-expression ai-stick-expression--open">
            <path d="m40 24 6 6m0-6-6 6m14-6 6 6m0-6-6 6" />
            <rect x="44" y="37" width="12" height="2.5" />
          </g>
        </g>
      </g>
    </svg>
  </button>
);

export default PixelBot;
