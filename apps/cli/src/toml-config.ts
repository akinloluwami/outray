import fs from "fs";
import path from "path";
import TOML from "@iarna/toml";

export type TunnelProtocol = "http" | "tcp" | "udp";

export interface TunnelConfig {
  protocol: TunnelProtocol;
  local_port: number;
  local_host?: string;
  subdomain?: string;
  custom_domain?: string;
  remote_port?: number;
  org?: string;
}

export interface GlobalConfig {
  org?: string;
  server_url?: string;
}

export interface OutRayTomlConfig {
  global?: GlobalConfig;
  tunnel?: Record<string, TunnelConfig>;
}

export interface ParsedTunnelConfig {
  name: string;
  protocol: TunnelProtocol;
  localPort: number;
  localHost: string;
  subdomain?: string;
  customDomain?: string;
  remotePort?: number;
  org?: string;
  serverUrl?: string;
}

export class TomlConfigParser {
  static loadTomlConfig(configPath: string): {
    tunnels: ParsedTunnelConfig[];
    global?: GlobalConfig;
  } {
    const fullPath = path.resolve(configPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Config file not found: ${fullPath}`);
    }

    const fileContent = fs.readFileSync(fullPath, "utf-8");
    let config: OutRayTomlConfig;

    try {
      config = TOML.parse(fileContent) as OutRayTomlConfig;
    } catch (error) {
      throw new Error(
        `Failed to parse TOML config: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    if (!config.tunnel || Object.keys(config.tunnel).length === 0) {
      throw new Error("No tunnels defined in config file");
    }

    const tunnels: ParsedTunnelConfig[] = [];
    const globalConfig = config.global;

    for (const [name, tunnelConfig] of Object.entries(config.tunnel)) {
      this.validateTunnelConfig(name, tunnelConfig);

      tunnels.push({
        name,
        protocol: tunnelConfig.protocol,
        localPort: tunnelConfig.local_port,
        localHost: tunnelConfig.local_host || "localhost",
        subdomain: tunnelConfig.subdomain,
        customDomain: tunnelConfig.custom_domain,
        remotePort: tunnelConfig.remote_port,
        org: tunnelConfig.org || globalConfig?.org,
        serverUrl: globalConfig?.server_url,
      });
    }

    return { tunnels, global: globalConfig };
  }

  private static validateTunnelConfig(
    name: string,
    config: TunnelConfig,
  ): void {
    if (!config.protocol) {
      throw new Error(
        `Tunnel "${name}": protocol is required (must be "http", "tcp", or "udp")`,
      );
    }

    if (!["http", "tcp", "udp"].includes(config.protocol)) {
      throw new Error(
        `Tunnel "${name}": protocol must be one of "http", "tcp", or "udp"`,
      );
    }

    if (config.local_port === undefined || config.local_port === null) {
      throw new Error(`Tunnel "${name}": local_port is required`);
    }

    if (
      !Number.isInteger(config.local_port) ||
      config.local_port < 1 ||
      config.local_port > 65535
    ) {
      throw new Error(
        `Tunnel "${name}": local_port must be an integer between 1 and 65535`,
      );
    }

    if (config.protocol === "http") {
      if (config.remote_port !== undefined) {
        throw new Error(
          `Tunnel "${name}": remote_port is not valid for HTTP tunnels`,
        );
      }
    }

    if (config.protocol === "tcp" || config.protocol === "udp") {
      if (config.subdomain !== undefined) {
        throw new Error(
          `Tunnel "${name}": subdomain is not valid for ${config.protocol.toUpperCase()} tunnels`,
        );
      }
      if (config.custom_domain !== undefined) {
        throw new Error(
          `Tunnel "${name}": custom_domain is not valid for ${config.protocol.toUpperCase()} tunnels`,
        );
      }
      if (
        config.remote_port !== undefined &&
        (config.remote_port < 1 || config.remote_port > 65535)
      ) {
        throw new Error(
          `Tunnel "${name}": remote_port must be between 1 and 65535`,
        );
      }
    }
  }
}

