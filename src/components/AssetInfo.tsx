import { useReadContract } from "wagmi";
import { abi } from "@/const/abi";
import { getCrossCreditAddress, getTokenAddress } from "@/lib/utils";
import { TOKENS } from "@/lib/utils";

interface AssetInfoProps {
  selectedChain: number;
  tokenSymbol: string;
}

export default function AssetInfo({ selectedChain, tokenSymbol }: AssetInfoProps) {
  const ABI_ADDRESS = getCrossCreditAddress(selectedChain);
  const tokenAddress = getTokenAddress(tokenSymbol, selectedChain);
  
  // Get asset decimals
  const { data: assetDecimals } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "s_assetDecimals",
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!ABI_ADDRESS && !!tokenAddress },
  });
  
  // Get asset decimals on connected chain
  const { data: assetDecimalsOnConnectedChain } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "s_assetDecimalsOnConnectedChain",
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!ABI_ADDRESS && !!tokenAddress },
  });
  
  // Get asset mapping on connected chain
  const { data: assetOnConnectedChain } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "s_assetToAssetOnConnectedChain",
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!ABI_ADDRESS && !!tokenAddress },
  });
  
  // Check if asset is whitelisted
  const { data: isWhitelisted } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "isAssetWhitelisted",
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!ABI_ADDRESS && !!tokenAddress },
  });
  
  // Get asset decimals on destination chain
  const { data: assetDecimalsOnDest } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "getAssetDecimalsOnDest",
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!ABI_ADDRESS && !!tokenAddress },
  });
  
  // Get asset decimals on source chain
  const { data: assetDecimalsOnSource } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "getAssetDecimalsOnSource",
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!ABI_ADDRESS && !!tokenAddress },
  });

  if (!tokenAddress) {
    return (
      <div className="bg-card border rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-3">Asset Information</h3>
        <p className="text-sm text-muted-foreground">Token address not found for {tokenSymbol}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Asset Information: {tokenSymbol}</h3>
      
      <div className="space-y-3">
        {/* Token Address */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Token Address:</span>
          <span className="text-xs text-muted-foreground font-mono">
            {`${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`}
          </span>
        </div>
        
        {/* Asset Decimals */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Decimals:</span>
          <span className="text-xs text-muted-foreground">
            {assetDecimals !== undefined ? assetDecimals.toString() : 'Loading...'}
          </span>
        </div>
        
        {/* Whitelist Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Whitelisted:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isWhitelisted 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isWhitelisted ? 'Yes' : 'No'}
          </span>
        </div>
        
        {/* Cross-chain Information */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Cross-chain Details</h4>
          
          {/* Connected Chain Asset */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Connected Chain Asset:</span>
            <span className="text-xs text-muted-foreground font-mono">
              {assetOnConnectedChain && assetOnConnectedChain !== '0x0000000000000000000000000000000000000000' 
                ? `${assetOnConnectedChain.slice(0, 6)}...${assetOnConnectedChain.slice(-4)}`
                : 'Not mapped'
              }
            </span>
          </div>
          
          {/* Decimals on Connected Chain */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Decimals (Connected):</span>
            <span className="text-xs text-muted-foreground">
              {assetDecimalsOnConnectedChain !== undefined ? assetDecimalsOnConnectedChain.toString() : 'N/A'}
            </span>
          </div>
          
          {/* Decimals on Destination */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Decimals (Dest):</span>
            <span className="text-xs text-muted-foreground">
              {assetDecimalsOnDest !== undefined ? assetDecimalsOnDest.toString() : 'N/A'}
            </span>
          </div>
          
          {/* Decimals on Source */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Decimals (Source):</span>
            <span className="text-xs text-muted-foreground">
              {assetDecimalsOnSource !== undefined ? assetDecimalsOnSource.toString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 