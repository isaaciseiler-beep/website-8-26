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
      viewBox="0 0 72 72"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <g className="ai-pixel-bot-shadow">
        <rect x="13" y="66" width="46" height="3" />
      </g>

      <g className="ai-pixel-bot-antenna">
        <rect className="ai-pixel-bot-ink" x="34" y="2" width="4" height="4" />
        <rect className="ai-pixel-bot-signal" x="35" y="3" width="2" height="2" />
        <rect className="ai-pixel-bot-ink" x="35" y="6" width="2" height="7" />
      </g>

      <g className="ai-pixel-bot-head">
        <path
          className="ai-pixel-bot-ink"
          d="M16 10h40v4h6v6h4v20h-4v6h-6v4H16v-4h-6v-6H6V20h4v-6h6z"
        />
        <path
          className="ai-pixel-bot-shell"
          d="M18 12h36v4h6v6h3v16h-3v6h-6v3H18v-3h-6v-6H9V22h3v-6h6z"
        />
        <rect className="ai-pixel-bot-shell-light" x="18" y="13" width="30" height="3" />
        <path
          className="ai-pixel-bot-screen"
          d="M20 18h32v3h4v17h-4v4H20v-4h-4V21h4z"
        />
        <rect className="ai-pixel-bot-screen-glint" x="20" y="21" width="23" height="2" />
        <g className="ai-pixel-bot-eyes">
          <path className="ai-pixel-bot-eye ai-pixel-bot-eye--left" d="M23 28h3v2h4v-2h3v4h-3v2h-4v-2h-3z" />
          <path className="ai-pixel-bot-eye ai-pixel-bot-eye--right" d="M39 28h3v2h4v-2h3v4h-3v2h-4v-2h-3z" />
        </g>
        <rect className="ai-pixel-bot-cheek" x="18" y="35" width="3" height="2" />
        <rect className="ai-pixel-bot-cheek" x="51" y="35" width="3" height="2" />
      </g>

      <g className="ai-pixel-bot-body">
        <path className="ai-pixel-bot-ink" d="M21 45h30v3h5v15h-6v5H22v-5h-6V48h5z" />
        <path className="ai-pixel-bot-shell" d="M23 48h26v3h4v10h-6v4H25v-4h-6V51h4z" />
        <rect className="ai-pixel-bot-shell-light" x="25" y="49" width="18" height="2" />
        <path className="ai-pixel-bot-screen" d="M28 52h16v8H28z" />
        <g className="ai-pixel-bot-prompt">
          <rect className="ai-pixel-bot-eye" x="31" y="54" width="2" height="2" />
          <rect className="ai-pixel-bot-eye" x="33" y="56" width="2" height="2" />
          <rect className="ai-pixel-bot-eye" x="36" y="57" width="5" height="1" />
        </g>
        <g className="ai-pixel-bot-close">
          <rect className="ai-pixel-bot-eye" x="31" y="53" width="2" height="2" />
          <rect className="ai-pixel-bot-eye" x="39" y="53" width="2" height="2" />
          <rect className="ai-pixel-bot-eye" x="35" y="56" width="2" height="2" />
          <rect className="ai-pixel-bot-eye" x="31" y="59" width="2" height="1" />
          <rect className="ai-pixel-bot-eye" x="39" y="59" width="2" height="1" />
        </g>
      </g>

      <g className="ai-pixel-bot-arm ai-pixel-bot-arm--left">
        <rect className="ai-pixel-bot-ink" x="10" y="49" width="7" height="13" />
        <rect className="ai-pixel-bot-shell-shade" x="12" y="51" width="4" height="9" />
      </g>
      <g className="ai-pixel-bot-arm ai-pixel-bot-arm--right">
        <rect className="ai-pixel-bot-ink" x="55" y="49" width="7" height="13" />
        <rect className="ai-pixel-bot-shell-shade" x="56" y="51" width="4" height="9" />
      </g>

      <g className="ai-pixel-bot-leg ai-pixel-bot-leg--left">
        <rect className="ai-pixel-bot-ink" x="24" y="63" width="9" height="7" />
        <rect className="ai-pixel-bot-shell-shade" x="26" y="63" width="5" height="4" />
      </g>
      <g className="ai-pixel-bot-leg ai-pixel-bot-leg--right">
        <rect className="ai-pixel-bot-ink" x="39" y="63" width="9" height="7" />
        <rect className="ai-pixel-bot-shell-shade" x="41" y="63" width="5" height="4" />
      </g>
    </svg>
  </button>
);

export default PixelBot;
