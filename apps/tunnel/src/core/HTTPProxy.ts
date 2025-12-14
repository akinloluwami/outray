import { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";
import { TunnelRouter } from "./TunnelRouter";
import { extractSubdomain } from "../../../../shared/utils";

export class HTTPProxy {
  private router: TunnelRouter;
  private baseDomain: string;

  constructor(router: TunnelRouter, baseDomain: string) {
    this.router = router;
    this.baseDomain = baseDomain;
  }

  async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const host = req.headers.host || "";
    const tunnelId = extractSubdomain(host, this.baseDomain);

    if (!tunnelId) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Tunnel not found");
      return;
    }

    try {
      const headers: Record<string, string | string[]> = {};
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          headers[key] = value;
        }
      });

      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.from(chunk));
      }
      const bodyBuffer = Buffer.concat(chunks);
      const bodyBase64 =
        bodyBuffer.length > 0 ? bodyBuffer.toString("base64") : undefined;

      const response = await this.router.forwardRequest(
        tunnelId,
        req.method || "GET",
        req.url || "/",
        headers,
        bodyBase64,
      );

      res.writeHead(response.statusCode, response.headers);

      if (response.body) {
        const responseBuffer = Buffer.from(response.body, "base64");
        res.end(responseBuffer);
      } else {
        res.end();
      }
    } catch (error) {
      console.error("Proxy error:", error);
      res.writeHead(502, { "Content-Type": "text/html" });
      res.end(this.getOfflineHtml(tunnelId));
    }
  }

  private getOfflineHtml(tunnelId: string): string {
    try {
      const paths = [
        path.join(__dirname, "../offline.html"), // Dev: src/core/../offline.html -> src/offline.html
        path.join(__dirname, "offline.html"), // Prod: dist/offline.html
        path.join(process.cwd(), "src/offline.html"), // Fallback
      ];

      let template = "";
      for (const p of paths) {
        if (fs.existsSync(p)) {
          template = fs.readFileSync(p, "utf-8");
          break;
        }
      }

      if (!template) {
        return `<h1>${tunnelId} is offline</h1>`;
      }

      return template.replace("{{TUNNEL_ID}}", tunnelId);
    } catch (error) {
      console.error("Failed to load offline page template", error);
      return `<h1>${tunnelId} is offline</h1>`;
    }
  }
}
