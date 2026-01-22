import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../../db";
import { tunnels } from "../../../db/app-schema";
import { subscriptions } from "../../../db/subscription-schema";
import { getPlanLimits } from "../../../lib/subscription-plans";
import { redis } from "../../../lib/redis";
import {rateLimiters, getClientIdentifier, createRateLimitResponse,} from "../../../lib/rate-limiter";

export const Route = createFileRoute("/api/tunnel/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Rate limit: 20 requests per minute per IP
          const clientId = getClientIdentifier(request);
          const rateLimitResult = await rateLimiters.tunnelRegister(clientId);

          if (!rateLimitResult.allowed) {
            return createRateLimitResponse(rateLimitResult);
          }

          const body = (await request.json()) as {
            userId?: string;
            organizationId?: string;
            url?: string;
            protocol?: "http" | "tcp" | "udp";
            remotePort?: number;
            tunnelId?: string;
            name?: string;
          };

          const {
            userId,
            organizationId,
            url,
            protocol = "http",
            remotePort,
            tunnelId: providedTunnelId,
            name,
          } = body;

          if (!userId || !organizationId) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
          }

          // For all protocols, we need url
          if (!url) {
            return Response.json({ error: "Missing URL for tunnel" }, { status: 400 });
          }

          // For TCP/UDP, we also need tunnelId and remotePort
          if (
            (protocol === "tcp" || protocol === "udp") &&
            (!providedTunnelId || !remotePort)
          ) {
            return Response.json(
              { error: "Missing tunnelId or remotePort for TCP/UDP tunnel" },
              { status: 400 },
            );
          }

          // Get the tunnel ID from the URL (hostname) for HTTP, or use provided for TCP/UDP
          let tunnelId: string;
          if (protocol === "http") {
            const urlObj = new URL(
              url!.startsWith("http") ? url! : `https://${url}`,
            );
            tunnelId = urlObj.hostname;
          } else {
            tunnelId = providedTunnelId!;
          }

          // Use the URL passed from the tunnel server
          const tunnelUrl = url;
          const setKey = `org:${organizationId}:online_tunnels`;
          let addedToRedis = false;

          try {
            // Use a transaction with row-level locking to prevent race conditions
            const result = await db.transaction(async (tx) => {
              // Lock the organization's subscription row to serialize concurrent requests
              const [subscription] = await tx
                .select()
                .from(subscriptions)
                .where(eq(subscriptions.organizationId, organizationId))
                .for("update");

              const currentPlan = subscription?.plan || "free";
              const planLimits = getPlanLimits(currentPlan as any);
              const tunnelLimit = planLimits.maxTunnels;

              // Check if tunnel already exists in database (with lock)
              const [existingTunnel] = await tx
                .select()
                .from(tunnels)
                .where(eq(tunnels.url, tunnelUrl))
                .for("update");

              const isReconnection = !!existingTunnel;

              console.log(
                `[TUNNEL LIMIT CHECK] Org: ${organizationId}, Tunnel: ${tunnelId}`,
              );
              console.log(
                `[TUNNEL LIMIT CHECK] Is Reconnection: ${isReconnection}`,
              );
              console.log(
                `[TUNNEL LIMIT CHECK] Plan: ${currentPlan}, Limit: ${tunnelLimit}`,
              );

              // Check limits only for NEW tunnels (not reconnections)
              if (!isReconnection) {
                // Use Lua script for atomic check-and-add to prevent race conditions
                // This ensures that counting and adding happen atomically
                const luaScript = `
                  local setKey = KEYS[1]
                  local tunnelId = ARGV[1]
                  local limit = tonumber(ARGV[2])
                  
                  -- Check if already in set (idempotent)
                  if redis.call('SISMEMBER', setKey, tunnelId) == 1 then
                    return 1  -- Already exists, allow
                  end
                  
                  -- Check current count
                  local currentCount = redis.call('SCARD', setKey)
                  if limit ~= -1 and currentCount >= limit then
                    return 0  -- Limit reached, reject
                  end
                  
                  -- Add to set
                  redis.call('SADD', setKey, tunnelId)
                  return 1  -- Success
                `;

                const allowed = await redis.eval(
                  luaScript,
                  1,
                  setKey,
                  tunnelId,
                  tunnelLimit.toString()
                );

                console.log(
                  `[TUNNEL LIMIT CHECK] Lua script result: ${allowed}`,
                );

                if (allowed === 0) {
                  console.log(
                    `[TUNNEL LIMIT CHECK] REJECTED - Limit ${tunnelLimit} reached`,
                  );
                  return {
                    error: `Tunnel limit reached. The ${currentPlan} plan allows ${tunnelLimit} active tunnel${tunnelLimit > 1 ? "s" : ""}.`,
                    status: 403,
                  };
                }

                // Mark that we added to Redis so we can rollback on error
                addedToRedis = true;
                console.log(
                  `[TUNNEL LIMIT CHECK] ALLOWED`,
                );
              } else {
                console.log(`[TUNNEL LIMIT CHECK] SKIPPED - Reconnection detected`);
              }

              if (existingTunnel) {
                // Tunnel with this URL already exists, update lastSeenAt
                await tx
                  .update(tunnels)
                  .set({ lastSeenAt: new Date() })
                  .where(eq(tunnels.id, existingTunnel.id));

                return { success: true, tunnelId: existingTunnel.id };
              }

              // Create new tunnel record
              const tunnelRecord = {
                id: randomUUID(),
                url: tunnelUrl,
                userId,
                organizationId,
                name: name || null,
                protocol,
                remotePort: remotePort || null,
                lastSeenAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              await tx.insert(tunnels).values(tunnelRecord);

              return { success: true, tunnelId: tunnelRecord.id };
            });

            if ("error" in result) {
              // Limit error - rollback Redis if needed
              if (addedToRedis) {
                await redis.srem(setKey, tunnelId);
              }
              return Response.json({ error: result.error }, { status: result.status });
            }

            return Response.json({ success: true, tunnelId: result.tunnelId });
          } catch (error) {
            // Database error - rollback Redis if we added the tunnel
            if (addedToRedis) {
              await redis.srem(setKey, tunnelId);
              console.log(`[TUNNEL LIMIT CHECK] Rolled back Redis entry due to error`);
            }
            // Log the actual error for debugging
            console.error("[TUNNEL REGISTRATION] Transaction error:", error);
            
            // Check for deadlock or lock timeout - could retry
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes("deadlock") || errorMessage.includes("lock")) {
              return Response.json(
                { error: "Server busy, please retry" },
                { status: 503 }
              );
            }
            throw error;
          }
        } catch (error) {
          console.error("Tunnel registration error:", error);
          return Response.json({ error: "Internal server error" }, { status: 500 });
        }
      },
    },
  },
});
