"use client"
import { CHAINS } from "@/lib/utils";
import { useChainId } from "wagmi";

export default function ChainStatus() {
    const chainId = useChainId();
    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="font-semibold text-lg mb-2">Chain Status</div>
            <ul className="flex flex-col gap-2 text-sm">
                {CHAINS.map((chain) => {
                    const isActive = chain.id === chainId;
                    return (
                        <li key={chain.id} className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full inline-block ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
                            <span>{chain.name}</span>
                            <span className={`text-xs ml-auto ${isActive ? "text-green-600" : "text-muted-foreground"}`}>{isActive ? "Active" : "Inactive"}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
} 