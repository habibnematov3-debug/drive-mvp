import { cn } from "@/lib/utils"

function Spinner({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-brand-blue border-t-transparent",
        {
          "h-4 w-4": size === "sm",
          "h-6 w-6": size === "md",
          "h-8 w-8": size === "lg",
        },
        className
      )}
    />
  )
}

export { Spinner }
