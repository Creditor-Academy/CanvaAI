import * as React from "react"
import { useCallback } from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "../utils"
import { scrollLockManager } from '../../utils/scrollLockManager'

const DropdownMenu = ({ modal = false, ...props }) => (
  <DropdownMenuPrimitive.Root modal={modal} {...props} />
)

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef(({ className, onOpenAutoFocus, onCloseAutoFocus, ...props }, ref) => {
  // CRITICAL FIX: Prevent focus stealing and scroll jumps when submenu opens
  const handleOpenAutoFocus = useCallback((e) => {
    e.preventDefault();
    window.isToolbarInteraction = true;
    window.wasToolbarInteractionRecent = true;
    
    // LOCK SCROLL when submenu opens
    const editorContainer = document.querySelector('.editor-scroll-container, .content-container');
    if (editorContainer) {
      require('../../utils/scrollLockManager').scrollLockManager.lock(editorContainer);
    }
    
    setTimeout(() => {
      window.isToolbarInteraction = false;
      require('../../utils/scrollLockManager').scrollLockManager.unlock();
    }, 500);
    
    setTimeout(() => {
      window.wasToolbarInteractionRecent = false;
    }, 1000);
    
    onOpenAutoFocus?.(e);
  }, [onOpenAutoFocus]);
  
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-[300] min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      onOpenAutoFocus={handleOpenAutoFocus}
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        onCloseAutoFocus?.(e);
      }}
      {...props}
    />
  );
})
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, onOpenAutoFocus, onCloseAutoFocus, align = "start", ...props }, ref) => {
  // CRITICAL FIX: Prevent focus stealing and scroll jumps when dropdown opens
  const handleOpenAutoFocus = useCallback((e) => {
    e.preventDefault();
    window.isToolbarInteraction = true;
    window.wasToolbarInteractionRecent = true;
    
    // LOCK SCROLL when dropdown opens
    const editorContainer = document.querySelector('.editor-scroll-container, .content-container');
    if (editorContainer) {
      scrollLockManager.lock(editorContainer);
    }
    
    setTimeout(() => {
      window.isToolbarInteraction = false;
      scrollLockManager.unlock();
    }, 500);
    
    setTimeout(() => {
      window.wasToolbarInteractionRecent = false;
    }, 1000);
    
    onOpenAutoFocus?.(e);
  }, [onOpenAutoFocus]);
  
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        avoidCollisions={true}
        collisionPadding={8}
        position="popper"
        className={cn(
          "z-[300] min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          onCloseAutoFocus?.(e);
        }}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
})
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef(({ className, inset, onClick, ...props }, ref) => {
  const handleClick = (e) => {
    console.log('🎯 [DropdownMenuItem] Click handler called!');
    onClick?.(e);
  };
  
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      onMouseDown={(e) => {
        console.log('🖱️ [DropdownMenuItem] Mouse down event');
        window.isToolbarInteraction = true;
        setTimeout(() => {
          window.isToolbarInteraction = false;
        }, 300);
      }}
      onClick={handleClick}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
})
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
