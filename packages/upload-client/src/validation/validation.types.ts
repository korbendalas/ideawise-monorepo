export type ValidatableFile = {
  name: string;
  size: number;
  type: string;
};

export type ValidationOptions = {
  maxFiles?: number;
  maxFileSizeBytes: number;
  allowedMimePrefixes?: string[];
};
