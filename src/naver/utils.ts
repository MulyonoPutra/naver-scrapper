export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await sleep(delayMs + Math.random() * 500);
    }
  }
  throw lastError;
}
