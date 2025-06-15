import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";

// Mock Radix UI Tooltip components
jest.mock("@radix-ui/react-tooltip", () => {
  const Provider = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  );

  const Root = ({ children, open, defaultOpen, onOpenChange }: { 
    children: React.ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div 
      data-testid="tooltip-root" 
      data-state={open ? "open" : "closed"}
      data-default-open={defaultOpen}
    >
      {children}
    </div>
  );

  const Trigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ children, ...props }, ref) => (
      <button
        data-testid="tooltip-trigger"
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  );
  Trigger.displayName = "TooltipTrigger";

  const Portal = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-portal">
      {children}
    </div>
  );

  const Content = React.forwardRef<
    HTMLDivElement, 
    React.HTMLAttributes<HTMLDivElement> & { 
      sideOffset?: number;
      side?: "top" | "right" | "bottom" | "left";
    }
  >(({ children, className, sideOffset, side = "bottom", ...props }, ref) => (
    <div
      data-testid="tooltip-content"
      ref={ref}
      data-side={side}
      data-side-offset={sideOffset}
      className={className}
      {...props}
    >
      {children}
    </div>
  ));
  Content.displayName = "TooltipContent";

  return {
    Provider,
    Root,
    Trigger,
    Portal,
    Content
  };
});

// Mock the cn utility
jest.mock("../../src/lib/utils", () => ({
  cn: (...inputs: string[]) => inputs.filter(Boolean).join(" ")
}));

describe("Tooltip Component", () => {
  const setup = (
    props = {}, 
    triggerText = "Hover me", 
    contentText = "Tooltip content"
  ) => {
    return render(
      <TooltipProvider>
        <Tooltip {...props}>
          <TooltipTrigger>{triggerText}</TooltipTrigger>
          <TooltipContent>{contentText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  it("renders the tooltip components correctly", () => {
    setup();

    expect(screen.getByTestId("tooltip-provider")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-root")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-portal")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();
    
    expect(screen.getByText("Hover me")).toBeInTheDocument();
    expect(screen.getByText("Tooltip content")).toBeInTheDocument();
  });

  it("applies default sideOffset to TooltipContent", () => {
    setup();

    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveAttribute("data-side-offset", "4");
  });

  it("accepts custom sideOffset for TooltipContent", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent sideOffset={10}>Custom offset</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveAttribute("data-side-offset", "10");
  });

  it("applies default styles to TooltipContent", () => {
    setup();

    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveClass("z-50");
    expect(content).toHaveClass("overflow-hidden");
    expect(content).toHaveClass("rounded-md");
    expect(content).toHaveClass("bg-primary");
    expect(content).toHaveClass("px-3");
    expect(content).toHaveClass("py-1.5");
    expect(content).toHaveClass("text-xs");
    expect(content).toHaveClass("text-primary-foreground");
  });

  it("merges custom className with default styles", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent className="custom-class">Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveClass("custom-class");
    expect(content).toHaveClass("z-50"); // Should still have default classes
  });

  it("forwards ref to TooltipContent", () => {
    const ref = React.createRef<HTMLDivElement>();
    
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent ref={ref}>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    
    expect(ref.current).toBe(screen.getByTestId("tooltip-content"));
  });

  it("forwards props to TooltipContent", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent 
            data-custom="test-value"
            aria-label="Tooltip description"
          >
            Content
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveAttribute("data-custom", "test-value");
    expect(content).toHaveAttribute("aria-label", "Tooltip description");
  });

  it("can set the tooltip to be open by default", () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const root = screen.getByTestId("tooltip-root");
    expect(root).toHaveAttribute("data-default-open", "true");
  });

  it("renders a complete tooltip with all subcomponents", () => {
    const { container } = setup({ defaultOpen: true }, "Help", "This is a helpful tip");
    
    expect(screen.getByText("Help")).toBeInTheDocument();
    expect(screen.getByText("This is a helpful tip")).toBeInTheDocument();
    
    const trigger = screen.getByTestId("tooltip-trigger");
    expect(trigger).toHaveTextContent("Help");
    
    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveTextContent("This is a helpful tip");
  });

  it("forwards props to TooltipTrigger", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger 
            data-testid="custom-trigger"
            aria-label="More information"
            className="custom-trigger-class"
          >
            Help
          </TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByTestId("custom-trigger");
    expect(trigger).toHaveAttribute("aria-label", "More information");
    expect(trigger).toHaveClass("custom-trigger-class");
  });

  it("handles side prop correctly", () => {
    // We need to use a side prop in our test, assuming the mock passes this through
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent side="top">Top Tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const content = screen.getByTestId("tooltip-content");
    expect(content).toHaveAttribute("data-side", "top");
  });
});