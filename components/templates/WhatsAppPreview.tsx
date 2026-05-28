'use client';

import { cn } from '@/lib/utils';
import { ExternalLink, FileText, Image as ImageIcon, Phone, Play } from 'lucide-react';

export type WhatsAppButton = {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phone_number?: string;
};

export type TemplateComponent = {
  type: string;
  format?: string;
  text?: string;
  example?: { header_text?: string[]; body_text?: string[][] };
  buttons?: WhatsAppButton[];
};

type BuilderProps = {
  headerType?: string;
  headerText?: string;
  bodyText?: string;
  footerText?: string;
  buttons?: WhatsAppButton[];
  data?: never;
  className?: string;
};

type DataProps = {
  data: TemplateComponent[] | Record<string, unknown> | null | undefined;
  headerType?: never;
  headerText?: never;
  bodyText?: never;
  footerText?: never;
  buttons?: never;
  className?: string;
};

export type WhatsAppPreviewProps = BuilderProps | DataProps;

function normalizeFromMetaComponents(components: TemplateComponent[]) {
  let headerType = 'NONE';
  let headerText = '';
  let bodyText = '';
  let footerText = '';
  let buttons: WhatsAppButton[] = [];

  for (const c of components) {
    const t = (c.type || '').toUpperCase();
    if (t === 'HEADER') {
      headerType = (c.format || 'TEXT').toUpperCase();
      headerText = c.text || c.example?.header_text?.[0] || '';
    } else if (t === 'BODY') {
      const bodyExample = c.example?.body_text?.[0];
      bodyText =
        c.text ||
        (Array.isArray(bodyExample) ? bodyExample.join(' ') : typeof bodyExample === 'string' ? bodyExample : '') ||
        '';
    } else if (t === 'FOOTER') {
      footerText = c.text || '';
    } else if (t === 'BUTTONS' && c.buttons) {
      buttons = c.buttons;
    }
  }

  return { headerType, headerText, bodyText, footerText, buttons };
}

function renderVariables(text: string) {
  const parts = text.split(/(\{\{\d+\}\})/g);
  return parts.map((part, i) =>
    /^\{\{\d+\}\}$/.test(part) ? (
      <span key={i} className="rounded bg-amber-200/80 px-1 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export function WhatsAppPreview(props: WhatsAppPreviewProps) {
  const className = props.className;

  let headerType = 'NONE';
  let headerText = '';
  let bodyText = '';
  let footerText = '';
  let buttons: WhatsAppButton[] = [];

  if ('data' in props && props.data) {
    const raw = props.data;
    const list = Array.isArray(raw) ? raw : (raw as { components?: TemplateComponent[] }).components;
    if (Array.isArray(list)) {
      ({ headerType, headerText, bodyText, footerText, buttons } = normalizeFromMetaComponents(list));
    }
  } else {
    headerType = props.headerType || 'NONE';
    headerText = props.headerText || '';
    bodyText = props.bodyText || '';
    footerText = props.footerText || '';
    buttons = props.buttons || [];
  }

  const hasHeader = headerType !== 'NONE' && (headerType !== 'TEXT' || headerText);
  const hasBody = Boolean(bodyText?.trim());
  const hasFooter = Boolean(footerText?.trim());

  return (
    <div
      className={cn(
        'w-[320px] rounded-2xl border border-border bg-[#e5ddd5] shadow-xl dark:bg-[#0b141a]',
        className
      )}
    >
      <div className="flex items-center gap-2 rounded-t-2xl bg-[#075e54] px-4 py-3 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
          WA
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">Business Account</p>
          <p className="text-xs text-white/70">Template preview</p>
        </div>
      </div>

      <div className="p-3">
        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-[#1f2c34]">
          {hasHeader && headerType === 'IMAGE' && (
            <div className="flex aspect-video items-center justify-center bg-muted">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {hasHeader && headerType === 'VIDEO' && (
            <div className="flex aspect-video items-center justify-center bg-muted">
              <Play className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {hasHeader && headerType === 'DOCUMENT' && (
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Document</span>
            </div>
          )}
          {hasHeader && headerType === 'TEXT' && headerText && (
            <p className="px-3 pt-3 text-sm font-semibold text-foreground">{renderVariables(headerText)}</p>
          )}

          {hasBody && (
            <p className="whitespace-pre-wrap px-3 py-2 text-sm leading-relaxed text-foreground">
              {renderVariables(bodyText)}
            </p>
          )}

          {!hasHeader && !hasBody && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Start typing to preview your template</p>
          )}

          {hasFooter && (
            <p className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">{footerText}</p>
          )}

          {buttons.length > 0 && (
            <div className="border-t border-border/60">
              {buttons.map((btn, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-center gap-2 border-b border-border/40 py-2.5 text-sm font-medium text-[#00a884] last:border-b-0"
                >
                  {btn.type === 'URL' && <ExternalLink className="h-3.5 w-3.5" />}
                  {btn.type === 'PHONE_NUMBER' && <Phone className="h-3.5 w-3.5" />}
                  {btn.text || 'Button'}
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">This is a close approximation of WhatsApp UI</p>
      </div>
    </div>
  );
}
