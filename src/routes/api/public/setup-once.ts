import { createFileRoute } from "@tanstack/react-router";
import { provisionInitialAccounts } from "@/lib/auth.functions";

export const Route = createFileRoute("/api/public/setup-once")({
  server: {
    handlers: {
      POST: async () => Response.json(await provisionInitialAccounts()),
    },
  },
});
