import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import chatHandler from "./api/chat";
import chatFeedbackHandler from "./api/chat-feedback";
import strikeTrackerHandler from "./api/strike-tracker";

const applyEnv = (key: string, value?: string) => {
  const trimmed = value?.trim();
  if (!process.env[key] && trimmed && trimmed !== "undefined") {
    process.env[key] = trimmed;
  }
};

const localApiPlugin = (mode: string): Plugin => ({
  name: "local-api",
  configureServer(server) {
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
          if (id.includes("mapbox-gl")) return "mapbox";
          if (id.includes("recharts")) return "charts";
          if (id.includes("@supabase")) return "supabase";
          return undefined;
        },
      },
    },
  },
}));
