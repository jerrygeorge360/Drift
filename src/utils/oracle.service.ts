// utils/oracle.service.ts

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

// Token groups
const VOLATILE_TOKENS = ['wrapped-bitcoin', 'weth', 'wrapped-solana'] as const;
const STABLE_TOKENS = ['usd-coin', 'tether'] as const;

// Polling intervals (in milliseconds) - Can be updated

let TOKEN_INTERVAL = 2 * 60 * 1000;

// Store latest prices
let latestPrices: TokenPrices = {};
let lastPriceUpdate: Date | null = null;

// Polling state
let pollingState: PollingState = {
    isRunning: false,
    lastVolatileUpdate: null,
    lastStableUpdate: null,
    callsToday: 0,
    startOfDay: new Date().setHours(0, 0, 0, 0),
    consecutiveFailures: 0
};

// Store interval IDs
// let volatileIntervalId: NodeJS.Timeout | null = null;
// let stableIntervalId: NodeJS.Timeout | null = null;
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
        // Merge token lists
        const allTokens = [...VOLATILE_TOKENS, ...STABLE_TOKENS];

        // Fetch all prices with retry
        const prices = await fetchWithRetry(allTokens);

        if (!prices) {
            console.warn('⚠️ No prices fetched');
            return null;
        }

        // Update latestPrices object
        Object.assign(latestPrices, prices);

        // Update polling state timestamps
        const now = new Date();
        pollingState.lastVolatileUpdate = now;
        pollingState.lastStableUpdate = now;
        lastPriceUpdate = now;

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

        console.log(`[${new Date().toISOString()}] ✓ All tokens updated`, {
            WBTC: structuredPrices['wrapped-bitcoin']?.usd,
            WETH: structuredPrices['weth']?.usd,
            WSOL: structuredPrices['wrapped-solana']?.usd,
            USDC: structuredPrices['usd-coin']?.usd,
            USDT: structuredPrices['tether']?.usd
        });
        const webhookUrl = 'http://localhost:4000/api/delegations/webhook';
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ botName:'Drift',marketData: structuredPrices,agentMode:'auto' })
        });

        if (!response.ok) {
            console.error(`❌ Webhook call failed: ${response.status} ${response.statusText}`);
        } else {
            console.log(`✅ Webhook called successfully at ${webhookUrl}`);
        }

        return structuredPrices;

    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] ❌ Failed to poll prices:`, error.message);
        return null;
    }
}
/**
 * Get current prices for all tokens (simple format)
 * @returns {CurrentPrices} - Latest price data for all tokens
 */
export function getCurrentPrices(): CurrentPrices {
    return {
        USDC: latestPrices['usd-coin']?.usd ?? null,
        USDT: latestPrices['tether']?.usd ?? null,
        WBTC: latestPrices['wrapped-bitcoin']?.usd ?? null,
        WETH: latestPrices['weth']?.usd ?? null,
        WSOL: latestPrices['wrapped-solana']?.usd ?? null
    };
}

/**
 * Get market data in the format expected by the bot
 * @returns Market data with full details for all tokens
 */
export function getMarketDataForBot(): Record<string, {
    usd: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
    last_updated_at: number;
}> {
    const marketData: Record<string, any> = {};

    // Map CoinGecko IDs to your token symbols
    const tokenMapping: Record<string, string> = {
        'wrapped-bitcoin': 'bitcoin',
        'weth': 'ethereum',
        'wrapped-solana': 'solana',
        'usd-coin': 'usd-coin',
        'tether': 'tether'
    };

    // Transform the data
    for (const [coinGeckoId, tokenId] of Object.entries(tokenMapping)) {
        const priceData = latestPrices[coinGeckoId];

        if (priceData) {
            marketData[tokenId] = {
                usd: priceData.usd || 0,
                usd_market_cap: priceData.usd_market_cap || 0,
                usd_24h_vol: priceData.usd_24h_vol || 0,
                usd_24h_change: priceData.usd_24h_change || 0,
                last_updated_at: priceData.last_updated_at || Math.floor(Date.now() / 1000)
            };
        }
    }

    return marketData;
}

/**
 * Trigger webhook with market data
 * @param webhookUrl - The webhook URL to call
 * @param botName - The bot ID to send
 */
export async function triggerWebhook(webhookUrl: string, botName: string): Promise<void> {
    try {
        const marketData = getMarketDataForBot();

        if (Object.keys(marketData).length === 0) {
            console.warn('⚠️ No market data available, skipping webhook call');
            return;
        }

        console.log(`📤 Calling webhook: ${webhookUrl}`);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                botName,
                marketData,
                agentMode: 'auto'
            })
        });

        if (!response.ok) {
            throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ Webhook call successful: ${result.message || 'OK'}`);

    } catch (error: any) {
        console.error(`❌ Webhook call failed:`, error.message);
        throw error;
    }
}

/**
 * Get market data for specific tokens only
 * @param tokenIds - Array of token IDs to fetch
 */
export function getMarketDataForTokens(tokenIds: string[]): Record<string, {
    usd: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
    last_updated_at: number;
}> {
    const allMarketData = getMarketDataForBot();
    const filteredData: Record<string, any> = {};

    for (const tokenId of tokenIds) {
        const normalizedId = tokenId.toLowerCase();
        if (allMarketData[normalizedId]) {
            filteredData[normalizedId] = allMarketData[normalizedId];
        }
    }

    return filteredData;
}

/**
 * Check if market data is available and fresh
 * @param maxAgeMinutes - Maximum age of data in minutes (default: 5)
 */
