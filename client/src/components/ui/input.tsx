import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  icon?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
              <i className={`${icon} text-lg`}></i>
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-lg border-2 border-input bg-background text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 touch-manipulation",
              icon ? "pl-12 pr-4 py-3" : "px-4 py-3",
              error ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500" : "",
              "md:h-10 md:text-sm md:px-3 md:py-2", // Smaller on desktop
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500 flex items-center font-medium">
            <i className="fas fa-exclamation-circle mr-2 text-xs"></i>
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
