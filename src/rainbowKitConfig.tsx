"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { mainnet, polygon, arbitrum, optimism, sepolia } from "wagmi/chains";

export default getDefaultConfig({
    appName: "Cross-Credit Lending",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [mainnet, polygon, arbitrum, optimism, sepolia],
    ssr: false,
})