import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Input } from "@/components/ui/input";

// Mock the cn utility function
jest.mock("../../src/lib/utils", () => ({
  cn: (...inputs: string[]) => inputs.filter(Boolean).join(" "),
}));

describe("Input Component", () => {
  it("renders correctly with default props", () => {
    render(<Input placeholder="Test placeholder" />);
    
    const inputElement = screen.getByPlaceholderText("Test placeholder");
    expect(inputElement).toBeInTheDocument();
    // Note: HTML input doesn't have a default type in the DOM if not specified
    // The browser behavior treats it as "text", but the attribute won't exist in the DOM
  });
  
  it("renders with text type when explicitly provided", () => {
    render(<Input type="text" placeholder="Text input" />);
    
    const inputElement = screen.getByPlaceholderText("Text input");
    expect(inputElement).toHaveAttribute("type", "text");
  });

  it("applies custom className correctly", () => {
    render(<Input className="custom-class" data-testid="input" />);
    
    const inputElement = screen.getByTestId("input");
    expect(inputElement).toHaveClass("custom-class");
    // Should also have the default classes
    expect(inputElement).toHaveClass("flex");
    expect(inputElement).toHaveClass("h-9");
    expect(inputElement).toHaveClass("w-full");
  });

  it("forwards type prop correctly", () => {
    render(<Input type="password" data-testid="password-input" />);
    
    const inputElement = screen.getByTestId("password-input");
    expect(inputElement).toHaveAttribute("type", "password");
  });

  it("forwards other props correctly", () => {
    render(
      <Input 
        data-testid="test-input"
        id="test-id"
        name="test-name" 
        value="test-value" 
        readOnly 
      />
    );
    
    const inputElement = screen.getByTestId("test-input");
    expect(inputElement).toHaveAttribute("id", "test-id");
    expect(inputElement).toHaveAttribute("name", "test-name");
    expect(inputElement).toHaveAttribute("value", "test-value");
    expect(inputElement).toHaveAttribute("readonly");
  });

  it("forwards ref correctly", () => {
    const ref = jest.fn();
    render(<Input ref={ref} data-testid="ref-input" />);
    
    const inputElement = screen.getByTestId("ref-input");
    expect(ref).toHaveBeenCalledWith(inputElement);
  });

  it("handles user input correctly", async () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} data-testid="input-with-change" />);
    
    const inputElement = screen.getByTestId("input-with-change");
    await userEvent.type(inputElement, "hello");
    
    expect(onChange).toHaveBeenCalledTimes(5); // Once for each character
    expect(inputElement).toHaveValue("hello");
  });

  it("applies disabled styles when disabled", () => {
    render(<Input disabled data-testid="disabled-input" />);
    
    const inputElement = screen.getByTestId("disabled-input");
    expect(inputElement).toBeDisabled();
    expect(inputElement).toHaveClass("disabled:cursor-not-allowed");
    expect(inputElement).toHaveClass("disabled:opacity-50");
  });
});