import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { portfolioSectionQuestions } from '../evals/portfolio-section-cases.mjs';
import { evaluateAuthored, evaluateDeployment, evaluationOptions } from './portfolio-evaluation.mjs';

const help = `Portfolio evaluation

Default: offline authored routing, no network or model calls.
  npm run eval:portfolio
  npm run eval:portfolio -- --corpus=sections

After deployment, one explicitly authorized live case (may also call optional Jev):
  PORTFOLIO_EVAL_MODE=live PORTFOLIO_EVAL_ALLOW_MODEL_CALLS=1 PORTFOLIO_EVAL_URL=https://seiler.page npm run eval:portfolio -- --corpus=sections

Run all 32 live section cases deliberately:
  PORTFOLIO_EVAL_MODE=live PORTFOLIO_EVAL_ALLOW_MODEL_CALLS=1 PORTFOLIO_EVAL_URL=https://seiler.page PORTFOLIO_EVAL_LIMIT=32 npm run eval:portfolio -- --corpus=sections

Options (environment variables):
  PORTFOLIO_EVAL_CORPUS=routing|sections (default routing)
  PORTFOLIO_EVAL_LIMIT (offline: full corpus; live: 1; 0 makes no model requests)
  PORTFOLIO_EVAL_COMPOSE_LIMIT (live: selected cases)
  PORTFOLIO_EVAL_MAX_POST_REQUESTS (live: twice selected cases)
  PORTFOLIO_EVAL_INTERVAL_MS (live: 6000, offline: 0)
  PORTFOLIO_EVAL_TIMEOUT_MS (default 25000 per HTTP request)
  PORTFOLIO_REQUIRE_LIVE=1 (also requires the explicit model-call opt-in; cached or authored responses do not satisfy fresh execution)
  PORTFOLIO_EVAL_OUTPUT=/path/to/report.json (optional; stdout always contains JSON)

POST budgets count endpoints, not upstream calls: /intent may call Jev and /compose may call both Mistral and optional Jev advice. No automatic retries.
Configuration GETs are not counted as provider health or execution evidence.
`;

async function main() {
  const env = { ...process.env };
  for (const argument of process.argv.slice(2)) {
    if (argument === '--help' || argument === '-h') { console.log(help); return; }
    if (argument.startsWith('--corpus=')) env.PORTFOLIO_EVAL_CORPUS = argument.slice('--corpus='.length);
    else throw new Error('Unknown option. Use --help for supported options.');
  }
  const corpus = env.PORTFOLIO_EVAL_CORPUS || 'routing';
  if (!['routing', 'sections'].includes(corpus)) throw new Error('PORTFOLIO_EVAL_CORPUS must be routing or sections.');
  const cases = corpus === 'sections' ? portfolioSectionQuestions : JSON.parse(fs.readFileSync(new URL('../evals/portfolio-cases.json', import.meta.url), 'utf8'));
  const options = evaluationOptions(env, cases.length);
  // Load the site's actual pure planning functions without starting HTTP/HMR,
  // loading environment files, or importing any API/provider implementations.
  const root = fileURLToPath(new URL('../', import.meta.url));
  const server = await createServer({ root, configFile: false, envFile: false, appType: 'custom', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, logLevel: 'error' });
  try {
    const canvas = await server.ssrLoadModule('/src/lib/canvas.ts');
    const genui = await server.ssrLoadModule('/src/lib/genui.ts');
    const runtime = {
      contentVersion: canvas.CONTENT_VERSION,
      plan: (question, revision) => genui.resolveCanvasPlan(question, canvas.initialPlan(), revision),
      compose: (question, revision) => genui.composeLocal(question, genui.resolveCanvasPlan(question, canvas.initialPlan(), revision)),
      guidance: question => genui.explorationGuidance(question),
      validate: value => genui.validateComposition(value),
    };
    const result = options.mode === 'live' ? await evaluateDeployment(cases, runtime, options) : evaluateAuthored(cases, runtime, options);
    const report = { corpus, capturedAt: new Date().toISOString(), ...result };
    const json = JSON.stringify(report, null, 2) + '\n';
    if (env.PORTFOLIO_EVAL_OUTPUT) {
      const destination = path.resolve(env.PORTFOLIO_EVAL_OUTPUT);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, json);
    }
    console.log(json);
    if (report.failed || report.error || report.skipped) process.exitCode = 1;
  } finally { await server.close(); }
}

main().catch(error => { console.error(`Portfolio evaluation: ${error instanceof Error ? error.message : 'Evaluation failed'}`); process.exitCode = 1; });
