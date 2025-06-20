"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { mockConnectWallet } from "@/lib/utils";

export default function Navbar() {
    const [wallet, setWallet] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            const res = await mockConnectWallet();
            setWallet(res.address);
        } finally {
            setLoading(false);
        }
    };

    return (
        <nav className="w-full flex items-center justify-between py-6 px-8 border-b border-border bg-background sticky top-0 z-20">
            <span className="text-xl font-bold tracking-tight">Cross-Chain Lending</span>
            <div>
                {wallet ? (
                    <span className="text-sm font-mono bg-muted px-3 py-1 rounded">{wallet}</span>
                ) : (
                    <Button onClick={handleConnect} disabled={loading}>
                        {loading ? "Connecting..." : "Connect Wallet"}
                    </Button>
                )}
            </div>
        </nav>
    );
} 