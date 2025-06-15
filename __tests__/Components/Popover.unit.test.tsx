import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "@/components/ui/popover";

// Mock Radix UI Popover components
jest.mock("@radix-ui/react-popover", () => {
  const Root = ({ children }: { children: React.ReactNode }) => <div data-testid="popover-root">{children}</div>;
  
  const Trigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ children, ...props }, ref) => (
      <button ref={ref} data-testid="popover-trigger" {...props}>
        {children}
      </button>
    )
  );
  
  const Anchor = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ children, ...props }, ref) => (
      <div ref={ref} data-testid="popover-anchor" {...props}>
        {children}
      </div>
    )
  );
  
  const Content = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end";
    sideOffset?: number;
  }>(
    ({ children, align, sideOffset, className, ...props }, ref) => (
      <div 
        ref={ref} 
        data-testid="popover-content" 
        data-align={align} 
        data-side-offset={sideOffset} 
        className={className}
        {...props}
      >
        {children}
      </div>
    )
  );
  
  const Portal = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-portal">{children}</div>
  );
  
  return {
    Root,
    Trigger,
    Anchor,
    Content,
    Portal
  };
});

// Mock the cn utility
jest.mock("../../src/lib/utils", () => ({
  cn: (...inputs: string[]) => inputs.filter(Boolean).join(" ")
}));

describe("Popover Component", () => {
  it("renders Popover with Trigger and Content", () => {
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>Popover Content</PopoverContent>
      </Popover>
    );
    
    expect(screen.getByTestId("popover-root")).toBeInTheDocument();
    expect(screen.getByTestId("popover-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("popover-trigger")).toHaveTextContent("Open Popover");
    expect(screen.getByTestId("popover-portal")).toBeInTheDocument();
    expect(screen.getByTestId("popover-content")).toBeInTheDocument();
    expect(screen.getByTestId("popover-content")).toHaveTextContent("Popover Content");
  });
  
  it("passes className correctly to PopoverContent", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent className="custom-class">Content</PopoverContent>
      </Popover>
    );
    
    const content = screen.getByTestId("popover-content");
    expect(content).toHaveClass("custom-class");
    expect(content).toHaveClass("z-50");
    expect(content).toHaveClass("rounded-md");
    expect(content).toHaveClass("border");
  });
  
  it("uses default align and sideOffset values", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );
    
    const content = screen.getByTestId("popover-content");
    expect(content).toHaveAttribute("data-align", "center");
    expect(content).toHaveAttribute("data-side-offset", "4");
  });
  
  it("accepts custom align and sideOffset props", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent align="start" sideOffset={10}>Content</PopoverContent>
      </Popover>
    );
    
    const content = screen.getByTestId("popover-content");
    expect(content).toHaveAttribute("data-align", "start");
    expect(content).toHaveAttribute("data-side-offset", "10");
  });
  
  it("forwards refs correctly", () => {
    const ref = React.createRef<HTMLDivElement>();
    
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent ref={ref}>Content</PopoverContent>
      </Popover>
    );
    
    expect(ref.current).not.toBeNull();
  });
  
  it("forwards additional props to PopoverContent", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent data-custom="test-value" aria-label="Popover">
          Content
        </PopoverContent>
      </Popover>
    );
    
    const content = screen.getByTestId("popover-content");
    expect(content).toHaveAttribute("data-custom", "test-value");
    expect(content).toHaveAttribute("aria-label", "Popover");
  });
  
  it("renders PopoverAnchor correctly", () => {
    render(
      <Popover>
        <PopoverAnchor>Anchor Point</PopoverAnchor>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );
    
    expect(screen.getByTestId("popover-anchor")).toBeInTheDocument();
    expect(screen.getByTestId("popover-anchor")).toHaveTextContent("Anchor Point");
  });
});