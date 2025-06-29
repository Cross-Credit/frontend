"use client";

import { useState, useEffect } from "react";
import { CHAINS, TOKENS, getAvailableTokens, getCrossCreditAddress, getTokenAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { abi } from "@/const/abi";
import { useChainId, useAccount, useWriteContract, useSwitchChain, useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { useTokenPrices } from "@/lib/useTokenPrices";
import { toast } from "sonner";
import { erc20Abi } from "@/const/erc20Abi";
import { PositionType } from "@/types";

interface LendFormProps {
  selectedChain: number;
  onChainChange: (chainId: number) => void;
  selectedToken: string;
  onTokenChange: (token: string) => void;
}

export default function LendForm({ 
  selectedChain, 
  onChainChange, 
  selectedToken, 
  onTokenChange 
}: LendFormProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const chainId = useChainId();
  const { address } = useAccount();
  const { switchChain } = useSwitchChain();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    // Set initial token only after mounting
    if (mounted && selectedChain) {
      const availableTokens = getAvailableTokens(selectedChain);
      if (availableTokens.length > 0 && !selectedToken) {
        onTokenChange(availableTokens[0].symbol);
      }
    }
  }, [selectedChain, mounted, selectedToken, onTokenChange]);

  const prices = useTokenPrices([selectedToken], selectedChain);
  const tokenPrice = prices[selectedToken] || 0;
  const amountNum = parseFloat(amount) || 0;
  const amountUSD = amountNum * tokenPrice;

  const ABI_ADDRESS = getCrossCreditAddress(selectedChain);

  function getTokenAddressForLend(symbol: string): string | undefined {
    const address = getTokenAddress(symbol, selectedChain);
    return address || undefined;
  }

  const tokenAddress = getTokenAddressForLend(selectedToken);
  const isNative = selectedToken === "ETH";
  const canCheckAllowance = !!address && !!tokenAddress && !isNative;
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: canCheckAllowance ? (tokenAddress as `0x${string}`) : undefined,
    functionName: "allowance",
    args: canCheckAllowance ? [address, ABI_ADDRESS as `0x${string}`] : undefined,
    query: { enabled: canCheckAllowance },
  });

  // User supplied balance for this token
  const { data: suppliedBalance } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "getUserPositionForAssetByType",
    args: tokenAddress && address ? [tokenAddress as `0x${string}`, address, PositionType.Supplied] : undefined,
    query: { enabled: !!tokenAddress && !!address },
  });

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
      
      // Check if wallet is on the correct network
      if (chainId !== selectedChain) {
        toast.error(`Please switch to ${CHAINS.find(c => c.id === selectedChain)?.name} network in your wallet.`);
        setLoading(false);
        return;
      }
      
      if (!selectedToken || !amount) {
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
      if (!tokenAddress) {
        setError("Invalid token or chain.");
        toast.error("Invalid token or chain.");
        setLoading(false);
        return;
      }
      if (!ABI_ADDRESS) {
        setError("Invalid contract address.");
        toast.error("Invalid contract address.");
        setLoading(false);
        return;
      }
      const t = TOKENS.find((tk) => tk.symbol === selectedToken);
      const decimals = t?.decimals || 18;
      const parsedAmount = parseUnits(amount, decimals);
      // Check allowance and approve if needed (for ERC20 only)
      if (!isNative) {
        await refetchAllowance();
        if (!allowance || BigInt(allowance) < BigInt(parsedAmount)) {
          await writeContractAsync({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [ABI_ADDRESS as `0x${string}`, parsedAmount],
          });
          toast.success("Token approved!");
        }
      }
      await writeContractAsync({
        address: ABI_ADDRESS as `0x${string}`,
        abi,
        functionName: "lend",
        args: [parsedAmount, tokenAddress as `0x${string}`],
        value: isNative ? parsedAmount : undefined,
      });
      setSuccess(true);
      toast.success("Supply successful!");
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: unknown) {
      console.error("Supply error:", err);
      let errorMsg = "Transaction failed";
      
      if (err instanceof Error) {
        if (err.message.includes("User denied transaction signature") || 
            err.message.includes("User rejected") ||
            err.message.includes("not been authorized by the user")) {
          errorMsg = "Transaction was cancelled by user.";
        } else if (err.message.includes("insufficient funds") || 
                   err.message.includes("exceeds balance")) {
          errorMsg = "Insufficient balance for this transaction.";
        } else if (err.message.includes("network") || 
                   err.message.includes("chain")) {
          errorMsg = "Network error. Please check your connection and try again.";
        } else if (err.message.includes("gas") || 
                   err.message.includes("fee")) {
          errorMsg = "Gas estimation failed. Please try with a smaller amount.";
        } else {
          errorMsg = err.message;
        }
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

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
              onChainChange(newChainId);
              // Reset token to first available token for the new chain
              const availableTokens = getAvailableTokens(newChainId);
              if (availableTokens.length > 0) {
                onTokenChange(availableTokens[0].symbol);
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
            value={selectedToken}
            onChange={(e) => onTokenChange(e.target.value)}
          >
            {getAvailableTokens(selectedChain).map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Network Status Indicator */}
      {chainId !== selectedChain && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-yellow-800">
              Wallet is on {CHAINS.find(c => c.id === chainId)?.name || 'unknown'} network. 
              Please switch to {CHAINS.find(c => c.id === selectedChain)?.name} to continue.
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs mb-1 font-medium">Amount</label>
        <input
          type="number"
          min="0"
          className="w-full border rounded px-3 py-2 bg-background"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {amountUSD > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            ≈ ${amountUSD.toFixed(2)} USD
          </p>
        )}
        {suppliedBalance !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Currently supplied: {suppliedBalance.toString()} {selectedToken}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">Transaction successful!</p>
        </div>
      )}

      <Button
        type="button"
        onClick={handleSupply}
        disabled={loading || !amount || amountNum <= 0}
        className="w-full"
      >
        {loading ? "Processing..." : "Supply"}
      </Button>
    </form>
  );
} 