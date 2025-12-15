import { createClient } from "@clickhouse/client";
import { config } from "../config";

export const clickhouse = createClient({
  url: config.clickhouse.url,
  username: config.clickhouse.user,
  password: config.clickhouse.password,
  database: config.clickhouse.database,
});

export interface TunnelEvent {
  timestamp: number;
  tunnel_id: string;
  organization_id: string;
  host: string;
  method: string;
  path: string;
  status_code: number;
  latency_ms: number;
  bytes_in: number;
  bytes_out: number;
  client_ip: string;
  user_agent: string;
}

export async function checkClickHouseConnection(): Promise<boolean> {
  try {
    await clickhouse.ping();
    console.log("✅ Connected to ClickHouse");
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to ClickHouse:", error);
    return false;
  }
}

class ClickHouseLogger {
  private buffer: TunnelEvent[] = [];
  private flushInterval: NodeJS.Timeout;
  private readonly BATCH_SIZE = 1000;
  private readonly FLUSH_INTERVAL_MS = 5000;

  constructor() {
    this.flushInterval = setInterval(() => {
      void this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  public log(event: TunnelEvent) {
    this.buffer.push(event);
    if (this.buffer.length >= this.BATCH_SIZE) {
      void this.flush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    try {
      await clickhouse.insert({
        table: "tunnel_events",
        values: events,
        format: "JSONEachRow",
      });
    } catch (error) {
      console.error("Failed to flush events to ClickHouse:", error);
      // Optionally re-queue events or drop them to avoid memory leaks
      // For now, we drop them to prioritize service stability
    }
  }

  public async shutdown() {
    clearInterval(this.flushInterval);
    await this.flush();
    await clickhouse.close();
  }
}

export const logger = new ClickHouseLogger();
