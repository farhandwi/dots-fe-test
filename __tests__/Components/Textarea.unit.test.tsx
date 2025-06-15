import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Textarea } from "@/components/ui/textarea";

// Mock the cn utility function
jest.mock("../../src/lib/utils", () => ({
  cn: (...inputs: string[]) => inputs.filter(Boolean).join(" "),
}));

describe("Textarea Component", () => {
  it("renders correctly with default props", () => {
    render(<Textarea data-testid="textarea" />);
    
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe("TEXTAREA");
    
    // Check default classes
    expect(textarea).toHaveClass("flex");
    expect(textarea).toHaveClass("min-h-[60px]");
    expect(textarea).toHaveClass("w-full");
    expect(textarea).toHaveClass("rounded-md");
    expect(textarea).toHaveClass("border");
    expect(textarea).toHaveClass("border-input");
    expect(textarea).toHaveClass("bg-transparent");
  });

  it("applies custom className correctly", () => {
    render(<Textarea className="custom-class" data-testid="textarea" />);
    
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toHaveClass("custom-class");
    expect(textarea).toHaveClass("flex"); // Should also have default classes
    expect(textarea).toHaveClass("min-h-[60px]");
  });

  it("forwards refs correctly", () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} data-testid="textarea" />);
    
    const textarea = screen.getByTestId("textarea");
    expect(ref.current).toBe(textarea);
  });

  it("accepts and passes through props", () => {
    const placeholder = "Enter text here...";
    const onChange = jest.fn();
    
    render(
      <Textarea 
        placeholder={placeholder} 
        onChange={onChange} 
        rows={5} 
        maxLength={200} 
        disabled 
        data-testid="textarea" 
      />
    );
    
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toHaveAttribute("placeholder", placeholder);
    expect(textarea).toHaveAttribute("rows", "5");
    expect(textarea).toHaveAttribute("maxLength", "200");
    expect(textarea).toBeDisabled();
  });

  it("handles user input correctly", () => {
    const onChange = jest.fn();
    render(<Textarea onChange={onChange} data-testid="textarea" />);
    
    const textarea = screen.getByTestId("textarea");
    fireEvent.change(textarea, { target: { value: "Hello, world!" } });
    
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue("Hello, world!");
  });

  it("applies disabled styles when disabled", () => {
    render(<Textarea disabled data-testid="textarea" />);
    
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass("disabled:cursor-not-allowed");
    expect(textarea).toHaveClass("disabled:opacity-50");
  });

  it("maintains value between renders", () => {
    const { rerender } = render(
      <Textarea value="Initial value" data-testid="textarea" readOnly />
    );
    
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toHaveValue("Initial value");
    
    // Rerender with a different value
    rerender(<Textarea value="Updated value" data-testid="textarea" readOnly />);
    expect(textarea).toHaveValue("Updated value");
  });

  it("can be used in a controlled component pattern", () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState("Initial");
      return (
        <Textarea 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          data-testid="controlled-textarea" 
        />
      );
    };
    
    render(<TestComponent />);
    
    const textarea = screen.getByTestId("controlled-textarea");
    expect(textarea).toHaveValue("Initial");
    
    // Change the value
    fireEvent.change(textarea, { target: { value: "Updated value" } });
    expect(textarea).toHaveValue("Updated value");
  });

  it("renders with placeholder text", () => {
    const placeholder = "Type your message here...";
    render(<Textarea placeholder={placeholder} data-testid="textarea" />);
    
    const textarea = screen.getByPlaceholderText(placeholder);
    expect(textarea).toBeInTheDocument();
    expect(textarea).toBe(screen.getByTestId("textarea"));
  });
});