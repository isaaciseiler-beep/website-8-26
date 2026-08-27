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
      viewBox="0 0 92 104"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <g className="ai-pixel-bot-rig">
        <path className="ai-pixel-bot-contact" d="M24 101h44v3H24z" />

        <g className="ai-pixel-bot-antenna">
          <rect className="ai-pixel-bot-outline" x="44" y="6" width="4" height="11" />
          <rect className="ai-pixel-bot-shell" x="45" y="7" width="2" height="9" />
          <rect className="ai-pixel-bot-outline" x="41" y="1" width="10" height="7" />
          <rect className="ai-pixel-bot-status" x="44" y="3" width="4" height="3" />
          <rect className="ai-pixel-bot-signal" x="53" y="2" width="3" height="3" />
        </g>

        <g className="ai-pixel-bot-backpack">
          <path className="ai-pixel-bot-outline" d="M16 60h12v29H13V66z" />
          <path className="ai-pixel-bot-shell-shade" d="M18 63h7v23h-9V68z" />
          <rect className="ai-pixel-bot-detail-dark" x="17" y="69" width="7" height="3" />
          <rect className="ai-pixel-bot-status-dim" x="17" y="77" width="3" height="3" />
        </g>

        <g className="ai-pixel-bot-arm ai-pixel-bot-arm--left">
          <path className="ai-pixel-bot-outline" d="M15 61h12v9l-5 5v14H10V72l5-5z" />
          <path className="ai-pixel-bot-shell-mid" d="M17 64h7v5l-5 5v12h-6V73l4-4z" />
          <rect className="ai-pixel-bot-grip" x="9" y="86" width="14" height="7" />
          <rect className="ai-pixel-bot-grip-line" x="12" y="88" width="2" height="3" />
          <rect className="ai-pixel-bot-grip-line" x="18" y="88" width="2" height="3" />
        </g>

        <g className="ai-pixel-bot-arm ai-pixel-bot-arm--right">
          <path className="ai-pixel-bot-outline" d="M65 61h12l5 6v5h4v17H74V75l-5-5h-4z" />
          <path className="ai-pixel-bot-shell-mid" d="M68 64h7l4 4v5l4 1v12h-6V74l-5-5h-4z" />
          <rect className="ai-pixel-bot-grip" x="72" y="86" width="14" height="7" />
          <rect className="ai-pixel-bot-grip-line" x="75" y="88" width="2" height="3" />
          <rect className="ai-pixel-bot-grip-line" x="81" y="88" width="2" height="3" />
        </g>

        <g className="ai-pixel-bot-leg ai-pixel-bot-leg--left">
          <path className="ai-pixel-bot-outline" d="M27 84h17v15H24V89z" />
          <path className="ai-pixel-bot-shell-mid" d="M30 86h11v10H27v-6z" />
          <rect className="ai-pixel-bot-boot" x="21" y="96" width="23" height="6" />
          <rect className="ai-pixel-bot-sole" x="23" y="99" width="19" height="2" />
        </g>

        <g className="ai-pixel-bot-leg ai-pixel-bot-leg--right">
          <path className="ai-pixel-bot-outline" d="M48 84h17l3 5v10H48z" />
          <path className="ai-pixel-bot-shell-mid" d="M51 86h11l3 4v6H51z" />
          <rect className="ai-pixel-bot-boot" x="48" y="96" width="23" height="6" />
          <rect className="ai-pixel-bot-sole" x="50" y="99" width="19" height="2" />
        </g>

        <g className="ai-pixel-bot-body">
          <rect className="ai-pixel-bot-outline" x="39" y="58" width="14" height="9" />
          <rect className="ai-pixel-bot-shell-shade" x="42" y="59" width="8" height="8" />
          <path className="ai-pixel-bot-outline" d="M27 61h38l7 7v20l-7 7H27l-7-7V68z" />
          <path className="ai-pixel-bot-shell" d="M30 64h32l6 6v16l-6 6H30l-6-6V70z" />
          <path className="ai-pixel-bot-shell-light" d="M30 66h30l3 3H28z" />
          <path className="ai-pixel-bot-shell-shade" d="M25 85h42v2l-5 5H30l-5-5z" />
          <path className="ai-pixel-bot-panel-outline" d="M34 70h24l4 4v10l-4 4H34l-4-4V74z" />
          <rect className="ai-pixel-bot-chest-screen" x="35" y="75" width="22" height="8" />
          <g className="ai-pixel-bot-chest-pixels">
            <rect className="ai-pixel-bot-eye" x="39" y="77" width="3" height="3" />
            <rect className="ai-pixel-bot-eye" x="44" y="79" width="3" height="2" />
            <rect className="ai-pixel-bot-eye" x="50" y="79" width="4" height="2" />
          </g>
          <g className="ai-pixel-bot-close">
            <path className="ai-pixel-bot-close-line" d="m40 77 12 5m0-5-12 5" />
          </g>
          <rect className="ai-pixel-bot-status" x="62" y="73" width="3" height="3" />
          <rect className="ai-pixel-bot-status-dim" x="62" y="79" width="3" height="3" />
        </g>

        <g className="ai-pixel-bot-head">
          <path className="ai-pixel-bot-head-outline" d="M19 14h54l8 8v30l-8 9H19l-8-9V22z" />
          <path className="ai-pixel-bot-shell" d="M21 18h50l6 6v26l-6 7H21l-6-7V24z" />
          <path className="ai-pixel-bot-shell-light" d="M22 20h47l4 4H19z" />
          <path className="ai-pixel-bot-shell-shade" d="M16 49h60v2l-6 6H22l-6-6z" />
          <path className="ai-pixel-bot-screen-outline" d="M24 25h44l5 5v16l-5 5H24l-5-5V30z" />
          <path className="ai-pixel-bot-screen" d="M26 28h40l4 4v12l-4 4H26l-4-4V32z" />
          <rect className="ai-pixel-bot-screen-glint" x="26" y="30" width="31" height="2" />
          <rect className="ai-pixel-bot-scanline" x="25" y="37" width="42" height="1" />
          <g className="ai-pixel-bot-eyes">
            <rect className="ai-pixel-bot-eye" x="30" y="37" width="10" height="4" />
            <rect className="ai-pixel-bot-eye" x="52" y="37" width="10" height="4" />
          </g>
          <rect className="ai-pixel-bot-screen-mark" x="44" y="44" width="4" height="2" />
          <rect className="ai-pixel-bot-rivet" x="18" y="27" width="3" height="3" />
          <rect className="ai-pixel-bot-rivet" x="71" y="47" width="3" height="3" />
          <path className="ai-pixel-bot-shell-seam" d="M27 18v3h38v-3M15 35h3m56 0h3" />
        </g>
      </g>
    </svg>
  </button>
);

export default PixelBot;