export function isMarketDataFresh(maxAgeMinutes: number = 5): boolean {
    if (!lastPriceUpdate) return false;

    const ageInMinutes = (Date.now() - lastPriceUpdate.getTime()) / (1000 * 60);
    return ageInMinutes <= maxAgeMinutes;
}

/**
 * Get market data with freshness check
 * @param maxAgeMinutes - Maximum acceptable age in minutes
 * @returns Market data or forces update if stale
 */
export async function getMarketDataWithFreshnessCheck(maxAgeMinutes: number = 5) {
    if (!isMarketDataFresh(maxAgeMinutes)) {
        console.warn(`⚠️ Market data is stale (last update: ${lastPriceUpdate})`);
        console.log(`🔄 Forcing immediate update...`);
        await forceUpdate();
    }

    return getMarketDataForBot();
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

    // console.log('Starting tiered price polling service...');
    // console.log(`- Volatile tokens (WBTC, WETH, WSOL): Every ${VOLATILE_INTERVAL / 1000}s`);
    // console.log(`- Stable tokens (USDC, USDT): Every ${STABLE_INTERVAL / 1000}s`);
    console.log(`- Timeout: ${FETCH_TIMEOUT / 1000}s per request`);
    console.log(`- Retries: ${MAX_RETRIES} attempts with exponential backoff`);

    // Reset failure counter on manual start
    pollingState.consecutiveFailures = 0;

    // Initial fetch for both groups
    // pollVolatilePrices();
    // pollStablePrices();
    pollAllPrices();
    // Set up intervals

    tokenIntervalId = setInterval(pollAllPrices,TOKEN_INTERVAL)
    pollingState.isRunning = true;

    // Return stop function
    return stopPricePolling;
}

/**
 * Stop the price polling service
 */
export function stopPricePolling(): void {
    if (!pollingState.isRunning) {
        console.log('Price polling service is not running');
        return;
    }

    console.log('Stopping price polling service...');

    // if (volatileIntervalId) {
    //     clearInterval(volatileIntervalId);
    //     volatileIntervalId = null;
    // }
    //
    // if (stableIntervalId) {
    //     clearInterval(stableIntervalId);
    //     stableIntervalId = null;
    // }


    if (tokenIntervalId) {
        clearInterval(tokenIntervalId);
        tokenIntervalId = null;
    }
    pollingState.isRunning = false;
    console.log('Price polling service stopped');
}

/**
 * Restart the price polling service
 */
export function restartPricePolling(): void {
    console.log('Restarting price polling service...');
    stopPricePolling();

    // Small delay before restarting
    setTimeout(() => {
        startPricePolling();
    }, 1000);
}

/**
 * Get polling status and statistics
 */
export function getPollingStatus() {
    resetDailyCounterIfNeeded();

    const minutesPerMonth = 43200; // 30 days
    // const volatileCalls = minutesPerMonth / (VOLATILE_INTERVAL / 60000);
    // const stableCalls = minutesPerMonth / (STABLE_INTERVAL / 60000);
    const allCalls = minutesPerMonth / (TOKEN_INTERVAL / 60000);
    const estimatedMonthlyCalls = Math.ceil(allCalls);

    return {
        isRunning: pollingState.isRunning,
        // volatileInterval: VOLATILE_INTERVAL / 1000, // in seconds
        // stableInterval: STABLE_INTERVAL / 1000, // in seconds
        tokenInterval: TOKEN_INTERVAL/ 1000, // in seconds
        lastVolatileUpdate: pollingState.lastVolatileUpdate,
        lastStableUpdate: pollingState.lastStableUpdate,
        lastPriceUpdate,
        callsToday: pollingState.callsToday,
        estimatedMonthlyCalls,
        remainingMonthlyBuffer: 50000 - estimatedMonthlyCalls,
        consecutiveFailures: pollingState.consecutiveFailures,
        healthStatus: pollingState.consecutiveFailures === 0 ? 'healthy' :
            pollingState.consecutiveFailures < 3 ? 'degraded' : 'critical',
        dataFreshness: isMarketDataFresh() ? 'fresh' : 'stale'
    };
}

/**
 * Update polling intervals (requires restart to take effect)
 */
export function updateIntervals(allSeconds?:number): void {
    // if (volatileSeconds !== undefined) {
    //     if (volatileSeconds < 10 || volatileSeconds > 3600) {
    //         throw new Error('Volatile interval must be between 10 and 3600 seconds');
    //     }
    //     VOLATILE_INTERVAL = volatileSeconds * 1000;
    // }

    // if (stableSeconds !== undefined) {
    //     if (stableSeconds < 60 || stableSeconds > 7200) {
    //         throw new Error('Stable interval must be between 60 and 7200 seconds');
    //     }
    //     STABLE_INTERVAL = stableSeconds * 1000;
    // }

    if (allSeconds !== undefined) {
        if (allSeconds < 60 || allSeconds > 7200) {
            throw new Error('token interval must be between 60 and 7200 seconds');
        }
        TOKEN_INTERVAL = allSeconds * 1000;
    }
    console.log('Intervals updated:', {
        // volatileInterval: VOLATILE_INTERVAL / 1000,
        // stableInterval: STABLE_INTERVAL / 1000,
        tokenInterval: TOKEN_INTERVAL / 1000,
    });
}

/**
 * Force an immediate price update for all tokens
 */
export async function forceUpdate(): Promise<CurrentPrices> {
    console.log('Forcing immediate price update...');

    await Promise.all([
        pollAllPrices()
    ]);

    return getCurrentPrices();
}

/**
 * Calculate estimated monthly API calls
 */
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