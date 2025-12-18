// utils/oracle.service.ts

import { getAllTokens } from "./dbhelpers.js";
import { generateHmacSignature } from "./webhook.security.js";
import db from "../config/db.js";

// Types
interface TokenPrices {
    [key: string]: {
        usd: number;
        usd_market_cap?: number;
        usd_24h_vol?: number;
        usd_24h_change?: number;
        last_updated_at?: number;
    };
}

interface CurrentPrices {
    USDC: number | null;
    USDT: number | null;
    WBTC: number | null;
    WETH: number | null;
    WSOL: number | null;
}

interface PollingState {
    isRunning: boolean;
    lastVolatileUpdate: Date | null;
    lastStableUpdate: Date | null;
    callsToday: number;
    startOfDay: number;
    consecutiveFailures: number;
}

type StopPollingFunction = () => void;

// Configuration
const API_KEY = process.env.COIN_GECKO_API_KEY;
console.log(API_KEY);
if (!API_KEY) {
    throw new Error('Please add coin gecko api key to .env');
}
const BASE_URL = 'https://api.coingecko.com/api/v3/simple/price';

// Network configuration
const FETCH_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_CONSECUTIVE_FAILURES = 5;



// Polling intervals (in milliseconds) - Can be updated

let TOKEN_INTERVAL = 2 * 60 * 1000;

// Polling state
let pollingState: PollingState = {
    isRunning: false,
    lastVolatileUpdate: null,
    lastStableUpdate: null,
    callsToday: 0,
    startOfDay: new Date().setHours(0, 0, 0, 0),
    consecutiveFailures: 0
};

let tokenIntervalId: NodeJS.Timeout | null = null;

/**
 * Fetch prices from CoinGecko API with timeout and retry logic
 * @param {string[]} tokenIds - Array of token IDs to fetch
 * @returns {Promise<TokenPrices | null>} - Price data
 */
async function fetchPrices(tokenIds: readonly string[]): Promise<TokenPrices | null> {
    const ids = tokenIds.join(',');
    const url = `${BASE_URL}?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true&precision=2`;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
        const response = await fetch(url, {
            headers: {
                'x-cg-demo-api-key': API_KEY,
                'Accept': 'application/json',
                'User-Agent': 'MetaSmartPort/1.0'
            } as Record<string, string>,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Handle rate limiting
            if (response.status === 429) {
                console.error(`[${new Date().toISOString()}] ⚠ Rate limit exceeded (429)`);
                const retryAfter = response.headers.get('Retry-After');
                if (retryAfter) {
                    console.log(`Retry after ${retryAfter} seconds`);
                }
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: TokenPrices = await response.json();

        // Update call tracking
        resetDailyCounterIfNeeded();
        pollingState.callsToday++;

        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                console.error(`[${new Date().toISOString()}] ✗ Request timeout after ${FETCH_TIMEOUT}ms`);
                throw new Error(`Request timeout after ${FETCH_TIMEOUT}ms`);
            }

            // Handle network errors
            if ('cause' in error && error.cause) {
                const cause = error.cause as any;
                if (cause.code === 'ETIMEDOUT') {
                    console.error(`[${new Date().toISOString()}] ✗ Network connection timeout`);
                    throw new Error('Network connection timeout - please check your internet connection');
                }
                if (cause.code === 'ECONNREFUSED') {
                    console.error(`[${new Date().toISOString()}] ✗ Connection refused`);
                    throw new Error('Connection refused - API may be down');
                }
                if (cause.code === 'ENOTFOUND') {
                    console.error(`[${new Date().toISOString()}] ✗ DNS lookup failed`);
                    throw new Error('DNS lookup failed - check your network/DNS settings');
                }
            }
        }

        console.error('Error fetching prices:', error);
        throw error;
    }
}

/**
 * Fetch with exponential backoff retry logic
 */
