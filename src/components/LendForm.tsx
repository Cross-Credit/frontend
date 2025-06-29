"use client";

import { useState, useEffect } from "react";
import { CHAINS, TOKENS, getAvailableTokens } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { abi } from "@/const/abi";
import { useChainId, useAccount, useWriteContract, useSwitchChain } from "wagmi";
import { parseUnits } from "viem";
import { useTokenPrices } from "@/lib/useTokenPrices";
import { toast } from "sonner";

export default function LendForm() {
  // const [mounted, setMounted] = useState(false);
  // useEffect(() => {
  //     setMounted(true);
  // }, []);
  const chainId = useChainId();
  const { address } = useAccount();
  const [selectedChain, setSelectedChain] = useState(chainId);
  const { switchChain } = useSwitchChain();
  const [token, setToken] = useState<string>(getAvailableTokens(chainId)[0]?.symbol || "");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    setSelectedChain(chainId);
  }, [chainId]);

  const prices = useTokenPrices([token]);
  const tokenPrice = prices[token] || 0;
  const amountNum = parseFloat(amount) || 0;
  const amountUSD = amountNum * tokenPrice;

  const ABI_ADDRESS =
    chainId === 11155111
      ? "0xF91A70a47b87f4196F21ce62e35a96bb994FFa3e" // Sepolia testnet
      : "0x146A6aeA830316aC0D7C69BcbE24Cd3dfeE2d45e"; // Avalanche Fuji testnet

  function getTokenAddress(symbol: string): string | undefined {
    const t = TOKENS.find((tk) => tk.symbol === symbol);
    if (!t) return undefined;
    switch (selectedChain) {
      case 11155111:
        return t.addresses.sepolia;
      case 43113:
        return t.addresses.avalancheFuji;
      default:
        return undefined;
    }
  }

  const handleSupply = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (!address) {
        toast.error("Please connect your wallet to use this feature.");
        setLoading(false);
        return;
      }
      if (!token || !amount) {
        setError("Please select a token and enter an amount.");
        toast.error("Please select a token and enter an amount.");
        setLoading(false);
        return;
      }
      if (amountNum <= 0) {
        setError("Amount must be greater than zero.");
        toast.error("Amount must be greater than zero.");
        setLoading(false);
        return;
      }
      const tokenAddress = getTokenAddress(token);
      if (!tokenAddress) {
        setError("Invalid token or chain.");
        toast.error("Invalid token or chain.");
        setLoading(false);
        return;
      }
      const t = TOKENS.find((tk) => tk.symbol === token);
      const decimals = t?.decimals || 18;
      const parsedAmount = parseUnits(amount, decimals);
      // If the token is the native asset, send value, else value is 0
      const isNative = token === "ETH";
      await writeContractAsync({
        address: ABI_ADDRESS,
        abi,
        functionName: "lend",
        args: [parsedAmount, tokenAddress],
        value: isNative ? parsedAmount : undefined,
      });
      setSuccess(true);
      toast.success("Supply successful!");
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error &&
        err.message.includes("User denied transaction signature")
          ? "Transaction cancelled by user."
          : err instanceof Error
          ? err.message
          : "Transaction failed";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // if (!mounted) return null;

  return (
    <form className="flex flex-col gap-5 bg-card p-6 rounded-xl border border-border shadow-sm">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs mb-1 font-medium">Chain</label>
          <select
            className="w-full border rounded px-3 py-2 bg-background"
            value={selectedChain}
            onChange={async (e) => {
              const newChainId = Number(e.target.value);
              setSelectedChain(newChainId);
              // Reset token to first available token for the new chain
              const availableTokens = getAvailableTokens(newChainId);
              if (availableTokens.length > 0) {
                setToken(availableTokens[0].symbol);
              }
              try {
                await switchChain({ chainId: newChainId });
              } catch (err) {
                // handle error (e.g., user rejected, chain not added)
                console.error("Failed to switch chain:", err);
              }
            }}
          >
            {CHAINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs mb-1 font-medium">Token</label>
          <select
            className="w-full border rounded px-3 py-2 bg-background"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={!address}
          >
            {getAvailableTokens(selectedChain).map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1 font-medium">Amount</label>
        <input
          type="number"
          min="0"
          className="w-full border rounded px-3 py-2 bg-background"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          disabled={!address}
        />
        <div className="text-xs text-muted-foreground mt-1">
          Value: ${amountUSD.toFixed(2)} USD
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>Estimated APY:</span>
        <span className="font-semibold">5.2%</span>
      </div>
      <Button
        type="button"
        onClick={handleSupply}
        disabled={loading || !amount || !address}
        className="mt-2"
      >
        {loading
          ? "Supplying..."
          : success
          ? "Supplied!"
          : !address
          ? "Connect Wallet"
          : "Supply"}
      </Button>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </form>
  );
} 