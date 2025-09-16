import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 border-0",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5",
        outline:
          "border-2 border-primary bg-background text-primary hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:shadow-lg hover:shadow-secondary/25 hover:-translate-y-0.5",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-lg",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-0.5",
        warning: "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-6 py-2 text-base min-w-[120px]",
        sm: "h-9 rounded-lg px-4 text-sm min-w-[80px]",
        lg: "h-14 rounded-xl px-10 text-lg min-w-[140px]",
        xl: "h-16 rounded-xl px-12 text-xl min-w-[160px]",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, loadingText, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? loadingText || "Loading..." : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }