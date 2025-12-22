import WebSocket from "ws";
import chalk from "chalk";
import prompts from "prompts";
import { encodeMessage, decodeMessage } from "./protocol";
import { TunnelDataMessage, TunnelResponseMessage } from "./types";
import http from "http";

export class OutRayClient {
  private ws: WebSocket | null = null;
  private localPort: number;
  private serverUrl: string;
  private apiKey?: string;
  private subdomain?: string;
  private requestedSubdomain?: string;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private assignedUrl: string | null = null;
  private subdomainConflictHandled = false;
  private forceTakeover = false;

  constructor(
    localPort: number,
    serverUrl: string = "wss://api.outray.dev/",
    apiKey?: string,
    subdomain?: string,
  ) {
    this.localPort = localPort;
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.subdomain = subdomain;
    this.requestedSubdomain = subdomain;
  }

  public start(): void {
    this.connect();
  }

  public stop(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPing();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private connect(): void {
    console.log(chalk.cyan("✨ Connecting to OutRay..."));

    this.ws = new WebSocket(this.serverUrl);

    this.ws.on("open", () => this.handleOpen());
    this.ws.on("message", (data) => this.handleMessage(data.toString()));
    this.ws.on("close", () => this.handleClose());
    this.ws.on("error", (error) => {
      console.log(chalk.red(`❌ WebSocket error: ${error.message}`));
    });
    this.ws.on("pong", () => {
      // Received pong, connection is alive
    });
  }

  private handleOpen(): void {
    console.log(chalk.green(`🔌 Linked to your local port ${this.localPort}`));
    this.startPing();

    const handshake = encodeMessage({
      type: "open_tunnel",
      apiKey: this.apiKey,
      subdomain: this.subdomain,
      forceTakeover: this.forceTakeover,
    });
    this.ws?.send(handshake);
  }

  private handleMessage(data: string): void {
    try {
      const message = decodeMessage(data);

      if (message.type === "tunnel_opened") {
        this.assignedUrl = message.url;
        const derivedSubdomain = this.extractSubdomain(message.url);
        if (derivedSubdomain) {
          this.subdomain = derivedSubdomain;
        }
        // Reset forceTakeover flag after successful connection
        // Keep subdomainConflictHandled to detect takeovers
        this.forceTakeover = false;
        console.log(chalk.magenta(`🌐 Tunnel ready: ${message.url}`));
        console.log(chalk.yellow("🥹 Don't close this or I'll cry softly."));
      } else if (message.type === "error") {
        if (message.code === "SUBDOMAIN_IN_USE") {
          if (this.assignedUrl) {
            // If we're reconnecting and the subdomain is in use, it's likely our own
            // zombie connection from the drop. Try to force takeover once.
            if (!this.forceTakeover) {
              console.log(
                chalk.dim(
                  "Subdomain in use during reconnection, attempting takeover...",
                ),
              );
              this.forceTakeover = true;
              return;
            }

            // We had a successful connection before, but now subdomain is taken
            // This means we were taken over by another tunnel
            console.log(
              chalk.yellow(
                `\n⚠️  Your tunnel was taken over by another connection.`,
              ),
            );
            console.log(
              chalk.dim(
                `   Subdomain "${this.subdomain}" is now in use elsewhere.`,
              ),
            );
            this.shouldReconnect = false;
            this.stop();
            process.exit(0);
          } else if (!this.subdomainConflictHandled) {
            // First time encountering this subdomain conflict
            this.subdomainConflictHandled = true;
            this.shouldReconnect = false;
            this.handleSubdomainConflict();
          } else {
            // Subdomain conflict but we already handled it, just log
            console.log(chalk.red(`❌ Error: ${message.message}`));
          }
        } else if (message.code === "AUTH_FAILED") {
          console.log(chalk.red(`❌ Error: ${message.message}`));
          this.shouldReconnect = false;
          this.stop();
          process.exit(1);
        } else {
          console.log(chalk.red(`❌ Error: ${message.message}`));
        }
      } else if (message.type === "request") {
        this.handleTunnelData(message);
      }
    } catch (error) {
      console.log(chalk.red(`❌ Failed to parse message: ${error}`));
    }
  }

  private handleTunnelData(message: TunnelDataMessage): void {
    const reqOptions = {
      hostname: "localhost",
      port: this.localPort,
      path: message.path,
      method: message.method,
      headers: message.headers,
    };

    const req = http.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];

      res.on("data", (chunk) => {
        chunks.push(Buffer.from(chunk));
      });

      res.on("end", () => {
        const bodyBuffer = Buffer.concat(chunks);
        const bodyBase64 =
          bodyBuffer.length > 0 ? bodyBuffer.toString("base64") : undefined;

        const response: TunnelResponseMessage = {
          type: "response",
          requestId: message.requestId,
          statusCode: res.statusCode || 200,
          headers: res.headers as any,
          body: bodyBase64,
        };

        this.ws?.send(encodeMessage(response));
      });
    });

    req.on("error", (err) => {
      const errorResponse: TunnelResponseMessage = {
        type: "response",
        requestId: message.requestId,
        statusCode: 502,
        headers: { "content-type": "text/plain" },
        body: Buffer.from(`Bad Gateway: ${err.message}`).toString("base64"),
      };

      this.ws?.send(encodeMessage(errorResponse));
    });

    if (message.body) {
      const bodyBuffer = Buffer.from(message.body, "base64");
      req.write(bodyBuffer);
    }

    req.end();
  }

  private extractSubdomain(url: string): string | null {
    try {
      const hostname = new URL(url).hostname;
      const [subdomain] = hostname.split(".");
      return subdomain || null;
    } catch (error) {
      console.warn(
        chalk.yellow(
          `⚠️  Unable to determine tunnel subdomain from url '${url}': ${error}`,
        ),
      );
      return null;
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private async handleSubdomainConflict(): Promise<void> {
    console.log(
      chalk.yellow(
        `\n⚠️  Subdomain "${this.requestedSubdomain}" is currently in use.`,
      ),
    );

    const response = await prompts({
      type: "select",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { title: "Take over the existing tunnel", value: "takeover" },
        { title: "Use a random subdomain instead", value: "random" },
        { title: "Exit", value: "exit" },
      ],
      initial: 0,
    });

    if (response.action === "takeover") {
      console.log(chalk.cyan("🔄 Taking over the existing tunnel..."));
      this.subdomain = this.requestedSubdomain;
      this.shouldReconnect = true;
      this.forceTakeover = true;
      this.connect();
    } else if (response.action === "random") {
      console.log(chalk.cyan("🎲 Opening tunnel with a random subdomain..."));
      this.subdomain = undefined;
      this.shouldReconnect = true;
      this.forceTakeover = false;
      this.connect();
    } else {
      console.log(chalk.cyan("👋 Goodbye!"));
      this.stop();
      process.exit(0);
    }
  }

  private handleClose(): void {
    this.stopPing();
    if (!this.shouldReconnect) return;

    console.log(chalk.yellow("😵 Disconnected from OutRay. Retrying in 2s…"));

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 2000);
  }
}