async function fetchWithRetry(tokenIds: readonly string[]): Promise<TokenPrices | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const prices = await fetchPrices(tokenIds);

            // Reset failure counter on success
            if (pollingState.consecutiveFailures > 0) {
                console.log(`[${new Date().toISOString()}] ✓ Recovered after ${pollingState.consecutiveFailures} consecutive failures`);
                pollingState.consecutiveFailures = 0;
            }

            return prices;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            const isLastAttempt = attempt === MAX_RETRIES - 1;
            if (isLastAttempt) break;

            const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), 10000);
            console.log(`[${new Date().toISOString()}] ⚠ Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${lastError.message}`);
            console.log(`[${new Date().toISOString()}] Retrying in ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    pollingState.consecutiveFailures++;
    console.error(`[${new Date().toISOString()}] ✗ All ${MAX_RETRIES} attempts failed: ${lastError?.message}`);
    console.error(`[${new Date().toISOString()}] Consecutive failures: ${pollingState.consecutiveFailures}`);

    // Auto-stop if too many consecutive failures
    if (pollingState.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.error(`[${new Date().toISOString()}] ⚠ CRITICAL: Stopping polling after ${pollingState.consecutiveFailures} consecutive failures`);
        console.error(`[${new Date().toISOString()}] Please check your network connection and CoinGecko API status`);
        stopPricePolling();
    }

    return null;
}

/**
 * Reset daily counter if new day
 */
function resetDailyCounterIfNeeded(): void {
    const currentDayStart = new Date().setHours(0, 0, 0, 0);
    if (currentDayStart !== pollingState.startOfDay) {
        pollingState.callsToday = 0;
        pollingState.startOfDay = currentDayStart;
    }
}


// Unified polling function
async function pollAllPrices(): Promise<TokenPrices | null> {
    console.log(`[${new Date().toISOString()}] Fetching all token prices...`);

    try {
        const ALL_TOKENS = (await getAllTokens()).reduce((acc, token) => {
            acc[token.id] = token.symbol;
            return acc;
        }, {} as { [id: string]: string });

        // Fetch all prices with retry
        const prices = await fetchWithRetry(Object.keys(ALL_TOKENS));

        if (!prices) {
            console.warn('No prices fetched');
            return null;
        }

        // Update polling state timestamps
        const now = new Date();
        pollingState.lastVolatileUpdate = now;
        pollingState.lastStableUpdate = now;


        // Map the fetched data into TokenPrices interface format
        const structuredPrices: TokenPrices = {};
        for (const tokenId of Object.keys(prices)) {
            const data = prices[tokenId];
            structuredPrices[tokenId] = {
                usd: data.usd ?? 0,
                usd_market_cap: data.usd_market_cap,
                usd_24h_vol: data.usd_24h_vol,
                usd_24h_change: data.usd_24h_change,
                last_updated_at: Math.floor(now.getTime() / 1000)
            };
        }
        const loggedPrices: Record<string, number | null> = {};
        for (const tokenId in ALL_TOKENS) {
            const tokenSymbol = ALL_TOKENS[tokenId];
            loggedPrices[tokenSymbol] = structuredPrices[tokenId]?.usd ?? null;
        }
        console.log(`[${new Date().toISOString()}] ✓ All tokens updated`, loggedPrices);
        const webhookUrl = `${process.env.DOMAIN_URL}/api/webhook`;
        const payload = JSON.stringify({ botName: 'Drift', marketData: structuredPrices });
        const signature = generateHmacSignature(process.env.WEBHOOK_SECRET || "default_secret", payload);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-signature': signature
            },
            body: payload
        });

        if (!response.ok) {
            console.error(`Webhook call failed: ${response.status} ${response.statusText}`);
        } else {
            console.log(`Webhook called successfully at ${webhookUrl}`);
        }

        return structuredPrices;

    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] ❌ Failed to poll prices:`, error.message);
        return null;
    }
}


/**
 * Trigger webhook with market data
 * @param webhookUrl - The webhook URL to call
 * @param botName - The bot ID to send
 */
export async function triggerWebhook(webhookUrl: string, botName: string): Promise<void> {
    try {

        const marketData = await getStoredMarketData();

        if (Object.keys(marketData).length === 0) {
            console.log('No market data available, skipping webhook call');
            return;
        }

        console.log(`Calling webhook: ${webhookUrl}`);

        const payload = JSON.stringify({
            botName,
            marketData,
        });
        const signature = generateHmacSignature(process.env.WEBHOOK_SECRET || "default_secret", payload);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-signature': signature
            },
            body: payload
        });

        if (!response.ok) {
            throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(` Webhook call successful: ${result.message || 'OK'}`);

    } catch (error: any) {
        console.error(` Webhook call failed:`, error.message);
        throw error;
    }
}


/**
 * Get market data from the database (for API server)
 */
export async function getStoredMarketData() {
    try {
        const prices = await db.tokenPrice.findMany({
            distinct: ['symbol'],
            orderBy: {
                lastUpdatedAt: 'desc'
            }
        });
        const marketData: Record<string, any> = {};

        for (const p of prices) {
            marketData[p.symbol] = {
                usd: p.usdPrice,
                usd_market_cap: p.usdMarketCap || 0,
                usd_24h_vol: p.usd24hVol || 0,
                usd_24h_change: p.usd24hChange || 0,
                last_updated_at: Math.floor(p.lastUpdatedAt.getTime() / 1000)
            };
        }
        return marketData;
    } catch (error) {
        console.error('Failed to fetch stored market data:', error);
        return {};
    }
}

