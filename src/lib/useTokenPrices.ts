import { useEffect, useState } from "react";

const COINGECKO_IDS: Record<string, string> = {
  ETH: "ethereum",
  USDT: "tether",
  // Add more tokens as needed
};

export function useTokenPrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchPrices() {
      const ids = symbols.map((s) => COINGECKO_IDS[s]).join(",");
      if (!ids) return;
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
      const res = await fetch(url);
      const data = await res.json();
      const result: Record<string, number> = {};
      symbols.forEach((symbol) => {
        const id = COINGECKO_IDS[symbol];
        result[symbol] = data[id]?.usd ?? 0;
      });
      setPrices(result);
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, [symbols]);

  return prices;
} 