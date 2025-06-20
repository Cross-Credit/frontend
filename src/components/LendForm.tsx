"use client";

import { useState } from "react";
import { CHAINS, TOKENS, mockGetAPY } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function LendForm() {
    const [chain, setChain] = useState(CHAINS[0].id);
    const [token, setToken] = useState(TOKENS[0].symbol);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apy = mockGetAPY(token, chain).toFixed(2);

    const handleSupply = () => {
        setLoading(true);
        setError(null);
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        }, 1200);
    };

    return (
        <form className="flex flex-col gap-5 bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs mb-1 font-medium">Chain</label>
                    <select
                        className="w-full border rounded px-3 py-2 bg-background"
                        value={chain}
                        onChange={e => setChain(Number(e.target.value))}
                    >
                        {CHAINS.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs mb-1 font-medium">Token</label>
                    <select
                        className="w-full border rounded px-3 py-2 bg-background"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                    >
                        {TOKENS.map(t => (
                            <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs mb-1 font-medium">Amount</label>
                <input
                    type="number"
                    min="0"
                    className="w-full border rounded px-3 py-2 bg-background"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                />
            </div>
            <div className="flex items-center justify-between text-sm">
                <span>Estimated APY:</span>
                <span className="font-semibold">{apy}%</span>
            </div>
            <Button type="button" onClick={handleSupply} disabled={loading || !amount} className="mt-2">
                {loading ? "Supplying..." : success ? "Supplied!" : "Supply"}
            </Button>
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </form>
    );
} 