import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        secondary: "border border-brand-blue/45 bg-white text-brand-blue hover:bg-blue-50",
        green: "bg-brand-green text-white shadow hover:bg-brand-green/90",
        ghost: "text-brand-navy hover:bg-blue-50 hover:text-brand-blue",
        outline: "border border-input bg-white hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 px-4",
        lg: "h-[58px] px-7",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);

Button.displayName = "Button";

export { Button };
