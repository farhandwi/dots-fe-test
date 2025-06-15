import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "@/components/ui/select";

// Mock the Lucide React icons
jest.mock("lucide-react", () => ({
  Check: () => <div data-testid="check-icon">Check</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  ChevronUp: () => <div data-testid="chevron-up-icon">ChevronUp</div>,
}));

// Mock Radix UI Select components
jest.mock("@radix-ui/react-select", () => {
  const Root = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-root">{children}</div>
  );

  const Group = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="select-group" className={className}>
      {children}
    </div>
  );

  const Value = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="select-value" className={className}>
      {children}
    </div>
  );

  const Trigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
  >(({ children, className, ...props }, ref) => (
    <button data-testid="select-trigger" ref={ref} className={className} {...props}>
      {children}
    </button>
  ));
  Trigger.displayName = "SelectTrigger";

  const Icon = ({ asChild, children }: { asChild: boolean; children: React.ReactNode }) => (
    <div data-testid="select-icon">{children}</div>
  );

  const Portal = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-portal">{children}</div>
  );

  const Content = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { 
      children: React.ReactNode;
      position?: "popper" | "item-aligned";
    }
  >(({ children, className, position, ...props }, ref) => (
    <div 
      data-testid="select-content" 
      ref={ref} 
      className={className} 
      data-position={position}
      {...props}
    >
      {children}
    </div>
  ));
  Content.displayName = "SelectContent";

  const ScrollUpButton = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
  >(({ children, className, ...props }, ref) => (
    <div 
      data-testid="select-scroll-up-button" 
      ref={ref} 
      className={className}
      {...props}
    >
      {children}
    </div>
  ));
  ScrollUpButton.displayName = "SelectScrollUpButton";

  const ScrollDownButton = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
  >(({ children, className, ...props }, ref) => (
    <div 
      data-testid="select-scroll-down-button" 
      ref={ref} 
      className={className}
      {...props}
    >
      {children}
    </div>
  ));
  ScrollDownButton.displayName = "SelectScrollDownButton";

  const Viewport = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="select-viewport" className={className}>
      {children}
    </div>
  );

  const Label = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
  >(({ children, className, ...props }, ref) => (
    <div data-testid="select-label" ref={ref} className={className} {...props}>
      {children}
    </div>
  ));
  Label.displayName = "SelectLabel";

  const Item = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
  >(({ children, className, ...props }, ref) => (
    <div data-testid="select-item" ref={ref} className={className} {...props}>
      {children}
    </div>
  ));
  Item.displayName = "SelectItem";

  const ItemIndicator = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-item-indicator">{children}</div>
  );

  const ItemText = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-item-text">{children}</div>
  );

  const Separator = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(({ className, ...props }, ref) => (
    <div data-testid="select-separator" ref={ref} className={className} {...props} />
  ));
  Separator.displayName = "SelectSeparator";

  return {
    Root,
    Group,
    Value,
    Trigger,
    Icon,
    Portal,
    Content,
    ScrollUpButton,
    ScrollDownButton,
    Viewport,
    Label,
    Item,
    ItemIndicator,
    ItemText,
    Separator,
  };
});

// Mock the cn utility
jest.mock("../../src/lib/utils", () => ({
  cn: (...inputs: string[]) => inputs.filter(Boolean).join(" "),
}));

