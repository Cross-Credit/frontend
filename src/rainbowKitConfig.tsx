"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { sepolia, avalancheFuji } from "wagmi/chains";

export default getDefaultConfig({
    appName: "Cross-Credit Lending",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [sepolia, avalancheFuji],
    ssr: false,
})