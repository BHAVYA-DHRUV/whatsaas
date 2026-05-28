'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Link } from '@/i18n/routing';
import { ChatListItem, type Chat } from '@/components/dashboard/ChatListItem';

const ROW_HEIGHT = 76;

type InstanceRow = { dbId: number; instanceName: string };

type VirtualizedChatListProps = {
  chats: Chat[];
  activeChatNumber: string | null;
  activeInstanceId: string | null;
  instances: InstanceRow[];
};

export function VirtualizedChatList({
  chats,
  activeChatNumber,
  activeInstanceId,
  instances,
}: VirtualizedChatListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: chats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const decodedActive = activeChatNumber ? decodeURIComponent(activeChatNumber) : null;

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const chat = chats[virtualRow.index];
          const isGroup = chat.remoteJid.endsWith('@g.us');
          const chatIdentifier = isGroup ? chat.remoteJid : chat.remoteJid.split('@')[0];
          const isActive =
            chatIdentifier === decodedActive &&
            (!activeInstanceId || chat.instanceId === parseInt(activeInstanceId, 10));
          const href = `/inbox/chat/${encodeURIComponent(chatIdentifier)}${
            chat.instanceId ? `?instanceId=${chat.instanceId}` : ''
          }`;

          return (
            <div
              key={chat.id}
              className="absolute left-0 top-0 w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <Link href={href} className="block h-full">
                <ChatListItem chat={chat} isActive={isActive} instances={instances} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
