"use client";

import { useEffect, useState } from "react";
import { mockGetRecentTransactions } from "@/lib/utils";

export default function RecentTransactions() {
    const [loading, setLoading] = useState(true);
    const [txs, setTxs] = useState<{
        type: "lend" | "borrow";
        token: string;
        amount: number;
        chain: string;
        date: string;
    }[]>([]);

    useEffect(() => {
        setLoading(true);
        mockGetRecentTransactions("0x1234...abcd").then((data) => {
            setTxs(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="font-semibold text-lg mb-2">Recent Transactions</div>
            {loading ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
            ) : txs.length === 0 ? (
                <div className="text-muted-foreground text-sm">No recent activity.</div>
            ) : (
                <ul className="flex flex-col gap-2 text-sm">
                    {txs.map((tx, i) => (
                        <li key={i} className="flex justify-between">
                            <span>
                                <span className={tx.type === "lend" ? "text-green-600" : "text-blue-600"}>
                                    {tx.type === "lend" ? "Lend" : "Borrow"}
                                </span>{" "}
                                {tx.amount} {tx.token} on {tx.chain}
                            </span>
                            <span className="text-muted-foreground">{tx.date}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
} 