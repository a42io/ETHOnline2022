import * as ethers from 'ethers';

export const mainnetProvider = new ethers.providers.AlchemyProvider(
    'mainnet',
    process.env.ALCHEMY_MAINNET_API_KEY
);

export const maticProvider = new ethers.providers.AlchemyProvider(
    'matic',
    process.env.ALCHEMY_MATIC_API_KEY
);

export const optimismProvider = new ethers.providers.AlchemyProvider(
    'optimism',
    process.env.ALCHEMY_OPTIMISM_API_KEY
);

export const arbitrumProvider = new ethers.providers.AlchemyProvider(
    'arbitrum',
    process.env.ALCHEMY_ARBITRUM_API_KEY
);
