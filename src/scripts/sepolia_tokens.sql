-- Add Sepolia Test Tokens
INSERT INTO "Token" (id, symbol, name, address, decimals, "createdAt", "updatedAt") 
VALUES 
    (gen_random_uuid(), 'DAI', 'Test DAI', '0xAd22b4EC8cdd8A803d0052632566F6334A04F1F3', 18, NOW(), NOW()),
    (gen_random_uuid(), 'USDC', 'Test USD Coin', '0xcF9884827F587Cd9a0bDce33995B2333eE7e8285', 6, NOW(), NOW()),
    (gen_random_uuid(), 'USDT', 'Test Tether USD', '0x1861BB06286aAb0fDA903620844b4Aef4894b719', 6, NOW(), NOW()),
    (gen_random_uuid(), 'WBTC', 'Test Wrapped Bitcoin', '0x4267652AF61B4bE50A39e700ee2a160f42371f54', 8, NOW(), NOW())
ON CONFLICT (address) DO UPDATE SET
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    decimals = EXCLUDED.decimals,
    "updatedAt" = NOW();

-- Add Sepolia Contract Configurations
INSERT INTO "ContractConfig" (id, "contractAddress", network, owner, paused, "updatedAt", name)
VALUES 
    (gen_random_uuid(), '0x49C17A91672c629543a14782809E246296317bA3', 'sepolia', '0x0000000000000000000000000000000000000000', false, NOW(), 'PortfolioFactory_Sepolia'),
    (gen_random_uuid(), '0xF62c03E08ada871A0bEb309762E260a7a6a880E6', 'sepolia', '0x0000000000000000000000000000000000000000', false, NOW(), 'UniswapV2Factory_Sepolia'),
    (gen_random_uuid(), '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3', 'sepolia', '0x0000000000000000000000000000000000000000', false, NOW(), 'UniswapV2Router02_Sepolia')
ON CONFLICT ("contractAddress") DO UPDATE SET
    name = EXCLUDED.name,
    network = EXCLUDED.network,
    owner = EXCLUDED.owner,
    paused = EXCLUDED.paused,
    "updatedAt" = NOW();

-- Verify the insertions
SELECT 'Tokens' as type, symbol, name, address, decimals FROM "Token" 
WHERE address IN (
    '0xAd22b4EC8cdd8A803d0052632566F6334A04F1F3',
    '0xcF9884827F587Cd9a0bDce33995B2333eE7e8285',
    '0x1861BB06286aAb0fDA903620844b4Aef4894b719',
    '0x4267652AF61B4bE50A39e700ee2a160f42371f54'
)
UNION ALL
SELECT 'Contracts' as type, name, network, "contractAddress", 0 as decimals FROM "ContractConfig"
WHERE network = 'sepolia';
