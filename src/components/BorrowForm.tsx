"use client";
import { abi } from "@/const/abi";
import {
  useChainId,
  useAccount,
  useWriteContract,
  useSwitchChain,
  useReadContract,
  useWaitForTransactionReceipt,
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
  const { switchChain } = useSwitchChain();
  const [collateralToken, setCollateralToken] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowToken, setBorrowToken] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [selectedChain, setSelectedChain] = useState(chainId);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();

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
      toast.success("Transaction confirmed! Borrow successful!");
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

  const prices = useTokenPrices([collateralToken, borrowToken].filter(Boolean), selectedChain);
  const collateralPrice = prices[collateralToken] || 0;
  const borrowPrice = prices[borrowToken] || 0;
  
  // Calculate collateral value in USD
  const collateralAmountNum = parseFloat(collateralAmount) || 0;
  const collateralUSD = collateralAmountNum * collateralPrice;
  
  // Get the LTV (Loan-to-Value) ratio from the contract
  const { data: ltvRatio } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "LTV",
    query: { enabled: !!ABI_ADDRESS },
  });

  // Get user's total supplied value in USD
  const { data: totalSuppliedUSD } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "getTotalUSDValueOfUserByType",
    args: address ? [address, PositionType.Supplied] : undefined,
    query: { enabled: !!ABI_ADDRESS && !!address },
  });

  // Get user's total borrowed value in USD
  const { data: totalBorrowedUSD } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "getTotalUSDValueOfUserByType",
    args: address ? [address, PositionType.Borrowed] : undefined,
    query: { enabled: !!ABI_ADDRESS && !!address },
  });

  // Calculate max borrowable amount based on contract LTV and user's supplied value
  const ltvPercentage = ltvRatio ? Number(ltvRatio) / 100 : 0; // Convert from uint8 to percentage
  const maxBorrowableUSD = totalSuppliedUSD ? (Number(totalSuppliedUSD) * ltvPercentage) / 1e18 : 0; // Assuming 18 decimals for USD value
  
  // Max borrowable in borrow token units
  const maxBorrowable = borrowPrice && maxBorrowableUSD > 0
    ? (maxBorrowableUSD / borrowPrice).toFixed(6)
    : "0";
  
  // Interest in USD (10% of collateral value) - keeping this static for now
  const interestUSD = collateralUSD * 0.1;
  
  // Interest in borrow token units (what the user will pay back)
  const interestInBorrowToken = borrowPrice
    ? (interestUSD / borrowPrice).toFixed(6)
    : "0";

  useEffect(() => {
    setSelectedChain(chainId);
  }, [chainId]);

  // Get token address for the selected borrow token and current chain
  function getTokenAddressForBorrow(symbol: string): string | undefined {
    const address = getTokenAddress(symbol, selectedChain);
    return address || undefined;
  }

  // Get token address for collateral
  function getCollateralTokenAddress(symbol: string): string | undefined {
    const address = getTokenAddress(symbol, selectedChain);
    return address || undefined;
  }

  // User borrowed balance for the selected borrow token
  const { data: borrowedBalance } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "getUserPositionForAssetByType",
    args: getTokenAddressForBorrow(borrowToken) && address ? [getTokenAddressForBorrow(borrowToken) as `0x${string}`, address, PositionType.Borrowed] : undefined,
    query: { enabled: !!getTokenAddressForBorrow(borrowToken) && !!address },
  });

  // User supplied balance for collateral token
  const { data: suppliedBalance } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "getUserPositionForAssetByType",
    args: getCollateralTokenAddress(collateralToken) && address ? [getCollateralTokenAddress(collateralToken) as `0x${string}`, address, PositionType.Supplied] : undefined,
    query: { enabled: !!getCollateralTokenAddress(collateralToken) && !!address },
  });

  // Check if contract is accessible
  const { data: contractOwner, isError: contractError } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "owner",
    query: { enabled: !!ABI_ADDRESS },
  });

  // Check if borrow asset is whitelisted
  const { data: isBorrowAssetWhitelisted } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "isAssetWhitelisted",
    args: getTokenAddressForBorrow(borrowToken) ? [getTokenAddressForBorrow(borrowToken) as `0x${string}`] : undefined,
    query: { enabled: !!ABI_ADDRESS && !!getTokenAddressForBorrow(borrowToken) },
  });

  // Check if collateral asset is whitelisted
  const { data: isCollateralAssetWhitelisted } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "isAssetWhitelisted",
    args: getCollateralTokenAddress(collateralToken) ? [getCollateralTokenAddress(collateralToken) as `0x${string}`] : undefined,
    query: { enabled: !!ABI_ADDRESS && !!getCollateralTokenAddress(collateralToken) },
  });

  // Handle borrow transaction
  const handleBorrow = async () => {
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
      
      if (!borrowToken || !borrowAmount) {
        setError("Please select a borrow token and enter an amount.");
        toast.error("Please select a borrow token and enter an amount.");
        setLoading(false);
        return;
      }
      
      const borrowTokenAddress = getTokenAddressForBorrow(borrowToken);
      
      if (!borrowTokenAddress) {
        setError("Invalid borrow token or chain.");
        toast.error("Invalid borrow token or chain.");
        setLoading(false);
        return;
      }
      
      if (!ABI_ADDRESS) {
        setError("Invalid contract address.");
        toast.error("Invalid contract address.");
        setLoading(false);
        return;
      }

      // Find decimals for the borrow token
      const borrowTokenInfo = TOKENS.find((t) => t.symbol === borrowToken);
      const borrowDecimals = borrowTokenInfo?.decimals || 18;
      const parsedBorrowAmount = parseUnits(borrowAmount, borrowDecimals);
      
      setIsPending(true);
      toast.info("Executing borrow transaction...");
      
      // Debug logging
      console.log("Borrow transaction parameters:", {
        contractAddress: ABI_ADDRESS,
        borrowTokenAddress: borrowTokenAddress,
        borrowAmount: parsedBorrowAmount.toString(),
      });
      
      const borrowTx = await writeContractAsync({
        address: ABI_ADDRESS as `0x${string}`,
        abi,
        functionName: "borrow",
        args: [parsedBorrowAmount, borrowTokenAddress as `0x${string}`],
      });
      
      console.log("Transaction hash:", borrowTx);
      setPendingTxHash(borrowTx);
      toast.info("Transaction submitted! Waiting for confirmation...");
      
    } catch (err: unknown) {
      console.error("Borrow error:", err);
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
          errorMsg = "Transaction reverted. This might be due to insufficient collateral, invalid parameters, or contract restrictions.";
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

  return (
    <form className="flex flex-col gap-5 bg-card p-6 rounded-xl border border-border shadow-sm">
      {/* Chain Selector */}
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

      {/* Collateral Amount Input */}
      <div>
        <label className="block text-xs mb-1 font-medium">
          Collateral Amount (Info Only)
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
        {address && suppliedBalance !== undefined && (
          <div className="text-xs text-muted-foreground mt-1">
            Currently Supplied: {(Number(suppliedBalance) / 10 ** (TOKENS.find(t => t.symbol === collateralToken)?.decimals || 18)).toFixed(4)} {collateralToken || ""}
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

      {/* LTV and Position Information */}
      {address && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-2">Position Information:</p>
          {ltvRatio !== undefined && (
            <p className="text-xs text-gray-600">LTV Ratio: {Number(ltvRatio)}%</p>
          )}
          {totalSuppliedUSD !== undefined && (
            <p className="text-xs text-gray-600">Total Supplied Value: ${(Number(totalSuppliedUSD) / 1e18).toFixed(2)} USD</p>
          )}
          {totalBorrowedUSD !== undefined && (
            <p className="text-xs text-gray-600">Total Borrowed Value: ${(Number(totalBorrowedUSD) / 1e18).toFixed(2)} USD</p>
          )}
          {maxBorrowableUSD > 0 && (
            <p className="text-xs text-gray-600">Max Borrowable: ${maxBorrowableUSD.toFixed(2)} USD</p>
          )}
        </div>
      )}

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
      
      {isBorrowAssetWhitelisted === false && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-orange-800">
              ⚠️ Borrow asset not whitelisted. This token might not be supported by the contract.
            </span>
          </div>
        </div>
      )}

      {isCollateralAssetWhitelisted === false && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-orange-800">
              ⚠️ Collateral asset not whitelisted. This token might not be supported by the contract.
            </span>
          </div>
        </div>
      )}

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
          isConfirming ||
          !borrowAmount ||
          !borrowToken ||
          !address ||
          chainId !== selectedChain
        }
        className="mt-2"
      >
        {loading ? "Processing..." : isPending || isConfirming ? "Confirming..." : success ? "Borrowed!" : !address ? "Connect Wallet" : "Borrow"}
      </Button>
    </form>
  );
}
