"use client";

import { useState } from "react";
import { CHAINS, TOKENS, mockGetInterestRate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function BorrowForm() {
    const [chain, setChain] = useState(CHAINS[0].id);
    const [collateralToken, setCollateralToken] = useState(TOKENS[0].symbol);
    const [collateralAmount, setCollateralAmount] = useState("");
    const [borrowToken, setBorrowToken] = useState(TOKENS[1].symbol);
    const [borrowAmount, setBorrowAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mock max borrowable: 60% of collateral
    const maxBorrowable = collateralAmount ? (parseFloat(collateralAmount) * 0.6).toFixed(2) : "0.00";
    const interestRate = mockGetInterestRate(borrowToken, chain).toFixed(2);

    const handleBorrow = () => {
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
                    <label className="block text-xs mb-1 font-medium">Collateral Token</label>
                    <select
                        className="w-full border rounded px-3 py-2 bg-background"
                        value={collateralToken}
                        onChange={e => setCollateralToken(e.target.value)}
                    >
                        {TOKENS.map(t => (
                            <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs mb-1 font-medium">Collateral Amount</label>
                <input
                    type="number"
                    min="0"
                    className="w-full border rounded px-3 py-2 bg-background"
                    value={collateralAmount}
                    onChange={e => setCollateralAmount(e.target.value)}
                    placeholder="0.00"
                />
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs mb-1 font-medium">Borrow Token</label>
                    <select
                        className="w-full border rounded px-3 py-2 bg-background"
                        value={borrowToken}
                        onChange={e => setBorrowToken(e.target.value)}
                    >
                        {TOKENS.map(t => (
                            <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs mb-1 font-medium">Borrow Amount</label>
                    <input
                        type="number"
                        min="0"
                        max={maxBorrowable}
                        className="w-full border rounded px-3 py-2 bg-background"
                        value={borrowAmount}
                        onChange={e => setBorrowAmount(e.target.value)}
                        placeholder="0.00"
                    />
                    <div className="text-xs text-muted-foreground mt-1">Max: {maxBorrowable}</div>
                </div>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span>Interest Rate:</span>
                <span className="font-semibold">{interestRate}%</span>
            </div>
            <Button type="button" onClick={handleBorrow} disabled={loading || !borrowAmount || !collateralAmount} className="mt-2">
                {loading ? "Borrowing..." : success ? "Borrowed!" : "Borrow"}
            </Button>
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </form>
    );
} 