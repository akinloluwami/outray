import { IncomingMessage, ServerResponse } from "http";
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
    return `<!DOCTYPE html>
<html>
<head>
  <title>${tunnelId} is offline</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      background-color: #0a0a0a;
      color: #ededed;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 32px;
      letter-spacing: -0.5px;
    }
    .offline {
      color: #ef4444;
    }
    .card {
      background: #171717;
      border: 1px solid #262626;
      border-radius: 12px;
      padding: 24px;
      text-align: left;
      margin-bottom: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    h2 {
      font-size: 14px;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 8px;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    p {
      color: #a1a1aa;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
      margin-top: 0;
    }
    p:last-child {
      margin-bottom: 0;
    }
    .footer {
      color: #52525b;
      font-size: 13px;
      font-weight: 500;
    }
    a {
      color: #fff;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    a:hover {
      color: #d4d4d8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${tunnelId}.outray.dev is <span class="offline">offline</span></h1>
    
    <div class="card">
      <h2>If you're the developer of this page</h2>
      <p>Check out the <a href="https://outray.dev/docs" target="_blank">docs</a> to get help with this error.</p>
      
      <h2>If you're a visitor of this page</h2>
      <p>Wait a few minutes and refresh the page. If that still doesn't work, please contact the developer of this page for more information.</p>
    </div>

    <div class="footer">
      Powered by OutRay
    </div>
  </div>
</body>
</html>`;
  }
}
