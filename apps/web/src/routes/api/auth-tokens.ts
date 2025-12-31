import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq, and } from "drizzle-orm";

import { randomBytes } from "crypto";
import { auth } from "../../lib/auth";
import { db } from "../../db";
import { authTokens } from "../../db/app-schema";

export const Route = createFileRoute("/api/auth-tokens")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const organizationId = url.searchParams.get("organizationId");

        if (!organizationId) {
          return json({ error: "Organization ID required" }, { status: 400 });
        }

        const organizations = await auth.api.listOrganizations({
          headers: request.headers,
        });

        const hasAccess = organizations.find(
          (org) => org.id === organizationId,
        );

        if (!hasAccess) {
          return json({ error: "Unauthorized" }, { status: 403 });
        }

        const tokens = await db
          .select()
          .from(authTokens)
          .where(eq(authTokens.organizationId, organizationId));

        return json({ tokens });
      },
      POST: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, organizationId } = body;

        if (!name || !organizationId) {
          return json(
            { error: "Name and Organization ID required" },
            { status: 400 },
          );
        }

        const organizations = await auth.api.listOrganizations({
          headers: request.headers,
        });

        const hasAccess = organizations.find(
          (org) => org.id === organizationId,
        );

        if (!hasAccess) {
          return json({ error: "Unauthorized" }, { status: 403 });
        }

        const token = `outray_${randomBytes(32).toString("hex")}`;

        const [newToken] = await db
          .insert(authTokens)
          .values({
            id: crypto.randomUUID(),
            name,
            token,
            organizationId,
            userId: session.user.id,
          })
          .returning();

        return json({ token: newToken });
      },
      DELETE: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, organizationId } = body;

        if (!id || !organizationId) {
          return json(
            { error: "Token ID and Organization ID required" },
            { status: 400 },
          );
        }

        const organizations = await auth.api.listOrganizations({
          headers: request.headers,
        });

        const hasAccess = organizations.find(
          (org) => org.id === organizationId,
        );

        if (!hasAccess) {
          return json({ error: "Unauthorized" }, { status: 403 });
        }

        await db
          .delete(authTokens)
          .where(
            and(
              eq(authTokens.id, id),
              eq(authTokens.organizationId, organizationId),
            ),
          );

        return json({ success: true });
      },
    },
  },
});
