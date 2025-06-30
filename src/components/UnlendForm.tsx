"use client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAccount, useChainId, useWriteContract, useSwitchChain, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { abi } from "@/const/abi";
import { CHAINS, TOKENS, getAvailableTokens, getCrossCreditAddress, getTokenAddress } from "@/lib/utils";
import { useTokenPrices } from "@/lib/useTokenPrices";
import { toast } from "sonner";
import { PositionType } from "@/types";

export default function UnlendForm() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const chainId = useChainId();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [selectedChain, setSelectedChain] = useState(chainId);
  const { switchChain } = useSwitchChain();
  const [token, setToken] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);

  const ABI_ADDRESS = getCrossCreditAddress(selectedChain);

  // Monitor transaction status
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isFailed } = useWaitForTransactionReceipt({
    hash: pendingTxHash as `0x${string}` | undefined,
  });

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      setSuccess(true);
      setPendingTxHash(null);
      toast.success("Transaction confirmed! Unlend successful!");
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

  // Get token price for USD display
  const prices = useTokenPrices([token].filter(Boolean), selectedChain);
  const tokenPrice = prices[token] || 0;
  const amountNum = parseFloat(amount) || 0;
  const amountUSD = amountNum * tokenPrice;

  useEffect(() => {
    setSelectedChain(chainId);
    // Set initial token only after mounting
    if (mounted && chainId) {
      const availableTokens = getAvailableTokens(chainId);
      if (availableTokens.length > 0) {
        setToken(availableTokens[0].symbol);
      }
    }
  }, [chainId, mounted]);

  function getTokenAddressForUnlend(symbol: string): string | undefined {
    const address = getTokenAddress(symbol, selectedChain);
    return address || undefined;
  }

  const tokenAddress = getTokenAddressForUnlend(token);
  const canCheckBalance = !!tokenAddress && !!address;

  // User supplied balance for this token
  const { data: suppliedBalance } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "getUserPositionForAssetByType",
    args: canCheckBalance ? [tokenAddress as `0x${string}`, address, PositionType.Supplied] : undefined,
    query: { enabled: canCheckBalance },
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

  const handleUnlend = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setIsPending(false);
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
      
      if (!token || !amount) {
        setError("Please select a token and enter an amount.");
        toast.error("Please select a token and enter an amount.");
        setLoading(false);
        return;
      }
      
      const amountNum = parseFloat(amount);
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
      
      const t = TOKENS.find((tk) => tk.symbol === token);
      const decimals = t?.decimals || 18;
      const parsedAmount = parseUnits(amount, decimals);

      // Check if user has sufficient balance to unlend
      if (!suppliedBalance || BigInt(suppliedBalance) < BigInt(parsedAmount)) {
        setError("You cannot unlend more than your supplied balance.");
        toast.error("You cannot unlend more than your supplied balance.");
        setLoading(false);
        return;
      }

      setIsPending(true);
      toast.info("Executing unlend transaction...");
      
      // Debug logging
      console.log("Unlend transaction parameters:", {
        contractAddress: ABI_ADDRESS,
        tokenAddress: tokenAddress,
        amount: parsedAmount.toString(),
      });
      
      const unlendTx = await writeContractAsync({
        address: ABI_ADDRESS as `0x${string}`,
        abi,
        functionName: "unlend",
        args: [parsedAmount, tokenAddress as `0x${string}`],
      });
      
      console.log("Transaction hash:", unlendTx);
      setPendingTxHash(unlendTx);
      toast.info("Transaction submitted! Waiting for confirmation...");
      
    } catch (err: unknown) {
      console.error("Unlend error:", err);
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
        } else if (err.message.includes("dropped or replaced")) {
          errorMsg = "Transaction dropped or replaced. This may be due to network congestion, low gas, or contract restrictions.";
        } else {
          errorMsg = err.message;
        }
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      setIsPending(false);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-md mx-auto">
      <div className="font-semibold text-lg mb-4">Unlend</div>
      <form className="flex flex-col gap-4">
        <div>
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
                console.error("Failed to switch chain:", err);
              }
            }}
            disabled={!address}
          >
            {CHAINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
          {token && amount && (
            <div className="text-xs text-muted-foreground mt-1">
              Value: ${amountUSD.toFixed(2)} USD
            </div>
          )}
          {address && (
            <div className="text-xs text-muted-foreground mt-1">
              Supplied: {suppliedBalance ? (Number(suppliedBalance) / 10 ** (TOKENS.find(t => t.symbol === token)?.decimals || 18)).toFixed(4) : "-"} {token}
            </div>
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
        
        {isWhitelisted === false && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-orange-800">
                ⚠️ Asset not whitelisted. This token might not be supported by the contract.
              </span>
            </div>
          </div>
        )}
        
        <Button
          type="button"
          onClick={handleUnlend}
          disabled={
            loading ||
            isPending ||
            isConfirming ||
            !amount ||
            !token ||
            !address ||
            chainId !== selectedChain
          }
        >
          {loading ? "Processing..." : isPending || isConfirming ? "Confirming..." : success ? "Unlent!" : !address ? "Connect Wallet" : "Unlend"}
        </Button>
      </form>
    </div>
  );
} 