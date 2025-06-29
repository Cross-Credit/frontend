"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import LendBorrowTabs from "../components/LendBorrowTabs";
import RecentTransactions from "../components/RecentTransactions";
import ChainStatus from "../components/ChainStatus";
import AssetInfo from "../components/AssetInfo";
import CrossChainInfo from "../components/CrossChainInfo";

export default function Home() {
  const [selectedChain, setSelectedChain] = useState(11155111); // Default to Sepolia
  const [selectedToken, setSelectedToken] = useState("ETH");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex flex-row gap-8 justify-center items-start flex-1 py-12 px-8 max-w-7xl mx-auto w-full">
        <section className="flex-1 max-w-2xl">
          <LendBorrowTabs 
            selectedChain={selectedChain}
            onChainChange={setSelectedChain}
            selectedToken={selectedToken}
            onTokenChange={setSelectedToken}
          />
        </section>
        <aside className="flex flex-col gap-8 w-[340px] min-w-[300px]">
          <RecentTransactions />
          <ChainStatus selectedChain={selectedChain} />
          <AssetInfo selectedChain={selectedChain} tokenSymbol={selectedToken} />
          <CrossChainInfo selectedChain={selectedChain} />
        </aside>
      </main>
    </div>
  );
}
