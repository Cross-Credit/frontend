import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
    value: string;
    setValue: (v: string) => void;
}
const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
    defaultValue: string;
    value?: string;
    onValueChange?: (v: string) => void;
    className?: string;
    children: React.ReactNode;
}

export function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children }: TabsProps) {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
    const setValue = onValueChange || setUncontrolledValue;
    return (
        <TabsContext.Provider value={{ value, setValue }}>
            <div className={cn("", className)}>{children}</div>
        </TabsContext.Provider>
    );
}

interface TabsListProps {
    className?: string;
    children: React.ReactNode;
}

export function TabsList({ className, children }: TabsListProps) {
    return <div className={cn("flex gap-2", className)}>{children}</div>;
}

interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
    const ctx = React.useContext(TabsContext);
    if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
    const active = ctx.value === value;
    return (
        <button
            type="button"
            className={cn(
                "px-4 py-2 rounded-t-md border-b-2 font-medium transition-colors",
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                className
            )}
            onClick={() => ctx.setValue(value)}
        >
            {children}
        </button>
    );
}

interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
    const ctx = React.useContext(TabsContext);
    if (!ctx) throw new Error("TabsContent must be used within Tabs");
    if (ctx.value !== value) return null;
    return <div className={cn("mt-4", className)}>{children}</div>;
} 