import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const sepoliaTokens = [
    {
        symbol: 'DAI',
        name: 'Test DAI',
        address: '0xAd22b4EC8cdd8A803d0052632566F6334A04F1F3',
        decimals: 18,
    },
    {
        symbol: 'USDC',
        name: 'Test USD Coin',
        address: '0xcF9884827F587Cd9a0bDce33995B2333eE7e8285',
        decimals: 6,
    },
    {
        symbol: 'USDT',
        name: 'Test Tether USD',
        address: '0x1861BB06286aAb0fDA903620844b4Aef4894b719',
        decimals: 6,
    },
    {
        symbol: 'WBTC',
        name: 'Test Wrapped Bitcoin',
        address: '0x4267652AF61B4bE50A39e700ee2a160f42371f54',
        decimals: 8,
    },
];

const sepoliaContractConfigs = [
    {
        name: 'PortfolioFactory_Sepolia',
        contractAddress: '0x49C17A91672c629543a14782809E246296317bA3',
        network: 'sepolia',
        owner: '0x0000000000000000000000000000000000000000', // Update with actual owner
        paused: false,
    },
    {
        name: 'UniswapV2Factory_Sepolia',
        contractAddress: '0xF62c03E08ada871A0bEb309762E260a7a6a880E6',
        network: 'sepolia',
        owner: '0x0000000000000000000000000000000000000000', // Update with actual owner
        paused: false,
    },
    {
        name: 'UniswapV2Router02_Sepolia',
        contractAddress: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3',
        network: 'sepolia',
        owner: '0x0000000000000000000000000000000000000000', // Update with actual owner
        paused: false,
    },
];

async function addSepoliaTokens() {
    try {
        console.log('🚀 Starting to add Sepolia tokens and contracts...');

        // Add tokens
        console.log('📝 Adding Sepolia test tokens...');
        for (const token of sepoliaTokens) {
            try {
                const result = await prisma.token.upsert({
                    where: { address: token.address },
                    update: {
                        symbol: token.symbol,
                        name: token.name,
                        decimals: token.decimals,
                    },
                    create: {
                        symbol: token.symbol,
                        name: token.name,
                        address: token.address,
                        decimals: token.decimals,
                    },
                });
                console.log(`✅ Added/Updated ${token.symbol}: ${token.address}`);
            } catch (error) {
                if (error instanceof Error && error.message.includes('Unique constraint')) {
                    console.log(`⚠️  Token ${token.symbol} with address ${token.address} already exists`);
                } else {
                    console.error(`❌ Error adding token ${token.symbol}:`, error);
                }
            }
        }

        // Add contract configurations
        console.log('🔧 Adding Sepolia contract configurations...');
        for (const contract of sepoliaContractConfigs) {
            try {
                const result = await prisma.contractConfig.upsert({
                    where: { contractAddress: contract.contractAddress },
                    update: {
                        name: contract.name,
                        network: contract.network,
                        owner: contract.owner,
                        paused: contract.paused,
                    },
                    create: {
                        name: contract.name,
                        contractAddress: contract.contractAddress,
                        network: contract.network,
                        owner: contract.owner,
                        paused: contract.paused,
                    },
                });
                console.log(`✅ Added/Updated contract ${contract.name}: ${contract.contractAddress}`);
            } catch (error) {
                if (error instanceof Error && error.message.includes('Unique constraint')) {
                    console.log(`⚠️  Contract ${contract.name} already exists`);
                } else {
                    console.error(`❌ Error adding contract ${contract.name}:`, error);
                }
            }
        }

        // Verify the data
        console.log('\n📊 Verifying added data...');
        const tokenCount = await prisma.token.count();
        const contractCount = await prisma.contractConfig.count();
        const sepoliaTokenCount = await prisma.token.count({
            where: {
                address: {
                    in: sepoliaTokens.map(t => t.address)
                }
            }
        });
        const sepoliaContractCount = await prisma.contractConfig.count({
            where: { network: 'sepolia' }
        });

        console.log(`📈 Total tokens in database: ${tokenCount}`);
        console.log(`📈 Sepolia tokens added: ${sepoliaTokenCount}`);
        console.log(`📈 Total contracts in database: ${contractCount}`);
        console.log(`📈 Sepolia contracts added: ${sepoliaContractCount}`);

        console.log('\n🎉 Successfully added Sepolia tokens and contracts!');

    } catch (error) {
        console.error('💥 Error adding Sepolia data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    addSepoliaTokens()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

export { addSepoliaTokens };