describe("Select Component", () => {
  it("renders SelectTrigger correctly", () => {
    render(
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
    );

    const trigger = screen.getByTestId("select-trigger");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass("flex");
    expect(trigger).toHaveClass("h-9");
    expect(trigger).toHaveClass("w-full");
    
    const icon = screen.getByTestId("select-icon");
    expect(icon).toBeInTheDocument();
    
    const chevronIcon = screen.getByTestId("chevron-down-icon");
    expect(chevronIcon).toBeInTheDocument();
  });

  it("applies custom className to SelectTrigger", () => {
    render(
      <SelectTrigger className="custom-class">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
    );

    const trigger = screen.getByTestId("select-trigger");
    expect(trigger).toHaveClass("custom-class");
    expect(trigger).toHaveClass("flex");
  });

  it("renders SelectContent with default props", () => {
    render(
      <SelectContent>
        <SelectItem value="option">Option</SelectItem>
      </SelectContent>
    );

    const content = screen.getByTestId("select-content");
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass("relative");
    expect(content).toHaveClass("z-50");
    expect(content).toHaveAttribute("data-position", "popper");
    
    const viewport = screen.getByTestId("select-viewport");
    expect(viewport).toBeInTheDocument();
    expect(viewport).toHaveClass("p-1");
    
    const scrollUpButton = screen.getByTestId("select-scroll-up-button");
    expect(scrollUpButton).toBeInTheDocument();
    
    const scrollDownButton = screen.getByTestId("select-scroll-down-button");
    expect(scrollDownButton).toBeInTheDocument();
  });

  it("renders SelectContent with custom position", () => {
    render(
      <SelectContent position="item-aligned">
        <SelectItem value="option">Option</SelectItem>
      </SelectContent>
    );

    const content = screen.getByTestId("select-content");
    expect(content).toHaveAttribute("data-position", "item-aligned");
    
    const viewport = screen.getByTestId("select-viewport");
    expect(viewport).not.toHaveClass("h-[var(--radix-select-trigger-height)]");
  });

  it("renders SelectItem correctly", () => {
    render(<SelectItem value="option">Option Text</SelectItem>);

    const item = screen.getByTestId("select-item");
    expect(item).toBeInTheDocument();
    expect(item).toHaveClass("relative");
    expect(item).toHaveClass("flex");
    
    const itemText = screen.getByTestId("select-item-text");
    expect(itemText).toHaveTextContent("Option Text");
    
    const itemIndicator = screen.getByTestId("select-item-indicator");
    expect(itemIndicator).toBeInTheDocument();
    
    const checkIcon = screen.getByTestId("check-icon");
    expect(checkIcon).toBeInTheDocument();
  });

  it("renders SelectLabel correctly", () => {
    render(<SelectLabel>Label Text</SelectLabel>);

    const label = screen.getByTestId("select-label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("px-2");
    expect(label).toHaveClass("py-1.5");
    expect(label).toHaveClass("text-sm");
    expect(label).toHaveClass("font-semibold");
    expect(label).toHaveTextContent("Label Text");
  });

  it("renders SelectSeparator correctly", () => {
    render(<SelectSeparator />);

    const separator = screen.getByTestId("select-separator");
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass("-mx-1");
    expect(separator).toHaveClass("my-1");
    expect(separator).toHaveClass("h-px");
    expect(separator).toHaveClass("bg-muted");
  });

  it("renders SelectScrollUpButton correctly", () => {
    render(<SelectScrollUpButton />);

    const button = screen.getByTestId("select-scroll-up-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("flex");
    expect(button).toHaveClass("cursor-default");
    
    const chevronIcon = screen.getByTestId("chevron-up-icon");
    expect(chevronIcon).toBeInTheDocument();
  });

  it("renders SelectScrollDownButton correctly", () => {
    render(<SelectScrollDownButton />);

    const button = screen.getByTestId("select-scroll-down-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("flex");
    expect(button).toHaveClass("cursor-default");
    
    const chevronIcon = screen.getByTestId("chevron-down-icon");
    expect(chevronIcon).toBeInTheDocument();
  });

  it("renders a complete Select component", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="potato">Potato</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    // Check that all components are rendered
    expect(screen.getByTestId("select-root")).toBeInTheDocument();
    expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("select-value")).toBeInTheDocument();
    expect(screen.getByTestId("select-content")).toBeInTheDocument();
    expect(screen.getAllByTestId("select-group").length).toBe(2);
    expect(screen.getAllByTestId("select-label").length).toBe(2);
    expect(screen.getAllByTestId("select-item").length).toBe(5);
    expect(screen.getByTestId("select-separator")).toBeInTheDocument();
  });

  it("forwards ref and additional props to SelectTrigger", () => {
    const ref = React.createRef<HTMLButtonElement>();
    
    render(
      <SelectTrigger ref={ref} data-custom="test-value" aria-label="Select">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
    );

    const trigger = screen.getByTestId("select-trigger");
    expect(trigger).toHaveAttribute("data-custom", "test-value");
    expect(trigger).toHaveAttribute("aria-label", "Select");
    expect(ref.current).not.toBeNull();
  });

  it("applies custom className to SelectItem", () => {
    render(
      <SelectItem value="option" className="custom-item-class">
        Option
      </SelectItem>
    );

    const item = screen.getByTestId("select-item");
    expect(item).toHaveClass("custom-item-class");
    expect(item).toHaveClass("relative");
  });
});