/**
 * Get current prices from database (simple format)
 */
export async function getStoredCurrentPrices(): Promise<CurrentPrices> {
    const marketData = await getStoredMarketData();
    return {
        USDC: marketData['usd-coin']?.usd ?? null,
        USDT: marketData['tether']?.usd ?? null,
        WBTC: marketData['bitcoin']?.usd ?? null, // Note: mapping might need adjustment if DB stores 'bitcoin' vs 'wrapped-bitcoin'
        WETH: marketData['ethereum']?.usd ?? null,
        WSOL: marketData['solana']?.usd ?? null
    };
}

/**
 * Start the price polling service
 * @returns {StopPollingFunction} - Function to stop polling
 */
export function startPricePolling(): StopPollingFunction {
    if (pollingState.isRunning) {
        console.log('Price polling service is already running');
        return stopPricePolling;
    }


    console.log(`- Timeout: ${FETCH_TIMEOUT / 1000}s per request`);
    console.log(`- Retries: ${MAX_RETRIES} attempts with exponential backoff`);

    // Reset failure counter on manual start
    pollingState.consecutiveFailures = 0;

    pollAllPrices();
    // Set up intervals

    tokenIntervalId = setInterval(pollAllPrices, TOKEN_INTERVAL)
    pollingState.isRunning = true;

    // Return stop function
    return stopPricePolling;
}

// Stop the price polling service
export function stopPricePolling(): void {
    if (!pollingState.isRunning) {
        console.log('Price polling service is not running');
        return;
    }

    console.log('Stopping price polling service...');


    if (tokenIntervalId) {
        clearInterval(tokenIntervalId);
        tokenIntervalId = null;
    }
    pollingState.isRunning = false;
    console.log('Price polling service stopped');
}

// Restart the price polling service
export function restartPricePolling(): void {
    console.log('Restarting price polling service...');
    stopPricePolling();

    // Small delay before restarting
    setTimeout(() => {
        startPricePolling();
    }, 1000);
}

// Get polling status and statistics
export function getPollingStatus() {
    resetDailyCounterIfNeeded();

    const minutesPerMonth = 43200; // 30 days

    const allCalls = minutesPerMonth / (TOKEN_INTERVAL / 60000);
    const estimatedMonthlyCalls = Math.ceil(allCalls);

    return {
        isRunning: pollingState.isRunning,

        tokenInterval: TOKEN_INTERVAL / 1000, // in seconds
        lastVolatileUpdate: pollingState.lastVolatileUpdate,
        lastStableUpdate: pollingState.lastStableUpdate,

        callsToday: pollingState.callsToday,
        estimatedMonthlyCalls,
        remainingMonthlyBuffer: 50000 - estimatedMonthlyCalls,
        consecutiveFailures: pollingState.consecutiveFailures,
        healthStatus: pollingState.consecutiveFailures === 0 ? 'healthy' :
            pollingState.consecutiveFailures < 3 ? 'degraded' : 'critical',
        dataFreshness: 'unknown'
    };
}

// Update polling intervals (requires restart to take effect)
export function updateIntervals(allSeconds?: number): void {


    if (allSeconds !== undefined) {
        if (allSeconds < 60 || allSeconds > 7200) {
            throw new Error('token interval must be between 60 and 7200 seconds');
        }
        TOKEN_INTERVAL = allSeconds * 1000;
    }
    console.log('Intervals updated:', {
        tokenInterval: TOKEN_INTERVAL / 1000,
    });
}

// Force an immediate price update for all tokens
export async function forceUpdate(): Promise<CurrentPrices> {
    console.log('Forcing immediate price update...');

    await Promise.all([
        pollAllPrices()
    ]);

    return getStoredCurrentPrices();
}

// Calculate estimated monthly API calls
export function calculateMonthlyCalls(): void {
    const minutesPerMonth = 43200; // 30 days
    const totalCalls = minutesPerMonth / (TOKEN_INTERVAL / 60000)

    console.log('\nEstimated Monthly API Usage:');
    console.log(`- Total: ~${Math.ceil(totalCalls)} calls/month`);
    console.log(`- Remaining buffer: ~${50000 - Math.ceil(totalCalls)} calls\n`);
}

// Graceful shutdown handlers
process.on('SIGINT', () => {
    console.log('\n[SIGINT] Received interrupt signal, shutting down gracefully...');
    stopPricePolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[SIGTERM] Received termination signal, shutting down gracefully...');
    stopPricePolling();
    process.exit(0);
});

// Export types
export type { CurrentPrices, TokenPrices, PollingState };