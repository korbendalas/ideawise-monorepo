const defaultApiBaseUrl = "http://localhost:8000/api";

type ResolveMobileApiBaseUrlOptions = {
  envBaseUrl?: string;
  expoHostUri?: string | null;
};

export function resolveMobileApiBaseUrl({
  envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL,
  expoHostUri
}: ResolveMobileApiBaseUrlOptions): string {
  if (envBaseUrl) {
    return envBaseUrl;
  }

  const host = expoHostUri?.split(":")[0];
  if (!host) {
    return defaultApiBaseUrl;
  }

  return `http://${host}:8000/api`;
}

export const mobileUploadConfig = {
  apiBaseUrl: resolveMobileApiBaseUrl({
    expoHostUri: getExpoHostUri()
  }),
  maxFileSizeBytes: 250 * 1024 * 1024,
  maxFilesPerBatch: 10,
  completedHistoryLimit: 25
} as const;

function getExpoHostUri(): string | undefined {
  try {
    const expoConstantsModule = require("expo-constants") as {
      default?: {
        expoConfig?: { hostUri?: string };
        manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
      };
    };
    const constants = expoConstantsModule.default;

    return constants?.expoConfig?.hostUri ?? constants?.manifest2?.extra?.expoGo?.debuggerHost;
  } catch {
    return undefined;
  }
}
