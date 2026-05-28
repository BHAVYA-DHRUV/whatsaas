import { db } from '@/lib/db/drizzle'

export async function getPlans() {
  try {
    const plans = await db.query.plans.findMany()

    return plans ?? []
  } catch (error) {
    console.error('Plans Query Error:', error)

    return []
  }
}