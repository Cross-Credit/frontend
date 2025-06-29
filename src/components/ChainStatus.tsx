"use client"
import { CHAINS } from "@/lib/utils";
import { useChainId } from "wagmi";
import { useReadContract } from "wagmi";
import { abi } from "@/const/abi";
import { getCrossCreditAddress } from "@/lib/utils";
import { useAccount } from "wagmi";
import { getCrossChainStatus } from "@/lib/utils";

interface ChainStatusProps {
  selectedChain: number;
}

export default function ChainStatus({ selectedChain }: ChainStatusProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const ABI_ADDRESS = getCrossCreditAddress(selectedChain);
  
  // Get cross-chain status
  const crossChainStatus = getCrossChainStatus(isConnected, selectedChain);
  
  // Get router information
  const { data: routerAddress } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "getRouter",
    query: { enabled: !!ABI_ADDRESS },
  });
  
  // Get connected chain ID
  const { data: connectedChainId } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "s_connectedChainID",
    query: { enabled: !!ABI_ADDRESS },
  });
  
  // Check if connected chain is set
  const { data: isConnectedChainSet } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "s_isConnectedChainSet",
    query: { enabled: !!ABI_ADDRESS },
  });
  
  // Get native asset address
  const { data: nativeAssetAddress } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "i_nativeAssetAddress",
    query: { enabled: !!ABI_ADDRESS },
  });

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Chain Status</h3>
      
      <div className="space-y-3">
        {/* Cross-chain Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Cross-chain Support:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            crossChainStatus.status === 'supported' 
              ? 'bg-green-100 text-green-800' 
              : crossChainStatus.status === 'not-supported'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {crossChainStatus.status === 'supported' && 'Supported'}
            {crossChainStatus.status === 'not-supported' && 'Not Supported'}
            {crossChainStatus.status === 'not-connected' && 'Not Connected'}
          </span>
        </div>
        
        {/* Router Address */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Router:</span>
          <span className="text-xs text-muted-foreground font-mono">
            {routerAddress ? `${routerAddress.slice(0, 6)}...${routerAddress.slice(-4)}` : 'Loading...'}
          </span>
        </div>
        
        {/* Connected Chain ID */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connected Chain ID:</span>
          <span className="text-xs text-muted-foreground">
            {connectedChainId ? connectedChainId.toString() : 'Not set'}
          </span>
        </div>
        
        {/* Connected Chain Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Chain Connected:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isConnectedChainSet 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnectedChainSet ? 'Yes' : 'No'}
          </span>
        </div>
        
        {/* Native Asset */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Native Asset:</span>
          <span className="text-xs text-muted-foreground font-mono">
            {nativeAssetAddress ? `${nativeAssetAddress.slice(0, 6)}...${nativeAssetAddress.slice(-4)}` : 'Loading...'}
          </span>
        </div>
      </div>
    </div>
  );
} 