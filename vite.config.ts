import { writingIndexMarkdown } from "./src/lib/writing.mjs";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "node:fs";
import { componentTagger } from "lovable-tagger";
import chatHandler from "./api/chat";
import intentHandler from "./api/intent";
import composeHandler from "./api/compose";
import publicHandler, { markdown } from "./api/public-content";
import mcpHandler from "./api/mcp";
import { llmsText } from "./api/public-content";
import chatFeedbackHandler from "./api/chat-feedback";
import strikeTrackerHandler from "./api/strike-tracker";
import { topLevelPages, projectPriorityOrder } from "./scripts/seo-data.mjs";

const applyEnv = (key: string, value?: string) => {
  const trimmed = value?.trim();
  if (!process.env[key] && trimmed && trimmed !== "undefined") {
    process.env[key] = trimmed;
  }
};

const localApiPlugin = (mode: string): Plugin => ({
  name: "local-api",
  configurePreviewServer(server) {
    const routes = new Set([...topLevelPages.map(page => page.path), ...projectPriorityOrder.map(id => `/projects/${id}`), "/agents"]);
    server.middlewares.use((request, response, next) => {
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname.replace(/\/+$/, "") || "/";
      if (!routes.has(pathname) || !["GET", "HEAD"].includes(request.method ?? "GET")) return next();
      const file = path.join(server.config.root, server.config.build.outDir, pathname === "/" ? "index.html" : `${pathname}/index.html`);
      if (!fs.existsSync(file)) return next();
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(request.method === "HEAD" ? "" : fs.readFileSync(file));
    });
  },
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url ?? "/", "http://localhost");
      if (url.pathname === "/api/compose") {
        const env = loadEnv(mode, process.cwd(), "");
        for (const key of ["MISTRAL_API_KEY", "MISTRAL_MODEL", "COMPOSE_DAILY_CALL_LIMIT"]) applyEnv(key, env[key]);
        void composeHandler(request, response); return;
      }
      if (url.pathname === "/api/intent") {
        const env = loadEnv(mode, process.cwd(), "");
        for (const key of ["TYPESAFE_API_KEY", "JEV_MODEL", "INTENT_DAILY_CALL_LIMIT"]) applyEnv(key, env[key]);
        void intentHandler(request, response); return;
      }
      if (url.pathname.startsWith("/api/public/")) { publicHandler(request, response); return; }
      if (url.pathname === "/mcp") { void mcpHandler(request,response); return; }
      if (url.pathname === "/llms.txt") {
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.end(llmsText()); return;
      }
      if (url.pathname.startsWith("/src/")) return next();
      const explicit = url.pathname.endsWith(".md");
      const accept = (request.headers.accept ?? "").split(",").map(part => { const [mime,...options]=part.trim().split(";"); const quality = options.find(o=>o.trim().startsWith("q=")); return {mime,q:quality?Number(quality.trim().slice(2)):1}; });
      const mdQ = accept.find(a => a.mime === "text/markdown")?.q ?? 0;
      const htmlQ = accept.find(a => a.mime === "text/html")?.q ?? 0;
      if (explicit || mdQ > htmlQ) {
        const contentPath = explicit ? url.pathname.slice(0,-3) : url.pathname;
        const content = contentPath === "/writing" ? writingIndexMarkdown : markdown(contentPath);
        response.setHeader("Vary", "Accept"); response.setHeader("Cache-Control", "no-store");
        response.statusCode=content?200:404;response.setHeader("Content-Type","text/markdown; charset=utf-8");response.end(content ?? "# Not found");return;
      }
      next();
    });
    server.middlewares.use("/api/chat-feedback", (request, response) => {
      const env = loadEnv(mode, process.cwd(), "");
      applyEnv("SUPABASE_URL", env.SUPABASE_URL);
      applyEnv("SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY);
      applyEnv("ASSISTANT_STORE_CONTENT", env.ASSISTANT_STORE_CONTENT);
      void chatFeedbackHandler(request, response);
    });
    server.middlewares.use("/api/chat", (request, response) => {
      const env = loadEnv(mode, process.cwd(), "");
      applyEnv("OPENAI_API", env.OPENAI_API);
      applyEnv("OPENAI_API_KEY", env.OPENAI_API_KEY);
      applyEnv("OPENAI_CHAT_MODEL", env.OPENAI_CHAT_MODEL);
      applyEnv("OPENAI_REASONING_EFFORT", env.OPENAI_REASONING_EFFORT);
      applyEnv("OPENAI_VERIFIER_MODEL", env.OPENAI_VERIFIER_MODEL);
      applyEnv("OPENAI_VERIFIER_EFFORT", env.OPENAI_VERIFIER_EFFORT);
      applyEnv("OPENAI_ASSISTANT_VERIFY", env.OPENAI_ASSISTANT_VERIFY);
      applyEnv("OPENAI_EMBEDDING_MODEL", env.OPENAI_EMBEDDING_MODEL);
      applyEnv("OPENAI_EMBEDDING_DIMENSIONS", env.OPENAI_EMBEDDING_DIMENSIONS);
      void chatHandler(request, response);
    });
    server.middlewares.use("/api/strike-tracker", (request, response) => {
      const env = loadEnv(mode, process.cwd(), "");
      applyEnv("STRIKE_TRACKER_ACCESS_CODE", env.STRIKE_TRACKER_ACCESS_CODE);
      applyEnv("SUPABASE_URL", env.SUPABASE_URL);
      applyEnv("SUPABASE_ANON_KEY", env.SUPABASE_ANON_KEY);
      applyEnv("SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY);
      applyEnv("VITE_SUPABASE_URL", env.VITE_SUPABASE_URL);
      applyEnv("VITE_SUPABASE_ANON_KEY", env.VITE_SUPABASE_ANON_KEY);
      void strikeTrackerHandler(request, response);
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  envPrefix: ["VITE_", "NEXT_PUBLIC_", "MAPBOX_"],
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [localApiPlugin(mode), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (
            id.includes("/react/")
            || id.includes("/react-dom/")
            || id.includes("/scheduler/")
          ) return "react-vendor";
          if (id.includes("mapbox-gl")) return "mapbox";
          if (id.includes("recharts")) return "charts";
          if (id.includes("@supabase")) return "supabase";
          return undefined;
        },
      },
    },
  },
}));
