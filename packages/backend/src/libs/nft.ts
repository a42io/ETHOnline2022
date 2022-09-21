import wcmatch from 'wildcard-match';
import { AllowListENS, AllowListNFT, AllowListValue } from '~/entities/event';
import { getProvider, mainnetProvider } from '~/libs/web3providers';
import {
    Mock__factory as ERC721MockFactory,
    Mock1155__factory as ERC1155MockFactory,
} from '~/libs/contractMock';
import { BigNumber } from 'ethers';
import { getAlchemyApiClient } from '~/libs/alchemyApiClient';
import * as ethers from 'ethers';

export function isAllowListIncluded(
    ensOrNFT: AllowListValue | Omit<AllowListValue, 'availableUsageCount'>,
    allowlistNFT: Array<AllowListValue>
): {
    isIncluded: boolean;
    allowListValue?: AllowListValue;
} {
    const val = allowlistNFT.find((val) => {
        if (val.tokenType === 'ENS' && ensOrNFT.tokenType === 'ENS') {
            const match = wcmatch((val as AllowListENS).ens, {
                separator: '.',
            });
            return match((ensOrNFT as AllowListENS).ens);
        } else {
            const { chainId, contractAddress, tokenId } =
                ensOrNFT as AllowListNFT;
            const {
                chainId: targetChainId,
                contractAddress: targetContractAddress,
                tokenId: targetTokenId,
            } = val as AllowListNFT;

            return (
                `${chainId}/${contractAddress}/${tokenId}`.toLowerCase() ===
                    `${targetChainId}/${targetContractAddress}/${targetTokenId}`.toLowerCase() ||
                `${chainId}/${contractAddress}`.toLowerCase() ===
                    `${targetChainId}/${targetContractAddress}`.toLowerCase()
            );
        }
    });

    return {
        isIncluded: !!val,
        allowListValue: val,
    };
}

export async function isOwner(
    account: string,
    chainId: string,
    tokenType: 'ERC721' | 'ERC1155',
    contractAddress: string,
    tokenId?: string
): Promise<boolean> {
    const provider = getProvider(chainId);

    try {
        // ERC721 contractAddress のみの場合 - ownerOf
        // ERC721 tokenId 有りの場合 - balanceOf > 0
        if (tokenType === 'ERC721') {
            const contract = ERC721MockFactory.connect(
                contractAddress,
                provider
            );
            if (tokenId) {
                const owner = await contract.ownerOf(tokenId);
                return owner === account;
            } else {
                const balance = await contract.balanceOf(account);
                return balance > BigNumber.from(0);
            }
        } else {
            // ERC1155 tokenId 有りの場合 - balanceOf > 0
            // ERC1155 contractAddress のみの場合 - alchemy.getNFTs
            if (tokenId) {
                const contract = ERC1155MockFactory.connect(
                    contractAddress,
                    provider
                );
                const balance = await contract.balanceOf(account, tokenId);
                return balance > BigNumber.from(0);
            } else {
                const apiClient = await getAlchemyApiClient(chainId);
                const { data } = await apiClient.get('/getNFTs', {
                    params: {
                        owner: account,
                        'contractAddresses[]': contractAddress,
                    },
                });
                return data.ownedNfts && data.ownedNfts.length > 0;
            }
        }
    } catch (e) {
        return false;
    }
}

export async function lookupAddress(
    ens: string
): Promise<{ address: string | null; ens: string | null }> {
    try {
        const resolvedAddress = await mainnetProvider.resolveName(ens);
        if (resolvedAddress) return { address: resolvedAddress, ens };
        return { ens: null, address: null };
    } catch (e) {
        return { ens: null, address: null };
    }
}

export function isValidAddress(address: string): boolean {
    try {
        ethers.utils.getAddress(address);
        return true;
    } catch (e) {
        console.warn(e);
        return false;
    }
}

export function isValidTokenId(tokenId: string): boolean {
    try {
        ethers.BigNumber.from(tokenId);
        return true;
    } catch (e) {
        console.warn(e);
        return false;
    }
}
