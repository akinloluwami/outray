import { createFileRoute } from "@tanstack/react-router";
import { db } from "../../../db";
import { subscriptions } from "../../../db/subscription-schema";
import { eq } from "drizzle-orm";
import { auth } from "../../../lib/auth";

export const Route = createFileRoute("/api/subscriptions/$organizationId")({
  server: {
    handlers: {
      GET: async ({
        request,
        params,
      }: {
        request: Request;
        params: { organizationId: string };
      }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
          });
        }

        const { organizationId } = params;

        try {
          // Get subscription
          const [subscription] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.organizationId, organizationId))
            .limit(1);

          return new Response(
            JSON.stringify({
              subscription: subscription || null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          console.error("Error fetching subscription:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch subscription" }),
            { status: 500 },
          );
        }
      },
    },
  },
});
