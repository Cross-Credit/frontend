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
];

export const TOKENS = [
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "DAI", name: "Dai" },
  { symbol: "ETH", name: "Ethereum" },
];

export function mockConnectWallet() {
  return new Promise<{ address: string }>((resolve) => {
    setTimeout(() => resolve({ address: "0x1234...abcd" }), 800);
  });
}

export function mockSwitchChain(chainId: number) {
  return new Promise<{ success: boolean }>((resolve) => {
    setTimeout(() => resolve({ success: true }), 600);
  });
}

export function mockGetBalances(address: string) {
  return new Promise<{ [symbol: string]: number }>((resolve) => {
    setTimeout(
      () =>
        resolve({
          USDC: 1200.5,
          USDT: 800.0,
          DAI: 500.25,
          ETH: 2.34,
        }),
      700
    );
  });
}

export function mockGetAPY(token: string, chainId: number) {
  return 4.5 + Math.random() * 2; // 4.5% - 6.5%
}

export function mockGetInterestRate(token: string, chainId: number) {
  return 6.0 + Math.random() * 2; // 6% - 8%
}

export function mockGetPortfolio(address: string) {
  return new Promise<{ supplied: number; borrowed: number; netAPY: number }>((resolve) => {
    setTimeout(
      () =>
        resolve({
          supplied: 2500.0,
          borrowed: 900.0,
          netAPY: 3.8,
        }),
      600
    );
  });
}

export function mockGetRecentTransactions(address: string) {
  return new Promise<
    { type: "lend" | "borrow"; token: string; amount: number; chain: string; date: string }[]
  >((resolve) => {
    setTimeout(
      () =>
        resolve([
          { type: "lend", token: "USDC", amount: 500, chain: "Ethereum", date: "2024-06-01" },
          { type: "borrow", token: "DAI", amount: 200, chain: "Polygon", date: "2024-06-02" },
        ]),
      500
    );
  });
}
