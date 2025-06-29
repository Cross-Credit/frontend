import { useReadContract } from "wagmi";
import { abi } from "@/const/abi";
import { getCrossCreditAddress } from "@/lib/utils";

interface CrossChainInfoProps {
  selectedChain: number;
}

export default function CrossChainInfo({ selectedChain }: CrossChainInfoProps) {
  const ABI_ADDRESS = getCrossCreditAddress(selectedChain);
  
  // Get latest message details
  const { data: latestMessageDetails } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "getLatestMessageDetails",
    query: { enabled: !!ABI_ADDRESS },
  });
  
  // Get receiver on connected chain
  const { data: receiverOnConnectedChain } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "s_receiverOnConnectedChain",
    query: { enabled: !!ABI_ADDRESS },
  });
  
  // Get router address
  const { data: routerAddress } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "s_router",
    query: { enabled: !!ABI_ADDRESS },
  });
  
  // Get source chain ID
  const { data: sourceChainId } = useReadContract({
    abi,
    address: ABI_ADDRESS as `0x${string}`,
    functionName: "i_sourceChainID",
    query: { enabled: !!ABI_ADDRESS },
  });

  // Destructure latest message details
  const [messageId, sourceChainSelector, sender, messageData] = latestMessageDetails || [];

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Cross-chain Information</h3>
      
      <div className="space-y-3">
        {/* Source Chain ID */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Source Chain ID:</span>
          <span className="text-xs text-muted-foreground">
            {sourceChainId ? sourceChainId.toString() : 'Loading...'}
          </span>
        </div>
        
        {/* Router Address */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Router Address:</span>
          <span className="text-xs text-muted-foreground font-mono">
            {routerAddress ? `${routerAddress.slice(0, 6)}...${routerAddress.slice(-4)}` : 'Loading...'}
          </span>
        </div>
        
        {/* Receiver on Connected Chain */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Receiver (Connected):</span>
          <span className="text-xs text-muted-foreground font-mono">
            {receiverOnConnectedChain && receiverOnConnectedChain !== '0x0000000000000000000000000000000000000000'
              ? `${receiverOnConnectedChain.slice(0, 6)}...${receiverOnConnectedChain.slice(-4)}`
              : 'Not set'
            }
          </span>
        </div>
        
        {/* Latest Message Details */}
        {latestMessageDetails && (
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Latest Message</h4>
            
            {/* Message ID */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Message ID:</span>
              <span className="text-xs text-muted-foreground font-mono">
                {messageId ? `${messageId.slice(0, 8)}...${messageId.slice(-8)}` : 'N/A'}
              </span>
            </div>
            
            {/* Source Chain Selector */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Source Chain Selector:</span>
              <span className="text-xs text-muted-foreground">
                {sourceChainSelector ? sourceChainSelector.toString() : 'N/A'}
              </span>
            </div>
            
            {/* Sender */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Sender:</span>
              <span className="text-xs text-muted-foreground font-mono">
                {sender ? `${sender.slice(0, 6)}...${sender.slice(-4)}` : 'N/A'}
              </span>
            </div>
            
            {/* Message Data */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Message Data:</span>
              <span className="text-xs text-muted-foreground font-mono">
                {messageData ? `${messageData.slice(0, 10)}...` : 'N/A'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 