import type { Application, Request, Response, NextFunction } from "express";
import { OutrayClient } from "@outray/core";
import type { OutrayPluginOptions } from "./types";
import type { Server } from "http";

const DEFAULT_SERVER_URL = "wss://api.outray.dev/";

let client: OutrayClient | null = null;

/**
 * Express middleware that automatically starts an Outray tunnel when the server starts.
 *
 * @example
 * ```ts
 * // Basic usage
 * import express from 'express'
 * import outray from '@outray/express'
 *
 * const app = express()
 *
 * // Apply middleware
 * outray(app)
 *
 * app.listen(3000, () => {
 *   console.log('Server running on port 3000')
 * })
 * ```
 *
 * @example
 * ```ts
 * // With options
 * import express from 'express'
 * import outray from '@outray/express'
 *
 * const app = express()
 *
 * outray(app, {
 *   subdomain: 'my-app',
 *   apiKey: process.env.OUTRAY_API_KEY,
 *   onTunnelReady: (url) => {
 *     console.log('Tunnel ready at:', url)
 *   }
 * })
 *
 * app.listen(3000)
 * ```
 */
export default function outray(
  app: Application,
  options: OutrayPluginOptions = {}
): void {
  const {
    enabled = process.env.OUTRAY_ENABLED !== "false",
    silent = false,
  } = options;

  // Only run in development
  if (process.env.NODE_ENV !== "development" || !enabled) {
    return;
  }

  // Hook into server listen
  const originalListen = app.listen.bind(app);
  
  app.listen = function (this: Application, ...args: any[]): Server {
    const server = originalListen(...args) as Server;

    server.once("listening", () => {
      const address = server.address();

      if (!address) {
        if (!silent) {
          console.log(
            `  \x1b[33m○\x1b[0m  Outray: Could not determine server address; tunnel will not be started`
          );
        }
        return;
      }

      if (typeof address === "string") {
        if (!silent) {
          console.log(
            `  \x1b[33m○\x1b[0m  Outray: Server is listening on a pipe or Unix domain socket ("${address}"); tunnel only works with TCP ports`
          );
        }
        return;
      }

      const port = address.port;
      const apiKey = options.apiKey ?? process.env.OUTRAY_API_KEY;
      const subdomain = options.subdomain ?? process.env.OUTRAY_SUBDOMAIN;
      const serverUrl =
        options.serverUrl ??
        process.env.OUTRAY_SERVER_URL ??
        DEFAULT_SERVER_URL;

      client = new OutrayClient({
        localPort: port,
        serverUrl,
        apiKey,
        subdomain,
        customDomain: options.customDomain,
        onTunnelReady: (url) => {
          if (!silent) {
            const colorUrl = `\x1b[36m${url}\x1b[0m`;
            console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mTunnel:\x1b[0m  ${colorUrl}`);
          }
          options.onTunnelReady?.(url);
        },
        onError: (error) => {
          if (!silent) {
            console.error(`  \x1b[31m✗\x1b[0m  Outray: ${error.message}`);
          }
          options.onError?.(error);
        },
        onReconnecting: (attempt, delay) => {
          if (!silent) {
            console.log(
              `  \x1b[33m⟳\x1b[0m  Outray: Reconnecting in ${Math.round(delay / 1000)}s...`
            );
          }
          options.onReconnecting?.();
        },
        onClose: () => {
          if (!silent) {
            console.log(`  \x1b[33m○\x1b[0m  Outray: Tunnel closed`);
          }
          options.onClose?.();
        },
      });

      client.start();
    });

    // Cleanup when server closes
    server.once("close", () => {
      if (client) {
        client.stop();
        client = null;
      }
    });

    // Cleanup on process exit
    const cleanup = () => {
      if (client) {
        client.stop();
        client = null;
      }
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("exit", cleanup);

    return server;
  };
}

// Named exports for better tree-shaking
export { outray };
export type { OutrayPluginOptions };
