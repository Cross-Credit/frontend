import Navbar from "../components/Navbar";
import LendBorrowTabs from "../components/LendBorrowTabs";
import PortfolioSummary from "../components/PortfolioSummary";
import RecentTransactions from "../components/RecentTransactions";
import ChainStatus from "../components/ChainStatus";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex flex-row gap-8 justify-center items-start flex-1 py-12 px-8 max-w-7xl mx-auto w-full">
        <section className="flex-1 max-w-2xl">
          <LendBorrowTabs />
        </section>
        {/* <aside className="flex flex-col gap-8 w-[340px] min-w-[300px]">
          <PortfolioSummary />
          <RecentTransactions />
          <ChainStatus />
        </aside> */}
      </main>
    </div>
  );
}
