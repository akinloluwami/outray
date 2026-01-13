import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { auth } from "../../../lib/auth";
import { db } from "../../../db";
import { organizations } from "../../../db/auth-schema";
import { isReservedSlug } from "../../../../../../shared/reserved-slugs";

export const Route = createFileRoute("/api/organizations/check-slug")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { slug } = body;

        if (!slug) {
          return json({ error: "Slug is required" }, { status: 400 });
        }

        // Check if slug is reserved
        if (isReservedSlug(slug)) {
          return json({ available: false, reason: "reserved" });
        }

        const existingOrg = await db.query.organizations.findFirst({
          where: eq(organizations.slug, slug),
        });

        return json({ available: !existingOrg });
      },
    },
  },
});
