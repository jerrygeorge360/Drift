import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertSepoliaTokens() {
    try {
        console.log('🪙 Checking existing tokens in database...');
        const existingTokens = await prisma.token.findMany();
        console.log(`Found ${existingTokens.length} existing tokens:`);
        existingTokens.forEach(token => {
            console.log(`  - ${token.symbol}: ${token.address}`);
        });

        // Sepolia test tokens
        const sepoliaTokens = [
            {
                symbol: 'DAI',
                name: 'Test DAI (Sepolia)',
                address: '0xAd22b4EC8cdd8A803d0052632566F6334A04F1F3',
                decimals: 18
            },
            {
                symbol: 'USDC',
                name: 'Test USDC (Sepolia)',
                address: '0xcF9884827F587Cd9a0bDce33995B2333eE7e8285',
                decimals: 6
            },
            {
                symbol: 'USDT',
                name: 'Test USDT (Sepolia)',
                address: '0x1861BB06286aAb0fDA903620844b4Aef4894b719',
                decimals: 6
            },
            {
                symbol: 'WBTC',
                name: 'Test WBTC (Sepolia)',
                address: '0x4267652AF61B4bE50A39e700ee2a160f42371f54',
                decimals: 8
            }
        ];

        console.log('\n🚀 Inserting Sepolia tokens...');
        
        for (const tokenData of sepoliaTokens) {
            try {
                // Check if token already exists by address
                const existingToken = await prisma.token.findUnique({
                    where: { address: tokenData.address }
                });

                if (existingToken) {
                    console.log(`⚠️  Token ${tokenData.symbol} already exists at ${tokenData.address}, skipping...`);
                    continue;
                }

                // Check if symbol exists (you might want different symbols for different networks)
                const symbolExists = await prisma.token.findUnique({
                    where: { symbol: tokenData.symbol }
                });

                if (symbolExists) {
                    // Modify symbol to be network-specific
                    tokenData.symbol = `${tokenData.symbol}_SEPOLIA`;
                    console.log(`🔄 Modified symbol to ${tokenData.symbol} to avoid conflict`);
                }

                // Insert new token
                const newToken = await prisma.token.create({
                    data: tokenData
                });

                console.log(`✅ Inserted: ${newToken.symbol} (${newToken.name}) at ${newToken.address}`);
                
            } catch (insertError) {
                console.error(`❌ Failed to insert ${tokenData.symbol}:`, insertError);
            }
        }

        console.log('\n📊 Final token list:');
        const finalTokens = await prisma.token.findMany({
            orderBy: { symbol: 'asc' }
        });
        
        finalTokens.forEach(token => {
            console.log(`  ${token.symbol}: ${token.name} -> ${token.address}`);
        });

        console.log('\n✅ Sepolia tokens insertion completed!');

    } catch (error) {
        console.error('❌ Error inserting tokens:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
insertSepoliaTokens().catch(console.error);
