import type {
  WhatsAppProvider,
  WhatsAppInstanceConfig,
  SendTextPayload,
  SendMediaPayload,
  SendAudioPayload,
  SendReactionPayload,
  SendInteractivePayload,
  SendTemplatePayload,
  SendResult,
  ConnectionStatus,
} from '@/lib/whatsapp/types';

const GRAPH_API_URL = 'https://graph.facebook.com/v21.0';

/** Meta Cloud API provider (WhatsApp Business Platform). */
export class MetaCloudProvider implements WhatsAppProvider {
  readonly providerType = 'meta-cloud';

  private phoneNumberId: string;
  private accessToken: string;

  constructor(instance: WhatsAppInstanceConfig) {
    if (!instance.metaToken || !instance.metaPhoneNumberId) {
      throw new Error('metaToken and metaPhoneNumberId are required for META-CLOUD');
    }

    this.phoneNumberId = String(instance.metaPhoneNumberId).trim();
    this.accessToken = String(instance.metaToken).trim();
  }

  private cleanPhone(remoteJid: string): string {
    return remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '').replace(/\D/g, '');
  }

  private async graph(path: string, body: Record<string, unknown>): Promise<SendResult> {
    try {
      const res = await fetch(`${GRAPH_API_URL}/${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.error?.message || 'Meta API error';
        return {
          success: false,
          error: res.status === 429 ? `Rate limited: ${message}` : message,
          raw: data,
        };
      }

      return {
        success: true,
        messageId: data?.messages?.[0]?.id || data?.id,
        raw: data,
      };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Request failed' };
    }
  }

  private async uploadMedia(mediaBase64: string, mimetype: string): Promise<string> {
    const mediaData = mediaBase64.startsWith('data:')
      ? mediaBase64
      : `data:${mimetype};base64,${mediaBase64}`;

    const res = await fetch(`${GRAPH_API_URL}/${this.phoneNumberId}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        file: mediaData,
        type: mimetype.startsWith('image/') ? 'image' : mimetype.startsWith('video/') ? 'video' : 'document',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to upload media');
    }

    return data?.id || data?.media_id || '';
  }

  async sendText(remoteJid: string, payload: SendTextPayload): Promise<SendResult> {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: this.cleanPhone(remoteJid),
      type: 'text',
      text: { body: payload.text, preview_url: true },
    };

    if (payload.quoted?.id) {
      body.context = { message_id: payload.quoted.id };
    }

    return this.graph(`${this.phoneNumberId}/messages`, body);
  }

  async sendMedia(remoteJid: string, payload: SendMediaPayload): Promise<SendResult> {
    try {
      const mediaId = await this.uploadMedia(payload.mediaBase64, payload.mimetype);
      const type = payload.mediaType === 'document' ? 'document' : payload.mediaType;
      const body: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        to: this.cleanPhone(remoteJid),
        type,
        [type]: {
          id: mediaId,
        },
      };

      if (payload.caption) {
        (body[type] as Record<string, unknown>).caption = payload.caption;
      }
      if (payload.mediaType === 'document' && payload.fileName) {
        (body[type] as Record<string, unknown>).filename = payload.fileName;
      }

      return this.graph(`${this.phoneNumberId}/messages`, body);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload media',
      };
    }
  }

  async sendAudio(remoteJid: string, payload: SendAudioPayload): Promise<SendResult> {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: this.cleanPhone(remoteJid),
      type: 'audio',
      audio: {
        link: payload.audioBase64,
      },
    };

    return this.graph(`${this.phoneNumberId}/messages`, body);
  }

  async sendReaction(remoteJid: string, payload: SendReactionPayload): Promise<SendResult> {
    return this.graph(`${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: this.cleanPhone(remoteJid),
      type: 'reaction',
      reaction: {
        message_id: payload.messageId,
        emoji: payload.emoji,
      },
    });
  }

  async sendInteractive(remoteJid: string, payload: SendInteractivePayload): Promise<SendResult> {
    return this.graph(`${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: this.cleanPhone(remoteJid),
      type: 'interactive',
      interactive: {
        type: payload.type,
        body: payload.body,
        header: payload.header,
        footer: payload.footer,
        action: payload.action,
      },
    });
  }

  async sendTemplate(remoteJid: string, payload: SendTemplatePayload): Promise<SendResult> {
    return this.graph(`${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: this.cleanPhone(remoteJid),
      type: 'template',
      template: {
        name: payload.templateName,
        language: { code: payload.language },
        components: payload.components ?? [],
      },
    });
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      const res = await fetch(`${GRAPH_API_URL}/${this.phoneNumberId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!res.ok) {
        return res.status === 401 ? 'close' : 'unknown';
      }

      await res.json().catch(() => undefined);
      return 'open';
    } catch {
      return 'unknown';
    }
  }

  async disconnect(): Promise<void> {
    /* Cloud API — no persistent socket */
  }
}
