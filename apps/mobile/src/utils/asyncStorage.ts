/** Lazy dynamic import of AsyncStorage — avoids bundler issues in test environments. */
export async function getAsyncStorage() {
  const module = await import("@react-native-async-storage/async-storage");
  return module.default;
}
