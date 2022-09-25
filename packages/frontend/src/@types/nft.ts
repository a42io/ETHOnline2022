export type NFTTokenType = 'ERC721' | 'ERC1155';

export type NFT = {
    chainId: string;
    tokenType: NFTTokenType;
    contractAddress: string;
    tokenId?: string;
};

export type TokenType = NFTTokenType & 'ENS';

export const supportedChainIds = ['1', '10', '137', '42161'];
