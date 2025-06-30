import { useEffect, useState } from "react";
import { getPriceFeedAddress } from "./utils";
import { readContract } from 'wagmi/actions';

// Chainlink Price Feed ABI (minimal for getting latest price)
const PRICE_FEED_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

export function useTokenPrices(symbols: string[], chainId?: number) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!chainId || chainId === 0) return;

    async function fetchPrices() {
      const result: Record<string, number> = {};
      for (const symbol of symbols) {
        try {
          const priceFeedAddress = getPriceFeedAddress(symbol, chainId as number);
          if (!priceFeedAddress) {
            console.warn(`No price feed found for ${symbol} on chain ${chainId}`);
            result[symbol] = 0;
            continue;
          }
          // Read from Chainlink price feed contract
          const data = await readContract({
            address: priceFeedAddress as `0x${string}`,
            abi: PRICE_FEED_ABI,
            functionName: 'latestRoundData',
            chainId,
          });
          // Chainlink prices are in 8 decimals
          result[symbol] = Number(data[1]) / 1e8;
        } catch (error) {
          console.error(`Error fetching Chainlink price for ${symbol}:`, error);
          result[symbol] = 0;
        }
      }
      setPrices(result);
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, [symbols, chainId]);

  return prices;
}

// Fallback mapping for CoinGecko IDs
function getCoingeckoId(symbol: string): string | null {
  const mapping: Record<string, string> = {
    ETH: "ethereum",
    LINK: "chainlink",
    AVAX: "avalanche-2"
  };
  return mapping[symbol] || null;
}

// TODO: Implement proper Chainlink price feed reading
// This would require using a library like viem or ethers to read from the blockchain
// Example implementation:
/*
async function getChainlinkPrice(priceFeedAddress: string, provider: any): Promise<number> {
  try {
    const contract = new ethers.Contract(priceFeedAddress, PRICE_FEED_ABI, provider);
    const roundData = await contract.latestRoundData();
    const price = roundData.answer.toNumber() / 1e8; // Chainlink prices are in 8 decimals
    return price;
  } catch (error) {
    console.error('Error reading Chainlink price feed:', error);
    return 0;
  }
}
*/ 