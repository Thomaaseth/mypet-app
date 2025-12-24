import * as React from "react"
import { Dialog as HeadlessDialog, DialogBackdrop, DialogPanel } from "@headlessui/react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Context to manage alert dialog state
interface AlertDialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null)

function useAlertDialogContext() {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error("AlertDialog compound components must be used within AlertDialog")
  }
  return context
}

// Root AlertDialog component
interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function AlertDialog({ open: controlledOpen, onOpenChange, children }: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(newOpen)
      }
      if (!isControlled) {
        setUncontrolledOpen(newOpen)
      }
    },
    [isControlled, onOpenChange]
  )

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

// Trigger component
interface AlertDialogTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean
}

function AlertDialogTrigger({ asChild, children, onClick, ...props }: AlertDialogTriggerProps) {
  const { onOpenChange } = useAlertDialogContext()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onOpenChange(true)
    onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick,
    } as React.HTMLAttributes<HTMLElement>)
  }

  return (
    <button data-slot="alert-dialog-trigger" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

// Portal component (no-op)
type AlertDialogPortalProps = {
  children: React.ReactNode
}

function AlertDialogPortal({ children }: AlertDialogPortalProps) {
  return <>{children}</>
}

// Overlay component (deprecated - kept for backwards compatibility)
type AlertDialogOverlayProps = React.ComponentPropsWithoutRef<"div">

function AlertDialogOverlay({ className, ...props }: AlertDialogOverlayProps) {
  return (
    <div
      data-slot="alert-dialog-overlay"
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  )
}

// Content component - using modern Headless UI v2.1+ API
type AlertDialogContentProps = React.ComponentPropsWithoutRef<"div">

function AlertDialogContent({ className, children, ...props }: AlertDialogContentProps) {
  const { open, onOpenChange } = useAlertDialogContext()

  return (
    <HeadlessDialog open={open} onClose={() => onOpenChange(false)} className="relative z-50">
      {/* Backdrop with transition */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 transition duration-200 ease-out data-[closed]:opacity-0"
      />

      {/* Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Panel with transition */}
        <DialogPanel
          transition
          data-slot="alert-dialog-content"
          className={cn(
            "bg-background relative grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg",
            "transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0",
            className
          )}
          {...props}
        >
          {children}
        </DialogPanel>
      </div>
    </HeadlessDialog>
  )
}

// Header component
type AlertDialogHeaderProps = React.ComponentPropsWithoutRef<"div">

function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

// Footer component
type AlertDialogFooterProps = React.ComponentPropsWithoutRef<"div">

function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

// Title component
type AlertDialogTitleProps = React.ComponentPropsWithoutRef<"h2">

function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
  return (
    <HeadlessDialog.Title
      as="h2"
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

// Description component
type AlertDialogDescriptionProps = React.ComponentPropsWithoutRef<"p">

function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps) {
  return (
    <HeadlessDialog.Description
      as="p"
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

// Action component (button that confirms/proceeds)
interface AlertDialogActionProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean
}

function AlertDialogAction({ asChild, className, onClick, ...props }: AlertDialogActionProps) {
  const { onOpenChange } = useAlertDialogContext()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    // Only close if the onClick handler didn't prevent default
    if (!e.defaultPrevented) {
      onOpenChange(false)
    }
  }

  if (asChild && React.isValidElement(props.children)) {
    return React.cloneElement(props.children, {
      className: cn(buttonVariants(), className),
      onClick: handleClick,
    } as React.HTMLAttributes<HTMLElement>)
  }

  return (
    <button className={cn(buttonVariants(), className)} onClick={handleClick} {...props} />
  )
}

// Cancel component (button that cancels/dismisses)
interface AlertDialogCancelProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean
}

function AlertDialogCancel({ asChild, className, onClick, ...props }: AlertDialogCancelProps) {
  const { onOpenChange } = useAlertDialogContext()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    onOpenChange(false)
  }

  if (asChild && React.isValidElement(props.children)) {
    return React.cloneElement(props.children, {
      className: cn(buttonVariants({ variant: "outline" }), className),
      onClick: handleClick,
    } as React.HTMLAttributes<HTMLElement>)
  }

  return (
    <button
      className={cn(buttonVariants({ variant: "outline" }), className)}
      onClick={handleClick}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}