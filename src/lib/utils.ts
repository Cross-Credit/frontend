import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { avalancheFuji } from "viem/chains";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



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
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    addresses: {
      sepolia: "0x779877A7B0D9E8603169DdbD7836e478b4624789", // Sepolia LINK address
      avalancheFuji: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846", // Avalanche Fuji LINK address
    },
    decimals: 18,
    isNative: false, // Not native, needs to be wrapped
    networks: [11155111] as const, // Only available on Sepolia
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    addresses: {
      sepolia: "", // AVAX is not natively available on Sepolia - would need bridged version
      avalancheFuji: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c", // Avalanche Fuji WAVAX address
    },
    decimals: 18,
    isNative: false, // Not native on these networks, needs to be wrapped
    networks: [43113] as const, // Only available on Avalanche Fuji
  },
] as const;

// Helper function to get available tokens for a specific network
export function getAvailableTokens(chainId: number) {
  return TOKENS.filter(token => (token.networks as readonly number[]).includes(chainId));
}

//0x92d682351F0E2Bdf19f63e77e97fa8f534D8D673 faucet addrs


