import { YooCheckout } from '@a2seven/yookassa';
import type { InsertUserSubscription } from "@db/schema";
import { db } from "@db";
import { userSubscriptions } from "@db/schema";

if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
  throw new Error("YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY must be set");
}

const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY
});

export async function createPayment(amount: number, description: string, userId: number, planId: number) {
  try {
    const idempotenceKey = `${userId}-${Date.now()}`; // Unique key for each payment attempt

    const payment = await checkout.createPayment({
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.APP_URL}/subscription/confirm`
      },
      description,
      metadata: {
        userId,
        planId
      }
    }, idempotenceKey);

    return payment;
  } catch (error) {
    console.error('Payment creation error:', error);
    throw new Error('Failed to create payment');
  }
}

export async function handlePaymentNotification(event: any) {
  try {
    const payment = event.object;
    const { userId, planId } = payment.metadata;

    if (payment.status === 'succeeded') {
      // Create or update subscription
      const subscription: InsertUserSubscription = {
        userId,
        planId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'active',
        paymentId: payment.id
      };

      await db.insert(userSubscriptions).values(subscription);
    }

    return true;
  } catch (error) {
    console.error('Payment webhook handling error:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: number) {
  await db
    .update(userSubscriptions)
    .set({ status: 'cancelled', endDate: new Date() })
    .where(eq(userSubscriptions.id, subscriptionId));
}
