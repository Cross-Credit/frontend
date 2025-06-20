import { CHAINS } from "@/lib/utils";

export default function ChainStatus() {
    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="font-semibold text-lg mb-2">Chain Status</div>
            <ul className="flex flex-col gap-2 text-sm">
                {CHAINS.map((chain) => (
                    <li key={chain.id} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        <span>{chain.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">Active</span>
                    </li>
                ))}
            </ul>
        </div>
    );
} 