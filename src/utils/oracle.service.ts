// utils/oracle.service.ts

import { getAllTokens } from "./dbhelpers.js";
import { generateHmacSignature } from "./webhook.security.js";
import db from "../config/db.js";
import { logger } from "./logger.js";

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
logger.debug("CoinGecko API Key present", !!API_KEY);
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
async function fetchPrices(tokenIds: string[]): Promise<TokenPrices | null> {
    const ids = tokenIds.join(',');
    const url = `${BASE_URL}?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true&precision=2`;
    logger.debug("CoinGecko URL", url);
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
                logger.warn(`Rate limit exceeded (429)`);
                const retryAfter = response.headers.get('Retry-After');
                if (retryAfter) {
                    logger.info(`Retry after ${retryAfter} seconds`);
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
                logger.error(`Request timeout after ${FETCH_TIMEOUT}ms`);
                throw new Error(`Request timeout after ${FETCH_TIMEOUT}ms`);
            }

            // Handle network errors
            if ('cause' in error && error.cause) {
                const cause = error.cause as any;
                if (cause.code === 'ETIMEDOUT') {
                    logger.error(`Network connection timeout`);
                    throw new Error('Network connection timeout - please check your internet connection');
                }
                if (cause.code === 'ECONNREFUSED') {
                    logger.error(`Connection refused`);
                    throw new Error('Connection refused - API may be down');
                }
                if (cause.code === 'ENOTFOUND') {
                    logger.error(`DNS lookup failed`);
                    throw new Error('DNS lookup failed - check your network/DNS settings');
                }
            }
        }

        logger.error('Error fetching prices', error);
        throw error;
    }
}

/**
 * Fetch with exponential backoff retry logic
 */
