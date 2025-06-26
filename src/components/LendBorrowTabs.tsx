"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LendForm from "@/components/LendForm";
import BorrowForm from "@/components/BorrowForm";
import LiquidationForm from "@/components/LiquidationForm";
import UnlendForm from "@/components/UnlendForm";
import RepayForm from "@/components/RepayForm";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useState } from "react";

export default function LendBorrowTabs() {
    const { address } = useAccount();
    const [tab, setTab] = useState("lend");
    const handleTabChange = (value: string) => {
        if (!address && value !== "lend") {
            toast.error("Please connect your wallet to use this feature.");
            return;
        }
        setTab(value);
    };
    return (
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6">
                <TabsTrigger value="lend">LEND</TabsTrigger>
                <TabsTrigger value="borrow">BORROW</TabsTrigger>
                <TabsTrigger value="liquidation">LIQUIDATION</TabsTrigger>
                <TabsTrigger value="unlend">UNLEND</TabsTrigger>
                <TabsTrigger value="repay">REPAY</TabsTrigger>
            </TabsList>
            <TabsContent value="lend">
                <LendForm />
            </TabsContent>
            <TabsContent value="borrow">
                <BorrowForm />
            </TabsContent>
            <TabsContent value="liquidation">
                <LiquidationForm />
            </TabsContent>
            <TabsContent value="unlend">
                <UnlendForm />
            </TabsContent>
            <TabsContent value="repay">
                <RepayForm />
            </TabsContent>
        </Tabs>
    );
} 