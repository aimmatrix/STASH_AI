import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps {
    children: ReactNode;
    className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
    return (
        <div className={cn("grid gap-4 grid-cols-1 md:grid-cols-2", className)}>
            {children}
        </div>
    );
}
