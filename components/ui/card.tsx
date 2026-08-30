import * as React from "react"; import { cn } from "@/lib/utils";
export function Card({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn("rounded-[24px] bg-card p-5 text-card-foreground shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10",className)} {...props}/>}
export function CardHeader({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn("mb-4 grid gap-1.5",className)} {...props}/>}
export function CardTitle({className,...props}:React.HTMLAttributes<HTMLHeadingElement>){return <h2 className={cn("font-semibold tracking-tight",className)} {...props}/>}
export function CardDescription({className,...props}:React.HTMLAttributes<HTMLParagraphElement>){return <p className={cn("text-sm text-muted-foreground",className)} {...props}/>}
export function CardContent({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={className} {...props}/>}
