export function requireEnv(name: string, value: string | undefined | null): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
