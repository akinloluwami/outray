# @outray/nest

NestJS integration for [Outray](https://outray.dev), the open-source tunneling solution. Automatically expose your local NestJS server to the internet during development.

## Installation

```bash
npm install @outray/nest
# or
pnpm add @outray/nest
# or
yarn add @outray/nest
```

## Usage

Import the `outray` function and call it in your `main.ts` file after your application starts listening.

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { outray } from '@outray/nest';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Start the server
  await app.listen(3000);

  // Start the tunnel in development
  if (process.env.NODE_ENV !== 'production') {
    await outray(app);
  }
}
bootstrap();
```

## Configuration

You can pass options to the `outray` function:

```typescript
await outray(app, {
  // Optional: Explicitly specify port (auto-detected otherwise)
  port: 3000,
  
  // Optional: Request a specific subdomain
  subdomain: 'my-cool-app',
  
  // Optional: Use a custom domain
  customDomain: 'api.example.com',
  
  // Optional: Suppress console output
  silent: false,
});
```

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | Auto-detected | The local port your NestJS app is running on. |
| `subdomain` | `string` | Random | Request a specific subdomain. |
| `apiKey` | `string` | `process.env.OUTRAY_API_KEY` | Your Outray API key. |
| `enabled` | `boolean` | `true` (in dev) | Whether to enable the tunnel. |
| `silent` | `boolean` | `false` | specific to Console logs. |
| `onTunnelReady` | `(url: string) => void` | - | Callback when tunnel is ready. |

## License

MIT
