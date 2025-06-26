"use client";
import { abi } from "@/const/abi";
import {
  useChainId,
  useAccount,
  useWriteContract,
  useSwitchChain,
} from "wagmi";
import { useState, useEffect } from "react";
import { CHAINS, TOKENS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { parseUnits } from "viem";
import { useTokenPrices } from "@/lib/useTokenPrices";

export default function BorrowForm() {
  const chainId = useChainId();
  const { address } = useAccount();
  const [collateralToken, setCollateralToken] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowToken, setBorrowToken] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [selectedChain, setSelectedChain] = useState(chainId);
  const { switchChain } = useSwitchChain();

  const prices = useTokenPrices([collateralToken, borrowToken].filter(Boolean));
  const collateralPrice = prices[collateralToken] || 0;
  const borrowPrice = prices[borrowToken] || 0;
  const collateralAmountNum = parseFloat(collateralAmount) || 0;  // Collateral in USD
  const collateralUSD = collateralAmountNum * collateralPrice;
  // Max borrowable in USD (90% of collateral)
  const maxBorrowableUSD = collateralUSD * 0.9;
  // Max borrowable in borrow token
  const maxBorrowable = borrowPrice ? (maxBorrowableUSD / borrowPrice).toFixed(6) : "0";
  // Interest in USD (10% of collateral)
  const interestUSD = collateralUSD * 0.1;
  // Interest in collateral token
  const interestRate = (collateralAmountNum * 0.1).toFixed(6);

  // Lending contract address (same for all chains as per user)
  const LENDING_CONTRACT = "0x901CfBA2a215939Dfc4039d6E07946dD6b453b9A";

  useEffect(() => {
    setSelectedChain(chainId);
  }, [chainId]);

  // Get token address for the selected borrow token and current chain
  function getTokenAddress(symbol: string): string | undefined {
    const token = TOKENS.find((t) => t.symbol === symbol);
    if (!token) return undefined;
    switch (selectedChain) {
      case 1:
        return token.addresses.ethereum;
      case 137:
        return token.addresses.polygon;
      case 42161:
        return token.addresses.arbitrum;
      case 10:
        return token.addresses.optimism;
      default:
        return undefined;
    }
  }  
  // Write contract hook
  const { writeContractAsync } = useWriteContract();

  // Handle borrow transaction
  const handleBorrow = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setIsPending(false);
    try {
      if (!address) {
        setLoading(false);
        return;
      }
      if (!borrowToken || !borrowAmount) {
        setError("Please select a borrow token and enter an amount.");
        setLoading(false);
        return;
      }
      if (parseFloat(borrowAmount) > Number(maxBorrowable)) {
        setError("You cannot borrow more than 90% of your collateral.");
        setLoading(false);
        return;
      }
      const tokenAddress = getTokenAddress(borrowToken);
      if (!tokenAddress) {
        setError("Invalid token or chain.");
        setLoading(false);
        return;
      }
      // Find decimals for the borrow token
      const token = TOKENS.find((t) => t.symbol === borrowToken);
      const decimals = token?.decimals || 18;
      const parsedAmount = parseUnits(borrowAmount, decimals);
      setIsPending(true);
      await writeContractAsync({
        address: LENDING_CONTRACT,
        abi,
        functionName: "borrow",
        args: [parsedAmount, tokenAddress],
      });
      setIsPending(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Transaction failed");
      }
      setIsPending(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle transaction confirmation


  return (
    <form className="flex flex-col gap-5 bg-card p-6 rounded-xl border border-border shadow-sm">
      {/* Chain Selector (read-only) */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs mb-1 font-medium">Chain</label>
          <select
            className="w-full border rounded px-3 py-2 bg-background"
            value={selectedChain}
            onChange={async (e) => {
              const newChainId = Number(e.target.value);
              setSelectedChain(newChainId);
              try {
                await switchChain({ chainId: newChainId });
              } catch (err) {
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

        {/* Collateral Token Selector */}
        <div className="flex-1">
          <label className="block text-xs mb-1 font-medium">
            Collateral Token
          </label>
          <select
            className="w-full border rounded px-3 py-2 bg-background"
            value={collateralToken}
            onChange={(e) => setCollateralToken(e.target.value)}
            disabled={!address}
          >
            <option value="">Select</option>
            {TOKENS.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Collateral Amount Input */}
      <div>
        <label className="block text-xs mb-1 font-medium">
          Collateral Amount
        </label>
        <input
          type="number"
          min="0"
          className="w-full border rounded px-3 py-2 bg-background"
          value={collateralAmount}
          onChange={(e) => setCollateralAmount(e.target.value)}
          placeholder="0.00"
          disabled={!address}
        />
      </div>

      {/* Borrow Token and Amount */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs mb-1 font-medium">Borrow Token</label>
          <select
            className="w-full border rounded px-3 py-2 bg-background"
            value={borrowToken}
            onChange={(e) => setBorrowToken(e.target.value)}
            disabled={!address}
          >
            <option value="">Select</option>
            {TOKENS.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs mb-1 font-medium">
            Borrow Amount
          </label>
          <input
            type="number"
            min="0"
            max={maxBorrowable}
            className="w-full border rounded px-3 py-2 bg-background"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
            placeholder="0.00"
            disabled={!address}
          />
          <div className="text-xs text-muted-foreground mt-1">
            Max: {maxBorrowable} {borrowToken || ''} (~${maxBorrowableUSD.toFixed(2)})
          </div>
        </div>
      </div>

      {/* Interest Rate Display */}
      <div className="flex items-center justify-between text-sm">
        <span>Interest (10% of collateral):</span>
        <span className="font-semibold">{interestRate} {collateralToken || ''} (~${interestUSD.toFixed(2)})</span>
      </div>

      {/* Borrow Button */}
      <Button
        type="button"
        onClick={handleBorrow}
        disabled={
          loading ||
          isPending ||
          !borrowAmount ||
          !borrowToken ||
          !collateralAmount ||
          !collateralToken ||
          !address
        }
        className="mt-2"
      >
        {loading || isPending
          ? "Borrowing..."
          : success
          ? "Borrowed!"
          : !address
          ? "Connect Wallet"
          : "Borrow"}
      </Button>

      {/* Error Message */}
      {error && <div className="text-red-500 setBorrtext-xs mt-1">{error}</div>}
    </form>
  );
}
