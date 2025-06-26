"use client";

import { useState, useEffect } from "react";
import { CHAINS, TOKENS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { abi } from "@/const/abi";
import { useChainId, useAccount, useWriteContract, useSwitchChain } from "wagmi";
import { parseUnits } from "viem";
import { useTokenPrices } from "@/lib/useTokenPrices";

export default function LendForm() {
    // const [mounted, setMounted] = useState(false);
    // useEffect(() => {
    //     setMounted(true);
    // }, []);
    const chainId = useChainId();
    const { address } = useAccount();
    const [selectedChain, setSelectedChain] = useState(chainId);
    const { switchChain } = useSwitchChain();
    const [token, setToken] = useState<string>(TOKENS[0].symbol);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { writeContractAsync } = useWriteContract();

    useEffect(() => {
        setSelectedChain(chainId);
    }, [chainId]);

    const prices = useTokenPrices([token]);
    const tokenPrice = prices[token] || 0;
    const amountNum = parseFloat(amount) || 0;
    const amountUSD = amountNum * tokenPrice;

    // Lending contract address (same as BorrowForm)
    const LENDING_CONTRACT = "0x901CfBA2a215939Dfc4039d6E07946dD6b453b9A";

    function getTokenAddress(symbol: string): string | undefined {
        const t = TOKENS.find((tk) => tk.symbol === symbol);
        if (!t) return undefined;
        switch (selectedChain) {
            case 1:
                return t.addresses.ethereum;
            case 137:
                return t.addresses.polygon;
            case 42161:
                return t.addresses.arbitrum;
            case 10:
                return t.addresses.optimism;
            default:
                return undefined;
        }
    }

    const handleSupply = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            if (!address) {
                // toast.error("Please connect your wallet to use this feature.");
                setLoading(false);
                return;
            }
            if (!token || !amount) {
                setError("Please select a token and enter an amount.");
                setLoading(false);
                return;
            }
            if (amountNum <= 0) {
                setError("Amount must be greater than zero.");
                setLoading(false);
                return;
            }
            const tokenAddress = getTokenAddress(token);
            if (!tokenAddress) {
                setError("Invalid token or chain.");
                setLoading(false);
                return;
            }
            const t = TOKENS.find((tk) => tk.symbol === token);
            const decimals = t?.decimals || 18;
            const parsedAmount = parseUnits(amount, decimals);
            // If the token is the native asset, send value, else value is 0
            const isNative = token === "ETH"; // adjust if you have other native tokens per chain
            await writeContractAsync({
                address: LENDING_CONTRACT,
                abi,
                functionName: "lend",
                args: [parsedAmount, tokenAddress],
                value: isNative ? parsedAmount : undefined,
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch {
            setError("Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    // if (!mounted) return null;

    return (
        <form className="flex flex-col gap-5 bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs mb-1 font-medium">Chain</label>
                    <select
                        className="w-full border rounded px-3 py-2 bg-background"
                        value={selectedChain}
                        onChange={async (e) => {
                            const newChainId = Number(e.target.value);
                            setSelectedChain(newChainId);
                            try {
                                await switchChain({ chainId: newChainId });
                            } catch (err) {
                                // handle error (e.g., user rejected, chain not added)
                console.error("Failed to switch chain:", err);

                            }
                        }}
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
                        disabled={!address}
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
                    disabled={!address}
                />
                <div className="text-xs text-muted-foreground mt-1">
                    ~${amountUSD.toFixed(2)}
                </div>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span>Estimated APY:</span>
                <span className="font-semibold">%</span>
            </div>
            <Button type="button" onClick={handleSupply} disabled={loading || !amount || !address} className="mt-2">
                {loading ? "Supplying..." : success ? "Supplied!" : !address ? "Connect Wallet" : "Supply"}
            </Button>
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </form>
    );
} 