import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

let prismaInstance: PrismaClient

if (connectionString) {
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  prismaInstance = new PrismaClient({ adapter })
} else {
  prismaInstance = new PrismaClient()
}

export const prisma =
  globalForPrisma.prisma ??
  prismaInstance

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}