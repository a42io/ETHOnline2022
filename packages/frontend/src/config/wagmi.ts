import { chain, configureChains, createClient, defaultChains } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public'

const { chains, provider, webSocketProvider } = configureChains(
    [...defaultChains, chain.polygon, chain.arbitrum],
    [alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY }), publicProvider()]
);

export default function createWagumiClient() {
    return createClient({
        autoConnect: true,
        connectors: [
            new MetaMaskConnector({ chains }),
            new WalletConnectConnector({
                chains,
                options: {
                    qrcode: true,
                    qrcodeModalOptions: {
                        desktopLinks: [
                            'ledger',
                            'tokenary',
                            'wallet',
                            'wallet 3',
                        ],
                        mobileLinks: ['metamask', 'rainbow', 'argent', 'trust'],
                    },
                },
            }),
        ],
        provider,
        webSocketProvider,
    });
}
