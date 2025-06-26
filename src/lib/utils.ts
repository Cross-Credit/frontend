import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export const CHAINS = [
  { name: "Ethereum", id: 1 },
  { name: "Polygon", id: 137 },
  { name: "Arbitrum", id: 42161 },
  { name: "Optimism", id: 10 },
  { name: "Sepolia", id: 11155111 },
];

export const TOKENS = [
  {
    symbol: "USDC",
    name: "USD Coin",
    addresses: {
      ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      optimism: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      sepolia: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // TODO: Replace with real Sepolia USDC address
    },
    decimals: 6,
    isNative: false,
  },
  {
    symbol: "USDT",
    name: "Tether",
    addresses: {
      ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      optimism: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      sepolia: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06", // TODO: Replace with real Sepolia USDT address
    },
    decimals: 6,
    isNative: false,
  },
  {
    symbol: "DAI",
    name: "Dai",
    addresses: {
      ethereum: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      arbitrum: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      optimism: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      polygon: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      sepolia: "0x53844F9577C2334e541Aec7Df7174ECe5dF1fCf0	", // TODO: Replace with real Sepolia DAI address
    },
    decimals: 18,
    isNative: false,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    addresses: {
      ethereum: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
      arbitrum: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH
      optimism: "0x4200000000000000000000000000000000000006", // WETH
      polygon: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
      sepolia: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14	", // TODO: Replace with real Sepolia WETH address
    },
    decimals: 18,
    isNative: true, // Flag for native ETH handling
  },
] as const;





