"use client";

import { useState, useEffect } from "react";
import { CHAINS, TOKENS, getAvailableTokens, getCrossCreditAddress, getTokenAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { abi } from "@/const/abi";
import { useChainId, useAccount, useWriteContract, useSwitchChain, useReadContract, useWaitForTransactionReceipt } from "wagmi";
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
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();

  // Monitor transaction status
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isFailed } = useWaitForTransactionReceipt({
    hash: pendingTxHash as `0x${string}` | undefined,
  });

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      setSuccess(true);
      setPendingTxHash(null);
      toast.success("Transaction confirmed! Supply successful!");
      setTimeout(() => setSuccess(false), 5000);
    }
  }, [isConfirmed, pendingTxHash]);

  // Handle transaction error
  useEffect(() => {
    if (isFailed && pendingTxHash) {
      console.error("Transaction failed");
      setError("Transaction failed on-chain. Please check your wallet for details.");
      setPendingTxHash(null);
      toast.error("Transaction failed on-chain. Please check your wallet for details.");
    }
  }, [isFailed, pendingTxHash]);

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

  // Check if contract is accessible
  const { data: contractOwner, isError: contractError } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "owner",
    query: { enabled: !!ABI_ADDRESS },
  });

  // Check if asset is whitelisted
  const { data: isWhitelisted } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "isAssetWhitelisted",
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!ABI_ADDRESS && !!tokenAddress },
  });

  const handleSupply = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setPendingTxHash(null);
    
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
          toast.info("Approving token...");
          try {
      await writeContractAsync({
              address: tokenAddress as `0x${string}`,
              abi: erc20Abi,
              functionName: "approve",
              args: [ABI_ADDRESS as `0x${string}`, parsedAmount],
            });
            toast.success("Token approved! Please wait a moment and try the supply again.");
            setLoading(false);
            return; // Let user try again after approval
          } catch (approveErr) {
            console.error("Approval error:", approveErr);
            toast.error("Token approval failed. Please try again.");
            setLoading(false);
            return;
          }
        }
      }

      // Execute lend transaction
      toast.info("Executing lend transaction...");
      
      // Debug logging
      console.log("Lend transaction parameters:", {
        contractAddress: ABI_ADDRESS,
        tokenAddress: tokenAddress,
        amount: parsedAmount.toString(),
        isNative,
        value: isNative ? parsedAmount : undefined
      });
      
      const lendTx = await writeContractAsync({
        address: ABI_ADDRESS as `0x${string}`,
        abi,
        functionName: "lend",
        args: [parsedAmount, tokenAddress as `0x${string}`],
        value: isNative ? parsedAmount : undefined,
      });
      
      console.log("Transaction hash:", lendTx);
      setPendingTxHash(lendTx);
      toast.info("Transaction submitted! Waiting for confirmation...");
      
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
        } else if (err.message.includes("execution reverted") ||
                   err.message.includes("revert")) {
          errorMsg = "Transaction reverted. This might be due to insufficient balance, invalid parameters, or contract restrictions.";
        } else {
          errorMsg = err.message;
        }
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      setPendingTxHash(null);
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

      {/* Transaction Status */}
      {pendingTxHash && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-800">
              {isConfirming ? "Confirming transaction..." : "Transaction submitted! Waiting for confirmation..."}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Hash: {pendingTxHash.slice(0, 10)}...{pendingTxHash.slice(-8)}
          </p>
        </div>
      )}

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

      {/* Debug Information */}
      {/* <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-600 mb-2">Debug Info:</p>
        <p className="text-xs text-gray-600">Contract: {ABI_ADDRESS}</p>
        <p className="text-xs text-gray-600">Token: {tokenAddress}</p>
        <p className="text-xs text-gray-600">Chain: {selectedChain}</p>
        <p className="text-xs text-gray-600">Wallet Chain: {chainId}</p>
        <p className="text-xs text-gray-600">Is Native: {isNative ? 'Yes' : 'No'}</p>
        {!isNative && allowance !== undefined && (
          <p className="text-xs text-gray-600">Allowance: {allowance.toString()}</p>
        )}
        <p className="text-xs text-gray-600">Contract Accessible: {contractError ? 'No' : 'Yes'}</p>
        {contractOwner && (
          <p className="text-xs text-gray-600">Contract Owner: {contractOwner}</p>
        )}
        {isWhitelisted !== undefined && (
          <p className="text-xs text-gray-600">Asset Whitelisted: {isWhitelisted ? 'Yes' : 'No'}</p>
        )}
      </div> */}

      {/* Contract Status Warnings */}
      {contractError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm text-red-800">
              ⚠️ Contract not accessible. The contract address might be incorrect or the contract might not be deployed.
            </span>
          </div>
        </div>
      )}
      
      {/* {isWhitelisted === false && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-orange-800">
              ⚠️ Asset not whitelisted. This token might not be supported by the contract.
            </span>
          </div>
      </div>
      )} */}

      <Button
        type="button"
        onClick={handleSupply}
        disabled={loading || !amount || amountNum <= 0 || isConfirming}
        className="w-full"
      >
        {loading ? "Processing..." : isConfirming ? "Confirming..." : "Supply"}
      </Button>
    </form>
  );
} 