async function fetchWithRetry(tokenIds: string[]): Promise<TokenPrices | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const prices = await fetchPrices(tokenIds);

            // Reset failure counter on success
            if (pollingState.consecutiveFailures > 0) {
                logger.info(`Recovered after ${pollingState.consecutiveFailures} consecutive failures`);
                pollingState.consecutiveFailures = 0;
            }

            return prices;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            const isLastAttempt = attempt === MAX_RETRIES - 1;
            if (isLastAttempt) break;

            const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), 10000);
            logger.warn(`Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${lastError.message}`);
            logger.info(`Retrying in ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    pollingState.consecutiveFailures++;
    logger.error(`All ${MAX_RETRIES} attempts failed`, lastError);
    logger.error(`Consecutive failures: ${pollingState.consecutiveFailures}`);

    // Auto-stop if too many consecutive failures
    if (pollingState.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        logger.error(`CRITICAL: Stopping polling after ${pollingState.consecutiveFailures} consecutive failures`);
        logger.error(`Please check your network connection and CoinGecko API status`);
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
    logger.info(`Fetching all token prices...`);

    try {
        const tokens = await getAllTokens();

        // Map of Symbol -> CoinGecko ID
        const SYMBOL_TO_CG_ID: Record<string, string> = {
            'WBTC': 'wrapped-bitcoin',
            'USDT': 'tether',
            'USDC': 'usd-coin',
            'DAI': 'dai',
            'WETH': 'ethereum',
            'WSOL': 'solana'
        };

        // Create a mapping of CoinGecko ID back to our database token info
        const cgIdToTokenInfo: Record<string, { id: string, symbol: string }> = {};
        const coingeckoIds: string[] = [];

        tokens.forEach(token => {
            const cgId = SYMBOL_TO_CG_ID[token.symbol.toUpperCase()] || token.symbol.toLowerCase();
            cgIdToTokenInfo[cgId] = { id: token.id, symbol: token.symbol };
            coingeckoIds.push(cgId);
        });

        // Fetch all prices with retry using CoinGecko IDs
        const prices = await fetchWithRetry(coingeckoIds);

        if (!prices) {
            logger.warn('No prices fetched');
            return null;
        }

        // Update polling state timestamps
        const now = new Date();
        pollingState.lastVolatileUpdate = now;
        pollingState.lastStableUpdate = now;

        // Map the fetched data into TokenPrices interface format using our DB IDs
        const structuredPrices: TokenPrices = {};
        const loggedPrices: Record<string, number | null> = {};

        for (const cgId of Object.keys(prices)) {
            const tokenInfo = cgIdToTokenInfo[cgId];
            if (!tokenInfo) continue;

            const data = prices[cgId];
            structuredPrices[tokenInfo.id] = {
                usd: data.usd ?? 0,
                usd_market_cap: data.usd_market_cap,
                usd_24h_vol: data.usd_24h_vol,
                usd_24h_change: data.usd_24h_change,
                last_updated_at: Math.floor(now.getTime() / 1000)
            };
            loggedPrices[tokenInfo.symbol] = data.usd ?? null;
        }

        // Log the prices we found
        logger.info(`All tokens updated`, loggedPrices);

        // Webhook notification
        const domainUrl = process.env.DOMAIN_URL || 'http://localhost:4000';
        const webhookUrl = `${domainUrl}/api/webhook`;
        const payload = JSON.stringify({ botName: 'Drift', marketData: structuredPrices });
        const signature = generateHmacSignature(process.env.WEBHOOK_SECRET || "default_secret", payload);

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-signature': signature
                },
                body: payload
            });

            if (!response.ok) {
                logger.error(`Webhook call failed: ${response.status} ${response.statusText}`);
            } else {
                logger.info(`Webhook called successfully at ${webhookUrl}`);
            }
        } catch (webhookError: any) {
            logger.warn(`Webhook call failed (is the server running?): ${webhookError.message}`);
        }

        return structuredPrices;

    } catch (error: any) {
        logger.error(`Failed to poll prices`, error);
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
            logger.info('No market data available, skipping webhook call');
            return;
        }

        logger.info(`Calling webhook: ${webhookUrl}`);

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
        logger.info(`Webhook call successful: ${result.message || 'OK'}`);

    } catch (error: any) {
        logger.error(`Webhook call failed`, error);
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
        logger.error('Failed to fetch stored market data', error);
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
        logger.info('Price polling service is already running');
        return stopPricePolling;
    }


    logger.info(`- Timeout: ${FETCH_TIMEOUT / 1000}s per request`);
    logger.info(`- Retries: ${MAX_RETRIES} attempts with exponential backoff`);

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
        logger.info('Price polling service is not running');
        return;
    }

    logger.info('Stopping price polling service...');


    if (tokenIntervalId) {
        clearInterval(tokenIntervalId);
        tokenIntervalId = null;
    }
    pollingState.isRunning = false;
    logger.info('Price polling service stopped');
}

// Restart the price polling service
export function restartPricePolling(): void {
    logger.info('Restarting price polling service...');
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
    logger.info('Intervals updated', {
        tokenInterval: TOKEN_INTERVAL / 1000,
    });
}

// Force an immediate price update for all tokens
export async function forceUpdate(): Promise<CurrentPrices> {
    logger.info('Forcing immediate price update...');

    await Promise.all([
        pollAllPrices()
    ]);

    return getStoredCurrentPrices();
}

// Calculate estimated monthly API calls
export function calculateMonthlyCalls(): void {
    const minutesPerMonth = 43200; // 30 days
    const totalCalls = minutesPerMonth / (TOKEN_INTERVAL / 60000)

    logger.info('Estimated Monthly API Usage', {
        totalCalls: Math.ceil(totalCalls),
        remainingBuffer: 50000 - Math.ceil(totalCalls)
    });
}

// Graceful shutdown handlers
process.on('SIGINT', () => {
    logger.info('[SIGINT] Received interrupt signal, shutting down gracefully...');
    stopPricePolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('[SIGTERM] Received termination signal, shutting down gracefully...');
    stopPricePolling();
    process.exit(0);
});

// Export types
export type { CurrentPrices, TokenPrices, PollingState };