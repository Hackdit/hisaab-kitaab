/**
 * Schedule trial nudges for a business:
 * - Day 7 nudge (7 days after signup / 7 days before trial end)
 * - Day 12 nudge (12 days after signup / 2 days before trial end)
 *
 * Stores each as a Redis key with a TTL so expired jobs self-clean.
 */
export declare function scheduleTrialNudges(businessId: string, trialEndsAt: string): Promise<void>;
/**
 * Schedule trial expiry processing (runs when trial ends).
 * Stores as a Redis key with a TTL so expired jobs self-clean.
 */
export declare function scheduleTrialExpiry(businessId: string, trialEndsAt: string): Promise<void>;
/**
 * Set up all trial management jobs. Called once during server startup.
 * Runs the first check immediately, then every hour thereafter.
 */
export declare function setupAllWorkers(): {
    intervalId: ReturnType<typeof setInterval>;
};
/**
 * Gracefully stop all workers.
 */
export declare function closeAllWorkers(): Promise<void>;
