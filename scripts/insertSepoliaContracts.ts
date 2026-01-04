import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertSepoliaContracts() {
    try {
        // Check existing contracts
        console.log('Checking existing contracts in database...');
        const existingContracts = await prisma.contractConfig.findMany();
        console.log(`Found ${existingContracts.length} existing contracts:`);
        existingContracts.forEach(contract => {
            console.log(`  - ${contract.name}: ${contract.contractAddress} (${contract.network})`);
        });

        // Check existing tokens
        console.log('\nChecking existing tokens in database...');
        const existingTokens = await prisma.token.findMany();
        console.log(`Found ${existingTokens.length} existing tokens:`);
        existingTokens.forEach(token => {
            console.log(`  - ${token.symbol}: ${token.name} at ${token.address}`);
        });

        // Sepolia contracts to insert - only actual contracts, not tokens
        const sepoliaContracts = [
            // Portfolio Management
            {
                name: 'PortfolioFactory_Sepolia',
                contractAddress: '0x49C17A91672c629543a14782809E246296317bA3',
                network: 'sepolia',
                owner: 'system'
            },
            
            
            // DEX Infrastructure
            {
                name: 'UniswapV2Factory_Sepolia',
                contractAddress: '0xF62c03E08ada871A0bEb309762E260a7a6a880E6',
                network: 'sepolia',
                owner: 'uniswap'
            },
            {
                name: 'UniswapV2Router02_Sepolia',
                contractAddress: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3',
                network: 'sepolia',
                owner: 'uniswap'
            }
        ];

        console.log('\nInserting Sepolia contracts...');
        
        for (const contractData of sepoliaContracts) {
            try {
                // Check if contract already exists
                const existingContract = await prisma.contractConfig.findFirst({
                    where: {
                        OR: [
                            { name: contractData.name },
                            { contractAddress: contractData.contractAddress }
                        ]
                    }
                });

                if (existingContract) {
                    console.log(`Contract ${contractData.name} already exists, skipping...`);
                    continue;
                }

                // Insert new contract
                const newContract = await prisma.contractConfig.create({
                    data: contractData
                });

                console.log(`Inserted: ${newContract.name} at ${newContract.contractAddress}`);
                
            } catch (insertError) {
                console.error(`Failed to insert ${contractData.name}:`, insertError);
            }
        }

        // Sepolia test tokens
        const sepoliaTokens = [
            {
                symbol: 'DAI_SEPOLIA',
                name: 'Test DAI (Sepolia)',
                address: '0xAd22b4EC8cdd8A803d0052632566F6334A04F1F3',
                decimals: 18
            },
            {
                symbol: 'USDC_SEPOLIA',
                name: 'Test USDC (Sepolia)',
                address: '0xcF9884827F587Cd9a0bDce33995B2333eE7e8285',
                decimals: 6
            },
            {
                symbol: 'USDT_SEPOLIA',
                name: 'Test USDT (Sepolia)',
                address: '0x1861BB06286aAb0fDA903620844b4Aef4894b719',
                decimals: 6
            },
            {
                symbol: 'WBTC_SEPOLIA',
                name: 'Test WBTC (Sepolia)',
                address: '0x4267652AF61B4bE50A39e700ee2a160f42371f54',
                decimals: 8
            }
        ];

        console.log('\nInserting Sepolia tokens...');
        
        for (const tokenData of sepoliaTokens) {
            try {
                // Check if token already exists by address (addresses must be unique)
                const existingToken = await prisma.token.findUnique({
                    where: { address: tokenData.address }
                });

                if (existingToken) {
                    console.log(`Token ${tokenData.symbol} already exists at ${tokenData.address}, skipping...`);
                    continue;
                }

                // Check if symbol exists (symbols must be unique)
                const symbolExists = await prisma.token.findUnique({
                    where: { symbol: tokenData.symbol }
                });

                if (symbolExists) {
                    console.log(`Token symbol ${tokenData.symbol} already exists, skipping...`);
                    continue;
                }

                // Insert new token
                const newToken = await prisma.token.create({
                    data: tokenData
                });

                console.log(`Inserted token: ${newToken.symbol} (${newToken.name}) at ${newToken.address}`);
                
            } catch (insertError) {
                console.error(`Failed to insert token ${tokenData.symbol}:`, insertError);
            }
        }

        console.log('\nFinal contract list:');
        const finalContracts = await prisma.contractConfig.findMany({
            orderBy: [
                { network: 'asc' },
                { name: 'asc' }
            ]
        });
        
        finalContracts.forEach(contract => {
            console.log(`  ${contract.network}: ${contract.name} -> ${contract.contractAddress}`);
        });

        console.log('\nFinal token list:');
        const finalTokens = await prisma.token.findMany({
            orderBy: { symbol: 'asc' }
        });
        
        finalTokens.forEach(token => {
            console.log(`  ${token.symbol}: ${token.name} -> ${token.address} (${token.decimals} decimals)`);
        });

        console.log('\nSepolia contracts and tokens insertion completed!');

    } catch (error) {
        console.error('Error inserting contracts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
insertSepoliaContracts().catch(console.error);
