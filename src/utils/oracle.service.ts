// Types
interface TokenPrices {
    [key: string]: {
        usd: number;
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
}

type StopPollingFunction = () => void;

// Configuration
const API_KEY = process.env.COIN_GECKO_API_KEY;
if (!API_KEY) {
    throw new Error('Please add coin gecko api key to .env');
}
const BASE_URL = 'https://api.coingecko.com/api/v3/simple/price';

// Token groups
const VOLATILE_TOKENS = ['wrapped-bitcoin', 'weth', 'wrapped-solana'] as const;
const STABLE_TOKENS = ['usd-coin', 'tether'] as const;

// Polling intervals (in milliseconds) - Can be updated
let VOLATILE_INTERVAL = 45 * 1000; // 45 seconds
let STABLE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Store latest prices
let latestPrices: TokenPrices = {};
let lastPriceUpdate: Date | null = null;

// Polling state
let pollingState: PollingState = {
    isRunning: false,
    lastVolatileUpdate: null,
    lastStableUpdate: null,
    callsToday: 0,
    startOfDay: new Date().setHours(0, 0, 0, 0)
};

// Store interval IDs
let volatileIntervalId: NodeJS.Timeout | null = null;
let stableIntervalId: NodeJS.Timeout | null = null;

/**
 * Fetch prices from CoinGecko API
 * @param {string[]} tokenIds - Array of token IDs to fetch
 * @returns {Promise<TokenPrices | null>} - Price data
 */
async function fetchPrices(tokenIds: readonly string[]): Promise<TokenPrices | null> {
    const ids = tokenIds.join(',');
    const url = `${BASE_URL}?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true&precision=2`;

    try {

        const response = await fetch(url, {
            headers: {
                'x-cg-pro-api-key': API_KEY
            } as Record<string, string>
        });


        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: TokenPrices = await response.json();

        // Update call tracking
        resetDailyCounterIfNeeded();
        pollingState.callsToday++;

        return data;
    } catch (error) {
        console.error('Error fetching prices:', error);
        return null;
    }
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

/**
 * Poll volatile token prices
 */
async function pollVolatilePrices(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Fetching volatile token prices...`);

    const prices = await fetchPrices(VOLATILE_TOKENS);

    if (prices) {
        // Update latest prices
        Object.assign(latestPrices, prices);
        pollingState.lastVolatileUpdate = new Date();
        lastPriceUpdate = new Date();

        console.log('Volatile tokens updated:', {
            WBTC: prices['wrapped-bitcoin']?.usd,
            WETH: prices['weth']?.usd,
            WSOL: prices['wrapped-solana']?.usd
        });
    }
}

/**
 * Poll stable token prices
 */
async function pollStablePrices(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Fetching stable token prices...`);

    const prices = await fetchPrices(STABLE_TOKENS);

    if (prices) {
        // Update latest prices
        Object.assign(latestPrices, prices);
        pollingState.lastStableUpdate = new Date();
        lastPriceUpdate = new Date();

        console.log('Stable tokens updated:', {
            USDC: prices['usd-coin']?.usd,
            USDT: prices['tether']?.usd
        });
    }
}

/**
 * Get current prices for all tokens
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
 * Start the price polling service
 * @returns {StopPollingFunction} - Function to stop polling
 */
export function startPricePolling(): StopPollingFunction {
    if (pollingState.isRunning) {
        console.log('Price polling service is already running');
        return stopPricePolling;
    }

    console.log('Starting tiered price polling service...');
    console.log(`- Volatile tokens (WBTC, WETH, WSOL): Every ${VOLATILE_INTERVAL / 1000}s`);
    console.log(`- Stable tokens (USDC, USDT): Every ${STABLE_INTERVAL / 1000}s`);

    // Initial fetch for both groups
    pollVolatilePrices();
    pollStablePrices();

    // Set up intervals
    volatileIntervalId = setInterval(pollVolatilePrices, VOLATILE_INTERVAL);
    stableIntervalId = setInterval(pollStablePrices, STABLE_INTERVAL);

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

    if (volatileIntervalId) {
        clearInterval(volatileIntervalId);
        volatileIntervalId = null;
    }

    if (stableIntervalId) {
        clearInterval(stableIntervalId);
        stableIntervalId = null;
    }

    pollingState.isRunning = false;
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
    const volatileCalls = minutesPerMonth / (VOLATILE_INTERVAL / 60000);
    const stableCalls = minutesPerMonth / (STABLE_INTERVAL / 60000);
    const estimatedMonthlyCalls = Math.ceil(volatileCalls + stableCalls);

    return {
        isRunning: pollingState.isRunning,
        volatileInterval: VOLATILE_INTERVAL / 1000, // in seconds
        stableInterval: STABLE_INTERVAL / 1000, // in seconds
        lastVolatileUpdate: pollingState.lastVolatileUpdate,
        lastStableUpdate: pollingState.lastStableUpdate,
        lastPriceUpdate,
        callsToday: pollingState.callsToday,
        estimatedMonthlyCalls,
        remainingMonthlyBuffer: 50000 - estimatedMonthlyCalls
    };
}

/**
 * Update polling intervals (requires restart to take effect)
 */
export function updateIntervals(volatileSeconds?: number, stableSeconds?: number): void {
    if (volatileSeconds !== undefined) {
        if (volatileSeconds < 10 || volatileSeconds > 3600) {
            throw new Error('Volatile interval must be between 10 and 3600 seconds');
        }
        VOLATILE_INTERVAL = volatileSeconds * 1000;
    }

    if (stableSeconds !== undefined) {
        if (stableSeconds < 60 || stableSeconds > 7200) {
            throw new Error('Stable interval must be between 60 and 7200 seconds');
        }
        STABLE_INTERVAL = stableSeconds * 1000;
    }

    console.log('Intervals updated:', {
        volatileInterval: VOLATILE_INTERVAL / 1000,
        stableInterval: STABLE_INTERVAL / 1000
    });
}

/**
 * Force an immediate price update for all tokens
 */
export async function forceUpdate(): Promise<CurrentPrices> {
    console.log('Forcing immediate price update...');

    await Promise.all([
        pollVolatilePrices(),
        pollStablePrices()
    ]);

    return getCurrentPrices();
}

/**
 * Calculate estimated monthly API calls
 */
export function calculateMonthlyCalls(): void {
    const minutesPerMonth = 43200; // 30 days
    const volatileCalls = minutesPerMonth / (VOLATILE_INTERVAL / 60000);
    const stableCalls = minutesPerMonth / (STABLE_INTERVAL / 60000);
    const totalCalls = volatileCalls + stableCalls;

    console.log('\nEstimated Monthly API Usage:');
    console.log(`- Volatile tokens: ~${Math.ceil(volatileCalls)} calls/month`);
    console.log(`- Stable tokens: ~${Math.ceil(stableCalls)} calls/month`);
    console.log(`- Total: ~${Math.ceil(totalCalls)} calls/month`);
    console.log(`- Remaining buffer: ~${50000 - Math.ceil(totalCalls)} calls\n`);
}

// Export types
export type { CurrentPrices, TokenPrices, PollingState };