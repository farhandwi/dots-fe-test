import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

jest.mock("../../src/lib/utils", () => ({
  cn: (...inputs: string[]) => inputs.filter(Boolean).join(" "),
}));

describe("Table Components", () => {
  describe("Table", () => {
    it("renders correctly with default props", () => {
      render(<Table data-testid="table" />);
      
      // Check the wrapper div
      const tableWrapper = screen.getByTestId("table").parentElement;
      expect(tableWrapper).toHaveClass("relative");
      expect(tableWrapper).toHaveClass("w-full");
      expect(tableWrapper).toHaveClass("overflow-auto");
      
      // Check the table element
      const table = screen.getByTestId("table");
      expect(table).toHaveClass("w-full");
      expect(table).toHaveClass("caption-bottom");
      expect(table).toHaveClass("text-sm");
    });

    it("applies custom className correctly", () => {
      render(<Table className="custom-class" data-testid="table" />);
      
      const table = screen.getByTestId("table");
      expect(table).toHaveClass("custom-class");
      expect(table).toHaveClass("w-full"); // Default class still present
    });

    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLTableElement>();
      render(<Table ref={ref} data-testid="table" />);
      
      expect(ref.current).toBe(screen.getByTestId("table"));
    });

    it("forwards additional props correctly", () => {
      render(<Table data-testid="table" aria-label="Test table" id="test-id" />);
      
      const table = screen.getByTestId("table");
      expect(table).toHaveAttribute("aria-label", "Test table");
      expect(table).toHaveAttribute("id", "test-id");
    });
  });

  describe("TableHeader", () => {
    it("renders correctly with default props", () => {
      render(
        <table>
          <TableHeader data-testid="table-header" />
        </table>
      );
      
      const header = screen.getByTestId("table-header");
      expect(header.tagName).toBe("THEAD");
      expect(header).toHaveClass("[&_tr]:border-b");
    });

    it("applies custom className correctly", () => {
      render(
        <table>
          <TableHeader className="custom-class" data-testid="table-header" />
        </table>
      );
      
      const header = screen.getByTestId("table-header");
      expect(header).toHaveClass("custom-class");
      expect(header).toHaveClass("[&_tr]:border-b");
    });

    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <table>
          <TableHeader ref={ref} data-testid="table-header" />
        </table>
      );
      
      expect(ref.current).toBe(screen.getByTestId("table-header"));
    });
  });

  describe("TableBody", () => {
    it("renders correctly with default props", () => {
      render(
        <table>
          <TableBody data-testid="table-body" />
        </table>
      );
      
      const body = screen.getByTestId("table-body");
      expect(body.tagName).toBe("TBODY");
      expect(body).toHaveClass("[&_tr:last-child]:border-0");
    });

    it("applies custom className correctly", () => {
      render(
        <table>
          <TableBody className="custom-class" data-testid="table-body" />
        </table>
      );
      
      const body = screen.getByTestId("table-body");
      expect(body).toHaveClass("custom-class");
      expect(body).toHaveClass("[&_tr:last-child]:border-0");
    });

    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <table>
          <TableBody ref={ref} data-testid="table-body" />
        </table>
      );
      
      expect(ref.current).toBe(screen.getByTestId("table-body"));
    });
  });

  describe("TableFooter", () => {
    it("renders correctly with default props", () => {
      render(
        <table>
          <TableFooter data-testid="table-footer" />
        </table>
      );
      
      const footer = screen.getByTestId("table-footer");
      expect(footer.tagName).toBe("TFOOT");
      expect(footer).toHaveClass("border-t");
      expect(footer).toHaveClass("bg-muted/50");
      expect(footer).toHaveClass("font-medium");
      expect(footer).toHaveClass("[&>tr]:last:border-b-0");
    });

    it("applies custom className correctly", () => {
      render(
        <table>
          <TableFooter className="custom-class" data-testid="table-footer" />
        </table>
      );
      
      const footer = screen.getByTestId("table-footer");
      expect(footer).toHaveClass("custom-class");
      expect(footer).toHaveClass("border-t");
    });

    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <table>
          <TableFooter ref={ref} data-testid="table-footer" />
        </table>
      );
      
      expect(ref.current).toBe(screen.getByTestId("table-footer"));
    });
  });

  describe("TableRow", () => {
    it("renders correctly with default props", () => {
      render(
        <table>
          <tbody>
            <TableRow data-testid="table-row" />
          </tbody>
        </table>
      );
      
      const row = screen.getByTestId("table-row");
      expect(row.tagName).toBe("TR");
      expect(row).toHaveClass("border-b");
      expect(row).toHaveClass("transition-colors");
      expect(row).toHaveClass("hover:bg-muted/50");
      expect(row).toHaveClass("data-[state=selected]:bg-muted");
    });

    it("applies custom className correctly", () => {
      render(
        <table>
          <tbody>
            <TableRow className="custom-class" data-testid="table-row" />
          </tbody>
        </table>
      );
      
      const row = screen.getByTestId("table-row");
      expect(row).toHaveClass("custom-class");
      expect(row).toHaveClass("border-b");
    });

    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLTableRowElement>();
      render(
        <table>
          <tbody>
            <TableRow ref={ref} data-testid="table-row" />
          </tbody>
        </table>
      );
      
      expect(ref.current).toBe(screen.getByTestId("table-row"));
    });
  });

  describe("TableHead", () => {
    it("renders correctly with default props", () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead data-testid="table-head" />
            </tr>
          </thead>
        </table>
      );
      
      const head = screen.getByTestId("table-head");
      expect(head.tagName).toBe("TH");
      expect(head).toHaveClass("h-10");
      expect(head).toHaveClass("px-2");
      expect(head).toHaveClass("text-left");
      expect(head).toHaveClass("align-middle");
      expect(head).toHaveClass("font-medium");
      expect(head).toHaveClass("text-muted-foreground");
      expect(head).toHaveClass("[&:has([role=checkbox])]:pr-0");
      expect(head).toHaveClass("[&>[role=checkbox]]:translate-y-[2px]");
    });

    it("applies custom className correctly", () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead className="custom-class" data-testid="table-head" />
            </tr>
          </thead>
        </table>
      );
      
      const head = screen.getByTestId("table-head");
      expect(head).toHaveClass("custom-class");
      expect(head).toHaveClass("h-10");
    });

    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLTableCellElement>();
      render(
        <table>
          <thead>
            <tr>
              <TableHead ref={ref} data-testid="table-head" />
            </tr>
          </thead>
        </table>
      );
      
      expect(ref.current).toBe(screen.getByTestId("table-head"));
    });
  });

  describe("TableCell", () => {
    it("renders correctly with default props", () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell data-testid="table-cell" />
            </tr>
          </tbody>
        </table>
      );
      
      const cell = screen.getByTestId("table-cell");
      expect(cell.tagName).toBe("TD");
      expect(cell).toHaveClass("p-2");
      expect(cell).toHaveClass("align-middle");
      expect(cell).toHaveClass("[&:has([role=checkbox])]:pr-0");
      expect(cell).toHaveClass("[&>[role=checkbox]]:translate-y-[2px]");
    });

    it("applies custom className correctly", () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell className="custom-class" data-testid="table-cell" />
            </tr>
          </tbody>
        </table>
      );
      
      const cell = screen.getByTestId("table-cell");
      expect(cell).toHaveClass("custom-class");
      expect(cell).toHaveClass("p-2");
    });

    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLTableCellElement>();
      render(
        <table>
          <tbody>
            <tr>
              <TableCell ref={ref} data-testid="table-cell" />
            </tr>
          </tbody>
        </table>
      );
      
      expect(ref.current).toBe(screen.getByTestId("table-cell"));
    });
  });

  describe("TableCaption", () => {
    it("renders correctly with default props", () => {
      render(
        <table>
          <TableCaption data-testid="table-caption" />
        </table>
      );
      
      const caption = screen.getByTestId("table-caption");
      expect(caption.tagName).toBe("CAPTION");
      expect(caption).toHaveClass("mt-4");
      expect(caption).toHaveClass("text-sm");
      expect(caption).toHaveClass("text-muted-foreground");
    });

    it("applies custom className correctly", () => {
      render(
        <table>
          <TableCaption className="custom-class" data-testid="table-caption" />
        </table>
      );
      
      const caption = screen.getByTestId("table-caption");
      expect(caption).toHaveClass("custom-class");
      expect(caption).toHaveClass("mt-4");
    });

    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLTableCaptionElement>();
      render(
        <table>
          <TableCaption ref={ref} data-testid="table-caption" />
        </table>
      );
      
      expect(ref.current).toBe(screen.getByTestId("table-caption"));
    });
  });

  describe("Complete Table", () => {
    it("renders a complete table with all components", () => {
      render(
        <Table data-testid="complete-table">
          <TableCaption>Table Caption</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Header 1</TableHead>
              <TableHead>Header 2</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell 1-1</TableCell>
              <TableCell>Cell 1-2</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Cell 2-1</TableCell>
              <TableCell>Cell 2-2</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Footer 1</TableCell>
              <TableCell>Footer 2</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      
      // Check that all parts render correctly
      expect(screen.getByTestId("complete-table")).toBeInTheDocument();
      expect(screen.getByText("Table Caption")).toBeInTheDocument();
      expect(screen.getByText("Header 1")).toBeInTheDocument();
      expect(screen.getByText("Header 2")).toBeInTheDocument();
      expect(screen.getByText("Cell 1-1")).toBeInTheDocument();
      expect(screen.getByText("Cell 1-2")).toBeInTheDocument();
      expect(screen.getByText("Cell 2-1")).toBeInTheDocument();
      expect(screen.getByText("Cell 2-2")).toBeInTheDocument();
      expect(screen.getByText("Footer 1")).toBeInTheDocument();
      expect(screen.getByText("Footer 2")).toBeInTheDocument();
      
      // Verify structure using roles
      const table = screen.getByRole("table");
      const caption = screen.getByText("Table Caption");
      const headers = screen.getAllByRole("columnheader");
      const cells = screen.getAllByRole("cell");
      
      expect(table).toBeInTheDocument();
      expect(caption).toBeInTheDocument();
      expect(headers).toHaveLength(2);
      expect(cells).toHaveLength(6); // 4 body cells + 2 footer cells
      
      // Check rows
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(4); // 1 header row + 2 body rows + 1 footer row
    });
  });
});