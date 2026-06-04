import { getEvolutionConfig } from './config';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  token?: string; // If supplied, uses this instance API key. Otherwise uses master apikey.
  timeoutMs?: number;
}

export class EvolutionSDK {
  private static async requestWithRetry(
    endpoint: string,
    options: RequestOptions = {},
    retries = 3,
    delayMs = 1000
  ): Promise<any> {
    const config = await getEvolutionConfig();
    const method = options.method || 'GET';
    const timeoutMs = options.timeoutMs || 10000;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': options.token || config.apiKey,
      ...options.headers,
    };

    const url = `${config.apiUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // If it's a client error (except rate limit 429), don't retry
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            let errorText = '';
            try {
              errorText = await response.text();
            } catch {}
            throw new Error(`HTTP Error ${response.status}: ${errorText || response.statusText}`);
          }
          throw new Error(`HTTP Status ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        return await response.text();
      } catch (err: any) {
        if (attempt === retries) {
          throw err;
        }
        const backoffDelay = delayMs * Math.pow(2, attempt - 1);
        console.warn(`[EvolutionSDK] Attempt ${attempt} failed for ${method} ${endpoint}: ${err.message}. Retrying in ${backoffDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  /**
   * Create a new WhatsApp instance in Evolution API
   */
  static async createInstance(instanceName: string, options: Record<string, any> = {}) {
    const body = {
      instanceName,
      qrcode: options.qrcode ?? true,
      integration: options.integration || 'WHATSAPP-BAILEYS',
      ...options,
    };
    return this.requestWithRetry('/instance/create', {
      method: 'POST',
      body,
    });
  }

  /**
   * Delete an instance from Evolution API
   */
  static async deleteInstance(instanceName: string) {
    return this.requestWithRetry(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    });
  }

  /**
   * Logout an instance (disconnects session)
   */
  static async logoutInstance(instanceName: string) {
    return this.requestWithRetry(`/instance/logout/${instanceName}`, {
      method: 'DELETE',
    });
  }

  /**
   * Restart an instance session
   */
  static async restartInstance(instanceName: string) {
    return this.requestWithRetry(`/instance/restart/${instanceName}`, {
      method: 'POST',
    });
  }

  /**
   * Fetch all instances or details of a specific instance by ID/Name
   */
  static async fetchInstances(instanceId?: string) {
    const endpoint = instanceId ? `/instance/fetchInstances?instanceId=${instanceId}` : '/instance/fetchInstances';
    return this.requestWithRetry(endpoint);
  }

  /**
   * Get the connection state / status of an instance
   */
  static async getConnectionState(instanceName: string) {
    return this.requestWithRetry(`/instance/connectionState/${instanceName}`);
  }

  /**
   * Fetch the base64 or status of the QR code for an instance
   */
  static async fetchQR(instanceName: string) {
    return this.requestWithRetry(`/instance/connect/${instanceName}`);
  }

  /**
   * Configure/register webhook settings for an instance
   */
  static async setWebhook(instanceName: string, options: { enabled: boolean; url: string; events: string[] }) {
    const config = await getEvolutionConfig();
    const body = {
      enabled: options.enabled,
      url: options.url,
      headers: {
        'apikey': config.webhookToken,
      },
      webhook: {
        byEvents: true,
        events: options.events,
      },
    };
    return this.requestWithRetry(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Send a simple text message via instance
   */
  static async sendMessage(instanceName: string, token: string, remoteJid: string, text: string) {
    const cleanJid = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '').replace(/\D/g, '');
    const body = {
      number: cleanJid,
      text,
      delay: 500,
      linkPreview: true,
    };
    return this.requestWithRetry(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body,
      token,
    });
  }

  /**
   * Fetch chats from the instance storage
   */
  static async fetchChats(instanceName: string, token: string) {
    return this.requestWithRetry(`/chat/findChats/${instanceName}`, {
      method: 'POST',
      token,
    });
  }

  /**
   * Fetch contacts from the instance storage
   */
  static async fetchContacts(instanceName: string, token: string) {
    return this.requestWithRetry(`/chat/findContacts/${instanceName}`, {
      method: 'POST',
      token,
    });
  }
}
