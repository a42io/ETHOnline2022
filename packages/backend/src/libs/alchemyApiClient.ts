import axios from 'axios';

export const mainnetApiClient = axios.create({
    baseURL: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
});

export const maticApiClient = axios.create({
    baseURL: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_MATIC_API_KEY}`,
});

export const optimismApiClient = axios.create({
    baseURL: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_OPTIMISM_API_KEY}`,
});

export const arbitrumApiClient = axios.create({
    baseURL: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ARBITRUM_API_KEY}`,
});

export function getAlchemyApiClient(chainId: string) {
    let provider;
    if (chainId === '1') {
        provider = mainnetApiClient;
    } else if (chainId === '137') {
        provider = maticApiClient;
    } else if (chainId === '10') {
        provider = optimismApiClient;
    } else if (chainId === '42161') {
        provider = arbitrumApiClient;
    } else {
        provider = mainnetApiClient;
    }
    return provider;
}
