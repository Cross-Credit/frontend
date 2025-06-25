// "use client";

// import { useEffect, useState } from "react";
// import { mockGetPortfolio } from "@/lib/utils";

// export default function PortfolioSummary() {
//     const [loading, setLoading] = useState(true);
//     const [portfolio, setPortfolio] = useState<{ supplied: number; borrowed: number; netAPY: number } | null>(null);

//     useEffect(() => {
//         setLoading(true);
//         mockGetPortfolio("0x1234...abcd").then((data) => {
//             setPortfolio(data);
//             setLoading(false);
//         });
//     }, []);

//     return (
//         <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
//             <div className="font-semibold text-lg mb-2">Portfolio Summary</div>
//             {loading || !portfolio ? (
//                 <div className="text-muted-foreground text-sm">Loading...</div>
//             ) : (
//                 <div className="flex flex-col gap-2">
//                     <div className="flex justify-between text-sm">
//                         <span>Total Supplied</span>
//                         <span className="font-mono font-semibold">${portfolio.supplied.toLocaleString()}</span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                         <span>Total Borrowed</span>
//                         <span className="font-mono font-semibold">${portfolio.borrowed.toLocaleString()}</span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                         <span>Net APY</span>
//                         <span className="font-mono font-semibold">{portfolio.netAPY}%</span>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// } 