import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Label } from "@/components/ui/label";

// Mock the dependencies
jest.mock("@radix-ui/react-label", () => ({
  Root: React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ children, className, htmlFor, ...props }, ref) => (
      <label ref={ref} className={className} htmlFor={htmlFor} {...props}>
        {children}
      </label>
    )
  ),
}));

jest.mock("class-variance-authority", () => {
  return {
    cva: () => () => "mock-cva-class",
  };
});

jest.mock("../../src/lib/utils", () => ({
  cn: (...inputs: string[]) => inputs.filter(Boolean).join(" "),
}));

describe("Label Component", () => {
  it("renders correctly with default props", () => {
    render(<Label>Test Label</Label>);
    
    const labelElement = screen.getByText("Test Label");
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).toHaveClass("mock-cva-class");
  });

  it("applies custom className correctly", () => {
    render(<Label className="custom-class">Custom Label</Label>);
    
    const labelElement = screen.getByText("Custom Label");
    expect(labelElement).toHaveClass("mock-cva-class");
    expect(labelElement).toHaveClass("custom-class");
  });

  it("forwards additional props correctly", () => {
    render(
      <Label data-testid="test-label" htmlFor="test-input">
        Label with For
      </Label>
    );
    
    const labelElement = screen.getByTestId("test-label");
    expect(labelElement).toHaveAttribute("for", "test-input");
    expect(labelElement).toHaveTextContent("Label with For");
  });

  it("forwards ref correctly", () => {
    // Create a ref using React's createRef
    const ref = React.createRef<HTMLLabelElement>();
    
    render(<Label ref={ref}>Ref Label</Label>);
    const labelElement = screen.getByText("Ref Label");
    
    // Verify the ref has been attached to the element
    expect(ref.current).not.toBeNull();
  });

  // Test for association with form controls
  it("associates with a form control", () => {
    render(
      <>
        <Label htmlFor="test-input">Associated Label</Label>
        <input id="test-input" data-testid="input" />
      </>
    );
    
    const labelElement = screen.getByText("Associated Label");
    const inputElement = screen.getByTestId("input");
    
    expect(labelElement).toHaveAttribute("for", "test-input");
    expect(inputElement).toHaveAttribute("id", "test-input");
    
    // Verify the association works correctly
    expect(labelElement).toBeInTheDocument();
    expect(inputElement).toBeInTheDocument();
  });

  it("handles variant styles correctly", () => {
    render(<Label className="variant-class">Variant Label</Label>);
    
    const labelElement = screen.getByText("Variant Label");
    expect(labelElement).toHaveClass("mock-cva-class");
    expect(labelElement).toHaveClass("variant-class");
  });
});