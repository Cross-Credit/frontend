"use client";
import { abi } from "@/const/abi";
import {
  useChainId,
  useAccount,
  useWriteContract,
  useSwitchChain,
  useReadContract,
} from "wagmi";
import { useState, useEffect } from "react";
import { CHAINS, TOKENS, getAvailableTokens, getCrossCreditAddress, getTokenAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { parseUnits } from "viem";
import { useTokenPrices } from "@/lib/useTokenPrices";
import { toast } from "sonner";
import { PositionType } from "@/types";

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

  const prices = useTokenPrices([collateralToken, borrowToken].filter(Boolean), selectedChain);
  const collateralPrice = prices[collateralToken] || 0;
  const borrowPrice = prices[borrowToken] || 0;
  
  // Calculate collateral value in USD
  const collateralAmountNum = parseFloat(collateralAmount) || 0;
  const collateralUSD = collateralAmountNum * collateralPrice;
  
  // Max borrowable in USD (90% of collateral value)
  const maxBorrowableUSD = collateralUSD * 0.9;
  
  // Max borrowable in borrow token units
  const maxBorrowable = borrowPrice
    ? (maxBorrowableUSD / borrowPrice).toFixed(6)
    : "0";
  
  // Interest in USD (10% of collateral value)
  const interestUSD = collateralUSD * 0.1;
  
  // Interest in borrow token units (what the user will pay back)
  const interestInBorrowToken = borrowPrice
    ? (interestUSD / borrowPrice).toFixed(6)
    : "0";

  const ABI_ADDRESS = getCrossCreditAddress(selectedChain);

  useEffect(() => {
    setSelectedChain(chainId);
  }, [chainId]);

  // Get token address for the selected borrow token and current chain
  function getTokenAddressForBorrow(symbol: string): string | undefined {
    const address = getTokenAddress(symbol, selectedChain);
    return address || undefined;
  }
  // Write contract hook
  const { writeContractAsync } = useWriteContract();

  // User borrowed balance for the selected borrow token
  const { data: borrowedBalance } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "getUserPositionForAssetByType",
    args: getTokenAddressForBorrow(borrowToken) && address ? [getTokenAddressForBorrow(borrowToken) as `0x${string}`, address, PositionType.Borrowed] : undefined,
    query: { enabled: !!getTokenAddressForBorrow(borrowToken) && !!address },
  });

  // Handle borrow transaction
  const handleBorrow = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setIsPending(false);
    try {
      if (!address) {
        toast.error("Please connect your wallet to use this feature.");
        setLoading(false);
        return;
      }
      if (!borrowToken || !borrowAmount) {
        setError("Please select a borrow token and enter an amount.");
        toast.error("Please select a borrow token and enter an amount.");
        setLoading(false);
        return;
      }
      if (parseFloat(borrowAmount) > Number(maxBorrowable)) {
        setError("You cannot borrow more than 90% of your collateral value.");
        toast.error("You cannot borrow more than 90% of your collateral value.");
        setLoading(false);
        return;
      }
      const tokenAddress = getTokenAddressForBorrow(borrowToken);
      if (!tokenAddress) {
        setError("Invalid token or chain.");
        toast.error("Invalid token or chain.");
        setLoading(false);
        return;
      }
      // Find decimals for the borrow token
      const token = TOKENS.find((t) => t.symbol === borrowToken);
      const decimals = token?.decimals || 18;
      const parsedAmount = parseUnits(borrowAmount, decimals);
      setIsPending(true);
      await writeContractAsync({
        address: ABI_ADDRESS as `0x${string}`,
        abi,
        functionName: "borrow",
        args: [parsedAmount, tokenAddress as `0x${string}`],
      });
      setIsPending(false);
      setSuccess(true);
      toast.success("Borrow successful!");
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
              // Reset tokens to first available tokens for the new chain
              const availableTokens = getAvailableTokens(newChainId);
              if (availableTokens.length > 0) {
                setCollateralToken(availableTokens[0].symbol);
                setBorrowToken(availableTokens[0].symbol);
              }
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
            {getAvailableTokens(selectedChain).map((t) => (
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
        {collateralToken && collateralAmount && (
          <div className="text-xs text-muted-foreground mt-1">
            Value: ${collateralUSD.toFixed(2)} USD
          </div>
        )}
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
            {getAvailableTokens(selectedChain).map((t) => (
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
            Max: {maxBorrowable} {borrowToken || ""} (~${maxBorrowableUSD.toFixed(2)})
          </div>
          {address && (
            <div className="text-xs text-muted-foreground mt-1">
              Currently Borrowed: {borrowedBalance ? (Number(borrowedBalance) / 10 ** (TOKENS.find(t => t.symbol === borrowToken)?.decimals || 18)).toFixed(4) : "-"} {borrowToken || ""}
            </div>
          )}
        </div>
      </div>

      {/* Interest Rate Display */}
      <div className="flex items-center justify-between text-sm">
        <span>Interest (10% of collateral value):</span>
        <span className="font-semibold">
          {interestInBorrowToken} {borrowToken || ""} (~${interestUSD.toFixed(2)})
        </span>
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
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </form>
  );
}
