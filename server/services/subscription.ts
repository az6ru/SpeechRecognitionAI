import type { InsertSubscriptionPlan, InsertUserSubscription } from "@db/schema";
import { db } from "@db";
import { subscriptionPlans, userSubscriptions } from "@db/schema";
import { eq } from "drizzle-orm";

// Initial subscription plans
const DEFAULT_SUBSCRIPTION_PLANS: InsertSubscriptionPlan[] = [
  {
    name: "Бесплатный",
    description: "30 минут в месяц",
    priceMonthly: 0,
    minutesLimit: 30,
    isActive: true,
  },
  {
    name: "Стандартный",
    description: "300 минут в месяц + расширенные возможности экспорта",
    priceMonthly: 990,
    minutesLimit: 300,
    isActive: true,
  },
  {
    name: "Премиум",
    description: "Безлимитное использование + приоритетная поддержка",
    priceMonthly: 2990,
    minutesLimit: null, // unlimited
    isActive: true,
  },
];

export async function initializeSubscriptionPlans() {
  // Check if plans already exist
  const existingPlans = await db.select().from(subscriptionPlans);
  
  if (existingPlans.length === 0) {
    // Insert default plans
    await db.insert(subscriptionPlans).values(DEFAULT_SUBSCRIPTION_PLANS);
  }
}

export async function getUserSubscription(userId: number) {
  const [subscription] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .orderBy(userSubscriptions.startDate)
    .limit(1);

  return subscription;
}

export async function getRemainingMinutes(userId: number) {
  const subscription = await getUserSubscription(userId);
  if (!subscription) return 30; // Free tier default

  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, subscription.planId))
    .limit(1);

  if (!plan.minutesLimit) return Infinity; // Unlimited plan

  // TODO: Calculate used minutes for current month
  // For now, return plan limit
  return plan.minutesLimit;
}

export async function canTranscribeFile(userId: number, durationMinutes: number) {
  const remainingMinutes = await getRemainingMinutes(userId);
  return remainingMinutes >= durationMinutes;
}

export async function recordUsage(userId: number, fileSize: number, duration: number, transcriptionId: string) {
  await db.insert(usageRecords).values({
    userId,
    fileSize,
    duration,
    transcriptionId,
  });
}
