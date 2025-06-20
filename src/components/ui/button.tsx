import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, ...props }, ref) => (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center rounded-md border border-input bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none",
                className
            )}
            {...props}
        />
    )
);
Button.displayName = "Button";

export default Button; 