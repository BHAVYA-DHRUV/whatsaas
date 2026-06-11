const postgres = require('postgres');
require('dotenv').config();

async function run() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.error('POSTGRES_URL is not set in environment.');
    process.exit(1);
  }
  const sql = postgres(url);
  console.log('Connecting to PostgreSQL and creating indexes...');
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_last_message ON chats(last_message_timestamp DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_unread_count ON chats(unread_count);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_phone_number ON contacts(phone);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_archived ON chats(is_archived);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_pinned ON chats(is_pinned);`;
    console.log('Database indexes created successfully!');
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await sql.end();
  }
}

run();
