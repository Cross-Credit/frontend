import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Deployed Contract Addresses from Blockchain Developer
export const DEPLOYED_CONTRACTS = {
  // Router Addresses (Cross-Chain Infrastructure)
  AVALANCHE_FUJI_ROUTER: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
  ETHEREUM_SEPOLIA_ROUTER: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  
  // LINK Token Addresses
  AVALANCHE_FUJI_LINK_TOKEN: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
  ETHEREUM_SEPOLIA_LINK_TOKEN: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  
  // Native Token Representation
  NATIVE_TOKEN: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  
  // Chain Selectors
  ETH_SEPOLIA_CHAIN_SELECTOR: "16015286601757825753",
  AVALANCHE_FUJI_CHAIN_SELECTOR: "14767482510784806043",
  
  // Deployed CrossCredit Contract Addresses (Need to be updated with actual deployed addresses)
  // These will be the addresses where the CrossCredit contracts were actually deployed
  CROSS_CREDIT_SEPOLIA: "0x883B1acd783a66b543b1d4Ee965372B8EaA2d430", // Updated: Actual deployed address
  CROSS_CREDIT_AVALANCHE_FUJI: "0xEA084C9e33B3aC71bCC4788A549B2905f26BfFb2", // Updated: Actual deployed address
} as const;

// Chainlink Price Feed Addresses
export const PRICE_FEEDS = {
  // Sepolia Price Feeds
  ETH_SEPOLIA_ETH_PRICE_FEED: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  ETH_SEPOLIA_LINK_PRICE_FEED: "0xc59E3633BAAC79493d908e63626716e204A45EdF",
  
  // Avalanche Fuji Price Feeds
  AVALANCHE_FUJI_AVAX_PRICE_FEED: "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD",
  AVALANCHE_FUJI_ETH_PRICE_FEED: "0x86d67c3D38D2bCeE722E601025C25a575021c6EA",
  AVALANCHE_FUJI_LINK_PRICE_FEED: "0x34C4c526902d88a3Aa98DB8a9b802603EB1E3470",
} as const;

export const CHAINS = [
  { name: "Sepolia", id: 11155111 },
  { name: "Avalanche Fuji", id: 43113 },
];

export const TOKENS = [
  {
    symbol: "ETH",
    name: "Ethereum",
    addresses: {
      sepolia: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // Sepolia WETH address
      avalancheFuji: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c", // Avalanche Fuji WETH address
    },
    decimals: 18,
    isNative: true, // Flag for native ETH handling
    networks: [11155111, 43113] as const, // Available on both Sepolia and Avalanche Fuji
    priceFeeds: {
      sepolia: PRICE_FEEDS.ETH_SEPOLIA_ETH_PRICE_FEED,
      avalancheFuji: PRICE_FEEDS.AVALANCHE_FUJI_ETH_PRICE_FEED,
    },
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    addresses: {
      sepolia: DEPLOYED_CONTRACTS.ETHEREUM_SEPOLIA_LINK_TOKEN,
      avalancheFuji: DEPLOYED_CONTRACTS.AVALANCHE_FUJI_LINK_TOKEN,
    },
    decimals: 18,
    isNative: false, // Not native, needs to be wrapped
    networks: [11155111, 43113] as const, // Available on both Sepolia and Avalanche Fuji (cross-chain)
    priceFeeds: {
      sepolia: PRICE_FEEDS.ETH_SEPOLIA_LINK_PRICE_FEED,
      avalancheFuji: PRICE_FEEDS.AVALANCHE_FUJI_LINK_PRICE_FEED,
    },
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    addresses: {
      sepolia: null, // AVAX is not natively available on Sepolia - would need bridged version
      avalancheFuji: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c", // Avalanche Fuji WAVAX address
    },
    decimals: 18,
    isNative: false, // Not native on these networks, needs to be wrapped
    networks: [43113] as const, // Only available on Avalanche Fuji
    priceFeeds: {
      sepolia: null, // No price feed on Sepolia
      avalancheFuji: PRICE_FEEDS.AVALANCHE_FUJI_AVAX_PRICE_FEED,
    },
  },
] as const;

// Helper function to get available tokens for a specific network
export function getAvailableTokens(chainId: number) {
  return TOKENS.filter(token => (token.networks as readonly number[]).includes(chainId));
}

// Helper function to get price feed address for a token on a specific network
export function getPriceFeedAddress(tokenSymbol: string, chainId: number): string | null {
  const token = TOKENS.find(t => t.symbol === tokenSymbol);
  if (!token) return null;
  
  const networkKey = chainId === 11155111 ? 'sepolia' : 'avalancheFuji';
  const priceFeed = token.priceFeeds[networkKey];
  return priceFeed || null;
}

// Helper function to get token address for a specific network
export function getTokenAddress(tokenSymbol: string, chainId: number): string | null {
  const token = TOKENS.find(t => t.symbol === tokenSymbol);
  if (!token) return null;
  
  const networkKey = chainId === 11155111 ? 'sepolia' : 'avalancheFuji';
  const address = token.addresses[networkKey];
  return address || null;
}

// Helper function to get the correct CrossCredit contract address for a network
export function getCrossCreditAddress(chainId: number): string {
  switch (chainId) {
    case 11155111: // Sepolia
      const sepoliaAddress = DEPLOYED_CONTRACTS.CROSS_CREDIT_SEPOLIA;
      if (sepoliaAddress === "0x883B1acd783a66b543b1d4Ee965372B8EaA2d430") {
        console.warn("⚠️ Using temporary Sepolia contract address. Please update with actual deployed address.");
      }
      return sepoliaAddress;
    case 43113: // Avalanche Fuji
      const avalancheAddress = DEPLOYED_CONTRACTS.CROSS_CREDIT_AVALANCHE_FUJI;
      if (avalancheAddress === "0xEA084C9e33B3aC71bCC4788A549B2905f26BfFb2") {
        console.warn("⚠️ Using temporary Avalanche Fuji contract address. Please update with actual deployed address.");
      }
      return avalancheAddress;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

//0x92d682351F0E2Bdf19f63e77e97fa8f534D8D673 faucet addrs

// New utility functions for the improved ABI
export function formatAssetDecimals(decimals: number): string {
  return decimals.toString();
}

export function isCrossChainSupported(chainId: number): boolean {
  // Add logic to determine if cross-chain is supported for a given chain
  return chainId === 11155111 || chainId === 80001; // Example: Sepolia and Mumbai
}

export function getCrossChainStatus(isConnected: boolean, chainId?: number): {
  isSupported: boolean;
  status: 'supported' | 'not-supported' | 'not-connected';
} {
  if (!isConnected || !chainId) {
    return { isSupported: false, status: 'not-connected' };
  }
  
  const supported = isCrossChainSupported(chainId);
  return {
    isSupported: supported,
    status: supported ? 'supported' : 'not-supported'
  };
}


