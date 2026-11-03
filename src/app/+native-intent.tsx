type NativeIntentOptions = {
  path: string;
  initial: boolean;
};

export function redirectSystemPath({ path }: NativeIntentOptions) {
  try {
    const url = new URL(path);
    if (url.protocol === 'clerk:' && url.hostname === 'tech.praesens.achei.hosted-callback') {
      return '/';
    }
  } catch {
    // Leave malformed or unrelated links to Expo Router's normal handling.
  }

  return path;
}
