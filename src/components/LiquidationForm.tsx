import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";

export default function LiquidationForm() {
  const { address } = useAccount();
  const handleLiquidate = () => {
    if (!address) {
      return;
    }
    // ...rest of logic
  };
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-md mx-auto">
      <div className="font-semibold text-lg mb-4">Liquidate Position</div>
      <form className="flex flex-col gap-4">
        <div>
          <label className="block text-xs mb-1 font-medium">Borrower Address</label>
          <input type="text" className="w-full border rounded px-3 py-2 bg-background" placeholder="0x..." />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Amount</label>
          <input type="number" min="0" className="w-full border rounded px-3 py-2 bg-background" placeholder="0.00" />
        </div>
        <Button type="button" onClick={handleLiquidate}>Liquidate</Button>
      </form>
    </div>
  );
} 