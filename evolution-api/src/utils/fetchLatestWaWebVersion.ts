import axios, { AxiosRequestConfig } from 'axios';
import { fetchLatestBaileysVersion, WAVersion } from 'baileys';

export const fetchLatestWaWebVersion = async (options: AxiosRequestConfig<{}>) => {
  // If CONFIG_SESSION_PHONE_VERSION is configured in the environment, use it immediately
  const envVersion = process.env.CONFIG_SESSION_PHONE_VERSION;
  if (envVersion) {
    const parts = envVersion.split('.').map(Number);
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
      console.log(`[WaWebVersion] Using version from environment: ${envVersion}`);
      return {
        version: parts as WAVersion,
        isLatest: true,
      };
    }
  }

  try {
    const { data } = await axios.get('https://web.whatsapp.com/sw.js', {
      ...options,
      responseType: 'text', // Changed from json to text to avoid JSON parsing failures
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...options.headers,
      }
    });

    const regex = /\\?"client_revision\\?":\s*(\d+)/;
    const match = data.match(regex);

    if (!match?.[1]) {
      console.warn('[WaWebVersion] Could not find client revision in sw.js. Falling back to safe stable version 2.3000.1017578272');
      return {
        version: [2, 3000, 1017578272] as WAVersion,
        isLatest: false,
        error: {
          message: 'Could not find client revision in the fetched content',
        },
      };
    }

    const clientRevision = match[1];
    console.log(`[WaWebVersion] Parsed client revision: ${clientRevision}`);

    return {
      version: [2, 3000, +clientRevision] as WAVersion,
      isLatest: true,
    };
  } catch (error: any) {
    console.error(`[WaWebVersion] Failed to fetch latest version from web: ${error.message}. Falling back to 2.3000.1017578272`);
    return {
      version: [2, 3000, 1017578272] as WAVersion,
      isLatest: false,
      error,
    };
  }
};

