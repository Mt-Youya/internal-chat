import type * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"

import { cn } from "@chat/ui/lib/utils"

function Avatar({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg" | "xl" | "2xl"
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-10 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border/50 after:mix-blend-darken transition-all duration-200 hover:scale-105 hover:shadow-lg data-[size=2xl]:size-16 data-[size=xl]:size-14 data-[size=lg]:size-12 data-[size=sm]:size-8 data-[size=xs]:size-6 dark:after:mix-blend-lighten",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover transition-transform duration-300 group-hover/avatar:scale-110",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-medium text-foreground group-data-[size=2xl]/avatar:text-xl group-data-[size=xl]/avatar:text-lg group-data-[size=lg]/avatar:text-base group-data-[size=sm]/avatar:text-xs group-data-[size=xs]/avatar:text-[10px]",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg ring-2 ring-background select-none transition-all duration-200 hover:scale-110",
        "group-data-[size=xs]/avatar:size-2 group-data-[size=xs]/avatar:[&>svg]:hidden",
        "group-data-[size=sm]/avatar:size-2.5 group-data-[size=sm]/avatar:[&>svg]:size-2",
        "group-data-[size=default]/avatar:size-3 group-data-[size=default]/avatar:[&>svg]:size-2.5",
        "group-data-[size=lg]/avatar:size-4 group-data-[size=lg]/avatar:[&>svg]:size-3",
        "group-data-[size=xl]/avatar:size-5 group-data-[size=xl]/avatar:[&>svg]:size-3.5",
        "group-data-[size=2xl]/avatar:size-6 group-data-[size=2xl]/avatar:[&>svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-3 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:transition-transform *:data-[slot=avatar]:duration-200 hover:*:data-[slot=avatar]:translate-y-[-2px]",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/80 text-sm font-medium text-muted-foreground ring-2 ring-background transition-all duration-200 hover:scale-105 hover:shadow-md group-has-data-[size=2xl]/avatar-group:size-16 group-has-data-[size=xl]/avatar-group:size-14 group-has-data-[size=lg]/avatar-group:size-12 group-has-data-[size=sm]/avatar-group:size-8 group-has-data-[size=xs]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=2xl]/avatar-group:[&>svg]:size-6 group-has-data-[size=xl]/avatar-group:[&>svg]:size-5 group-has-data-[size=lg]/avatar-group:[&>svg]:size-4.5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3 group-has-data-[size=xs]/avatar-group:[&>svg]:size-2.5",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
