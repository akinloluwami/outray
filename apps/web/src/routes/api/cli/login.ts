import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { db } from "../../../db";
import { cliLoginSessions } from "../../../db/auth-schema";
import { randomUUID, randomBytes } from "crypto";

export const Route = createFileRoute("/api/cli/login")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const code = randomBytes(32).toString("hex");
          const id = randomUUID();

          const expiresAt = new Date();
          expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute expiry

          await db.insert(cliLoginSessions).values({
            id,
            code,
            status: "pending",
            expiresAt,
          });

          const baseUrl =
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : "https://outray.dev";

          return json({
            loginUrl: `${baseUrl}/cli/login?code=${code}`,
            code,
            expiresIn: 300,
          });
        } catch (error) {
          console.error("CLI login error:", error);
          return json(
            { error: "Failed to create login session" },
            { status: 500 },
          );
        }
      },
    },
  },
});
