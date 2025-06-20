"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LendForm from "@/components/LendForm";
import BorrowForm from "@/components/BorrowForm";

export default function LendBorrowTabs() {
    return (
        <Tabs defaultValue="lend" className="w-full">
            <TabsList className="mb-6">
                <TabsTrigger value="lend">LEND</TabsTrigger>
                <TabsTrigger value="borrow">BORROW</TabsTrigger>
            </TabsList>
            <TabsContent value="lend">
                <LendForm />
            </TabsContent>
            <TabsContent value="borrow">
                <BorrowForm />
            </TabsContent>
        </Tabs>
    );
} 