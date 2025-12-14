#!/usr/bin/env node

import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";
import { OutRayClient } from "./client";

const CONFIG_DIR = path.join(os.homedir(), ".outray");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function saveConfig(config: { token: string }) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(chalk.green("✅ Auth token saved successfully!"));
}

function loadConfig(): { token?: string } {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    } catch (e) {
      return {};
    }
  }
  return {};
}

async function validateToken(token: string, webUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${webUrl}/api/tunnel/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = (await response.json()) as {
      valid: boolean;
      error?: string;
    };

    if (!data.valid) {
      throw new Error(data.error || "Invalid token");
    }

    return true;
  } catch (error) {
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const serverUrl = process.env.OUTRAY_SERVER_URL || "wss://api.outray.dev/";
  const webUrl = process.env.OUTRAY_WEB_URL || "https://alpha.outray.dev";

  if (!command) {
    console.log(chalk.red("❌ Please specify a command"));
    console.log(chalk.cyan("Usage:"));
    console.log(
      chalk.cyan("  outray login <token>    Save your authentication token"),
    );
    console.log(chalk.cyan("  outray http <port>      Start an HTTP tunnel"));
    console.log(
      chalk.cyan("  outray <port>           Start an HTTP tunnel (shorthand)"),
    );
    process.exit(1);
  }

  if (command === "login") {
    const token = args[1];
    if (!token) {
      console.log(chalk.red("❌ Please provide an auth token"));
      console.log(chalk.cyan("Usage: outray login <token>"));
      process.exit(1);
    }

    console.log(chalk.cyan("Validating token..."));
    try {
      await validateToken(token, webUrl);
      saveConfig({ token });
    } catch (err) {
      console.log(
        chalk.red(
          `❌ Validation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        ),
      );
      process.exit(1);
    }
    return;
  }

  let localPort: number;
  let remainingArgs: string[];

  if (command === "http") {
    const portArg = args[1];
    if (!portArg) {
      console.log(chalk.red("❌ Please specify a port"));
      console.log(chalk.cyan("Usage: outray http <port>"));
      process.exit(1);
    }
    localPort = parseInt(portArg, 10);
    remainingArgs = args.slice(2);
  } else if (!isNaN(parseInt(command, 10))) {
    localPort = parseInt(command, 10);
    remainingArgs = args.slice(1);
  } else {
    console.log(chalk.red(`❌ Unknown command: ${command}`));
    process.exit(1);
  }

  if (isNaN(localPort!) || localPort! < 1 || localPort! > 65535) {
    console.log(chalk.red("❌ Invalid port number"));
    console.log(chalk.cyan("Port must be between 1 and 65535"));
    process.exit(1);
  }

  let subdomain: string | undefined;
  const subdomainIndex = remainingArgs.indexOf("--subdomain");
  if (subdomainIndex !== -1 && remainingArgs[subdomainIndex + 1]) {
    subdomain = remainingArgs[subdomainIndex + 1];
  }

  const config = loadConfig();
  let apiKey = process.env.OUTRAY_API_KEY || config.token;

  const keyIndex = remainingArgs.indexOf("--key");
  if (keyIndex !== -1 && remainingArgs[keyIndex + 1]) {
    apiKey = remainingArgs[keyIndex + 1];
  }

  const client = new OutRayClient(localPort!, serverUrl, apiKey, subdomain);
  client.start();

  process.on("SIGINT", () => {
    console.log(chalk.cyan("\n👋 Shutting down gracefully..."));
    client.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log(chalk.cyan("\n👋 Shutting down gracefully..."));
    client.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(chalk.red("Unexpected error:"), err);
  process.exit(1);
});
