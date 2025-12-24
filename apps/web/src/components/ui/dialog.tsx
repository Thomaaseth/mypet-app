import * as React from "react"
import { Dialog as HeadlessDialog, DialogBackdrop, DialogPanel } from "@headlessui/react"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Context to manage dialog state
interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog compound components must be used within Dialog")
  }
  return context
}

// Root Dialog component
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
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
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

// Trigger component
interface DialogTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean
}

function DialogTrigger({ asChild, children, onClick, ...props }: DialogTriggerProps) {
  const { onOpenChange } = useDialogContext()

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
    <button data-slot="dialog-trigger" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

// Portal component (no-op - Headless UI handles portaling)
type DialogPortalProps = {
  children: React.ReactNode
}

function DialogPortal({ children }: DialogPortalProps) {
  return <>{children}</>
}

// Close component
interface DialogCloseProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean
}

function DialogClose({ asChild, children, onClick, ...props }: DialogCloseProps) {
  const { onOpenChange } = useDialogContext()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onOpenChange(false)
    onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick,
    } as React.HTMLAttributes<HTMLElement>)
  }

  return (
    <button data-slot="dialog-close" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

// Overlay component (deprecated - kept for backwards compatibility)
type DialogOverlayProps = React.ComponentPropsWithoutRef<"div">

function DialogOverlay({ className, ...props }: DialogOverlayProps) {
  return (
    <div
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  )
}

// Content component - using modern Headless UI v2.1+ API
interface DialogContentProps extends React.ComponentPropsWithoutRef<"div"> {
  showCloseButton?: boolean
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const { open, onOpenChange } = useDialogContext()

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
          data-slot="dialog-content"
          className={cn(
            "bg-background relative grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg",
            "transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0",
            className
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogClose
              data-slot="dialog-close"
              className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          )}
        </DialogPanel>
      </div>
    </HeadlessDialog>
  )
}

// Header component
type DialogHeaderProps = React.ComponentPropsWithoutRef<"div">

function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

// Footer component
type DialogFooterProps = React.ComponentPropsWithoutRef<"div">

function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

// Title component
type DialogTitleProps = React.ComponentPropsWithoutRef<"h2">

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <HeadlessDialog.Title
      as="h2"
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

// Description component
type DialogDescriptionProps = React.ComponentPropsWithoutRef<"p">

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <HeadlessDialog.Description
      as="p"
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}