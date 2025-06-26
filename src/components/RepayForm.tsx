import { Button } from "@/components/ui/button";
import { TOKENS } from "@/lib/utils";
import { useState } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";

export default function RepayForm() {
  const [token, setToken] = useState<string>(TOKENS[0].symbol);
  const { address } = useAccount();
  const handleRepay = () => {
    if (!address) {
      return;
    }
    // ...rest of logic
  };
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-md mx-auto">
      <div className="font-semibold text-lg mb-4">Repay</div>
      <form className="flex flex-col gap-4">
        <div>
          <label className="block text-xs mb-1 font-medium">Token</label>
          <select className="w-full border rounded px-3 py-2 bg-background" value={token} onChange={e => setToken(e.target.value)}>
            {TOKENS.map(t => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Amount</label>
          <input type="number" min="0" className="w-full border rounded px-3 py-2 bg-background" placeholder="0.00" />
        </div>
        <Button type="button" onClick={handleRepay}>Repay</Button>
      </form>
    </div>
  );
} 