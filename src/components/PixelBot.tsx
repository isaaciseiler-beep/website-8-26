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
      <ellipse className="ai-pixel-bot-aura" cx="50" cy="55" rx="44" ry="43" />
      <ellipse className="ai-pixel-bot-shadow" cx="50" cy="104" rx="27" ry="3.5" />

      <g className="ai-pixel-bot-rig">
        <g className="ai-pixel-bot-antenna">
          <path className="ai-pixel-bot-antenna-stem" d="M50 16V9.5" />
          <circle className="ai-pixel-bot-antenna-node" cx="50" cy="6" r="3.5" />
          <rect className="ai-pixel-bot-signal ai-pixel-bot-signal--one" x="43" y="2" width="2" height="2" rx="0.4" />
          <rect className="ai-pixel-bot-signal ai-pixel-bot-signal--two" x="55" y="1" width="3" height="3" rx="0.5" />
        </g>

        <g className="ai-pixel-bot-backpack">
          <rect className="ai-pixel-bot-outline" x="20" y="66" width="12" height="21" rx="6" />
          <rect className="ai-pixel-bot-shell-shade" x="22.5" y="68.5" width="7" height="16" rx="3.5" />
          <rect className="ai-pixel-bot-detail-dark" x="24" y="72" width="4" height="2" rx="1" />
        </g>

        <g className="ai-pixel-bot-arm ai-pixel-bot-arm--left">
          <rect className="ai-pixel-bot-outline" x="11" y="66" width="17" height="13" rx="6.5" transform="rotate(15 19.5 72.5)" />
          <rect className="ai-pixel-bot-shell-mid" x="14" y="68.5" width="12" height="8" rx="4" transform="rotate(15 20 72.5)" />
          <rect className="ai-pixel-bot-outline" x="8" y="76" width="12" height="15" rx="6" />
          <rect className="ai-pixel-bot-shell" x="10.5" y="78" width="7" height="10" rx="3.5" />
          <path className="ai-pixel-bot-hand-line" d="M11.5 83.5h5" />
        </g>

        <g className="ai-pixel-bot-arm ai-pixel-bot-arm--right">
          <rect className="ai-pixel-bot-outline" x="72" y="66" width="17" height="13" rx="6.5" transform="rotate(-15 80.5 72.5)" />
          <rect className="ai-pixel-bot-shell-mid" x="74" y="68.5" width="12" height="8" rx="4" transform="rotate(-15 80 72.5)" />
          <rect className="ai-pixel-bot-outline" x="80" y="76" width="12" height="15" rx="6" />
          <rect className="ai-pixel-bot-shell" x="82.5" y="78" width="7" height="10" rx="3.5" />
          <path className="ai-pixel-bot-hand-line" d="M83.5 83.5h5" />
        </g>

        <g className="ai-pixel-bot-leg ai-pixel-bot-leg--left">
          <rect className="ai-pixel-bot-outline" x="29" y="84" width="17" height="17" rx="7" />
          <rect className="ai-pixel-bot-shell-mid" x="32" y="85" width="11" height="12" rx="5" />
          <path className="ai-pixel-bot-boot" d="M27 96h19v7H27z" />
          <rect className="ai-pixel-bot-sole" x="29" y="100" width="15" height="2" rx="1" />
        </g>

        <g className="ai-pixel-bot-leg ai-pixel-bot-leg--right">
          <rect className="ai-pixel-bot-outline" x="54" y="84" width="17" height="17" rx="7" />
          <rect className="ai-pixel-bot-shell-mid" x="57" y="85" width="11" height="12" rx="5" />
          <path className="ai-pixel-bot-boot" d="M54 96h19v7H54z" />
          <rect className="ai-pixel-bot-sole" x="56" y="100" width="15" height="2" rx="1" />
        </g>

        <g className="ai-pixel-bot-body">
          <rect className="ai-pixel-bot-neck-outline" x="41" y="58" width="18" height="12" rx="5" />
          <rect className="ai-pixel-bot-neck" x="44" y="59" width="12" height="10" rx="4" />
          <path className="ai-pixel-bot-outline" d="M31 62.5Q50 57 69 62.5L76 70v15Q76 93 68 96H32q-8-3-8-11V70z" />
          <path className="ai-pixel-bot-shell" d="M32 65q18-5 36 0l5 7v13q0 6-6 8H33q-6-2-6-8V72z" />
          <path className="ai-pixel-bot-body-light" d="M32 67q18-4 34-.5l2 3q-17-3-38 .5z" />
          <path className="ai-pixel-bot-body-shade" d="M28 84q22 6 44 0v2q0 4-5 6H33q-5-2-5-6z" />
          <rect className="ai-pixel-bot-chest-outline" x="36" y="70" width="28" height="16" rx="6" />
          <rect className="ai-pixel-bot-chest-screen" x="39" y="73" width="22" height="10" rx="3.5" />
          <g className="ai-pixel-bot-chest-pixels">
            <rect className="ai-pixel-bot-eye" x="43" y="76" width="2.5" height="2.5" rx="0.4" />
            <rect className="ai-pixel-bot-eye" x="47" y="78.5" width="2.5" height="2" rx="0.4" />
            <rect className="ai-pixel-bot-eye" x="52" y="79" width="5" height="1.5" rx="0.5" />
          </g>
          <g className="ai-pixel-bot-close">
            <path className="ai-pixel-bot-close-line" d="m45 76 10 5m0-5-10 5" />
          </g>
          <circle className="ai-pixel-bot-status" cx="69" cy="78" r="1.5" />
        </g>

        <g className="ai-pixel-bot-head">
          <rect className="ai-pixel-bot-ear-outline" x="4" y="31" width="13" height="25" rx="6.5" />
          <rect className="ai-pixel-bot-shell-shade" x="7" y="34" width="8" height="19" rx="4" />
          <rect className="ai-pixel-bot-ear-detail" x="9" y="39" width="4" height="8" rx="2" />
          <rect className="ai-pixel-bot-ear-outline" x="83" y="31" width="13" height="25" rx="6.5" />
          <rect className="ai-pixel-bot-shell-shade" x="85" y="34" width="8" height="19" rx="4" />
          <rect className="ai-pixel-bot-ear-detail" x="87" y="39" width="4" height="8" rx="2" />

          <path className="ai-pixel-bot-head-outline" d="M27 14h46q18 0 18 18v20q0 19-19 19H28Q9 71 9 52V32q0-18 18-18z" />
          <path className="ai-pixel-bot-shell" d="M28 17h44q15 0 15 15v19q0 16-16 16H29q-16 0-16-16V32q0-15 15-15z" />
          <path className="ai-pixel-bot-head-light" d="M29 19h40q11 0 14 8-22-7-64 .5 3-8.5 10-8.5z" />
          <path className="ai-pixel-bot-head-shade" d="M14 52q36 13 72 0-1 12-15 13H29q-14-1-15-13z" />

          <rect className="ai-pixel-bot-screen-outline" x="16" y="24" width="68" height="39" rx="15" />
          <rect className="ai-pixel-bot-screen" x="19" y="27" width="62" height="33" rx="12" />
          <path className="ai-pixel-bot-screen-glint" d="M27 29h38q9 0 12 8-26-6-54 2 1-7 4-10z" />
          <rect className="ai-pixel-bot-pixel-accent" x="20" y="32" width="2" height="7" rx="0.5" />
          <rect className="ai-pixel-bot-pixel-accent" x="78" y="48" width="2" height="7" rx="0.5" />

          <g className="ai-pixel-bot-face-pixels">
            <g className="ai-pixel-bot-eyes">
              <path className="ai-pixel-bot-eye ai-pixel-bot-eye--left" d="M28 40h4v3h3v2h4v-2h3v-3h4v5h-3v3H32v-3h-4z" />
              <path className="ai-pixel-bot-eye ai-pixel-bot-eye--right" d="M54 40h4v3h3v2h4v-2h3v-3h4v5h-3v3H58v-3h-4z" />
            </g>
            <g className="ai-pixel-bot-mouth">
              <rect className="ai-pixel-bot-mouth-pixel" x="45" y="52" width="3" height="2" rx="0.4" />
              <rect className="ai-pixel-bot-mouth-pixel" x="49" y="53" width="3" height="2" rx="0.4" />
              <rect className="ai-pixel-bot-mouth-pixel" x="53" y="52" width="3" height="2" rx="0.4" />
            </g>
          </g>
          <circle className="ai-pixel-bot-cheek" cx="25" cy="51" r="1.5" />
          <circle className="ai-pixel-bot-cheek" cx="75" cy="51" r="1.5" />
          <path className="ai-pixel-bot-shell-seam" d="M29 17h42M13 43v8M87 43v8" />
        </g>
      </g>
    </svg>
  </button>
);

export default PixelBot;
