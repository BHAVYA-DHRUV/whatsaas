import { db } from '../lib/db/drizzle';
import { chats, messages } from '../lib/db/schema';
import { desc, eq, like } from 'drizzle-orm';

async function main() {
  try {
    console.log('=== DB CHATS ===');
    const chatRows = await db.select().from(chats).orderBy(desc(chats.lastMessageTimestamp));
    console.log(chatRows.map(c => ({
      id: c.id,
      remoteJid: c.remoteJid,
      name: c.name,
      instanceId: c.instanceId,
      lastMessageText: c.lastMessageText,
      unreadCount: c.unreadCount
    })));

    console.log('=== RECENT MESSAGES ===');
    const msgRows = await db.select().from(messages).orderBy(desc(messages.timestamp)).limit(20);
    console.log(msgRows.map(m => ({
      id: m.id,
      chatId: m.chatId,
      fromMe: m.fromMe,
      text: m.text,
      timestamp: m.timestamp
    })));

    console.log('=== TIME AVE TYAR KEHVANU MESSAGES ===');
    const specificMsgs = await db.select().from(messages).where(like(messages.text, '%Time ave%'));
    console.log(specificMsgs.map(m => ({
      id: m.id,
      chatId: m.chatId,
      fromMe: m.fromMe,
      text: m.text,
      timestamp: m.timestamp
    })));

  } catch (err: any) {
    console.error('Error reading DB:', err.message);
  }
  process.exit(0);
}

main();
