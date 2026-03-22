import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@chat/ui/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 shadow-sm hover:shadow-md active:shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-primary/20 hover:from-primary/90 hover:to-primary/80 hover:shadow-primary/30 active:shadow-primary/10",
        outline:
          "border-2 border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/30 hover:text-foreground aria-expanded:bg-primary/5 aria-expanded:text-foreground dark:border-primary/30 dark:bg-background/50 dark:hover:bg-primary/10",
        secondary:
          "bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground shadow-secondary/20 hover:from-secondary/90 hover:to-secondary/80 hover:shadow-secondary/30 active:shadow-secondary/10",
        ghost:
          "hover:bg-primary/10 hover:text-primary aria-expanded:bg-primary/10 aria-expanded:text-primary dark:hover:bg-primary/20",
        destructive:
          "bg-gradient-to-br from-destructive/90 to-destructive text-destructive-foreground shadow-destructive/20 hover:from-destructive hover:to-destructive/90 hover:shadow-destructive/30 active:shadow-destructive/10",
        link: "text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors duration-200",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 min-h-[44px] min-w-[44px]",
        xs: "h-8 gap-1 rounded-[min(var(--radius-md),12px)] px-3 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3 min-h-[36px] min-w-[36px]",
        sm: "h-9 gap-1.5 rounded-[min(var(--radius-md),14px)] px-3.5 text-[0.875rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5 min-h-[40px] min-w-[40px]",
        lg: "h-12 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 text-base min-h-[48px] min-w-[48px]",
        icon: "size-10 min-h-[44px] min-w-[44px]",
        "icon-xs":
          "size-8 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3 min-h-[36px] min-w-[36px]",
        "icon-sm":
          "size-9 rounded-[min(var(--radius-md),14px)] in-data-[slot=button-group]:rounded-lg min-h-[40px] min-w-[40px]",
        "icon-lg": "size-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
