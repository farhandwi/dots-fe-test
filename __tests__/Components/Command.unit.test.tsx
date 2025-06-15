import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock dependencies
jest.mock('cmdk', () => {
  // Create a mock Command component function
  const CommandMock = ({ children, className, ...props }: any) => (
    <div className={className} data-testid="cmdk-command" {...props}>
      {children}
    </div>
  );
  
  // Add subcomponents to the Command function
  CommandMock.displayName = 'Command';
  CommandMock.Input = ({ className, ...props }: any) => (
    <input data-testid="cmdk-input" className={className} {...props} />
  );
  CommandMock.List = ({ className, children, ...props }: any) => (
    <div data-testid="cmdk-list" className={className} {...props}>{children}</div>
  );
  CommandMock.Empty = ({ className, children, ...props }: any) => (
    <div data-testid="cmdk-empty" className={className} {...props}>{children}</div>
  );
  CommandMock.Group = ({ className, children, ...props }: any) => (
    <div data-testid="cmdk-group" className={className} {...props}>{children}</div>
  );
  CommandMock.Item = ({ className, children, ...props }: any) => (
    <div data-testid="cmdk-item" className={className} {...props}>{children}</div>
  );
  CommandMock.Separator = ({ className, ...props }: any) => (
    <hr data-testid="cmdk-separator" className={className} {...props} />
  );
  
  // Return the module mock
  return {
    Command: CommandMock
  };
});

// Mock the Dialog component
jest.mock('../../src/components/ui/dialog', () => {
  return {
    Dialog: ({ children, ...props }: { children: React.ReactNode }) => (
      <div data-testid="dialog" {...props}>{children}</div>
    ),
    DialogContent: ({ children, className }: { children: React.ReactNode, className?: string }) => (
      <div data-testid="dialog-content" className={className}>{children}</div>
    ),
  };
});

// Mock lucide-react
jest.mock('lucide-react', () => {
  return {
    Search: () => <div data-testid="search-icon">SearchIcon</div>,
  };
});

// Mock utility function
jest.mock('../../src/lib/utils', () => {
  return {
    cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
  };
});

// Import components after mocks
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command';

describe('Command Components', () => {
  // Test Command Component
  describe('Command', () => {
    test('renders with default classes', () => {
      render(<Command>Command Content</Command>);
      
      const commandElement = screen.getByTestId('cmdk-command');
      expect(commandElement).toBeInTheDocument();
      expect(commandElement.className).toContain('flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground');
    });

    test('applies additional className', () => {
      render(<Command className="additional-class">Command Content</Command>);
      
      const commandElement = screen.getByTestId('cmdk-command');
      expect(commandElement.className).toContain('additional-class');
    });
  });

  // Test CommandDialog Component
  describe('CommandDialog', () => {
    test('renders dialog with correct structure', () => {
      render(
        <CommandDialog>
          <div>Dialog Content</div>
        </CommandDialog>
      );
      
      const dialogElement = screen.getByTestId('dialog');
      const dialogContentElement = screen.getByTestId('dialog-content');
      
      expect(dialogElement).toBeInTheDocument();
      expect(dialogContentElement).toBeInTheDocument();
      expect(dialogContentElement.className).toContain('overflow-hidden p-0');
    });
  });

  // Test CommandInput Component
  describe('CommandInput', () => {
    test('renders with search icon and input', () => {
      render(<CommandInput placeholder="Search..." />);
      
      const searchIcon = screen.getByTestId('search-icon');
      const inputElement = screen.getByTestId('cmdk-input');
      const wrapperElement = screen.getByText("SearchIcon").closest('div[cmdk-input-wrapper]');
      
      expect(searchIcon).toBeInTheDocument();
      expect(inputElement).toBeInTheDocument();
      expect(wrapperElement).toHaveClass('flex items-center border-b px-3');
      expect(inputElement.className).toContain('flex h-10 w-full rounded-md bg-transparent');
    });

    test('applies additional className', () => {
      render(<CommandInput className="custom-input-class" placeholder="Search..." />);
      
      const inputElement = screen.getByTestId('cmdk-input');
      expect(inputElement.className).toContain('custom-input-class');
    });
  });

  // Test CommandList Component
  describe('CommandList', () => {
    test('renders with default classes', () => {
      render(
        <CommandList>
          <div>List Content</div>
        </CommandList>
      );
      
      const listElement = screen.getByTestId('cmdk-list');
      expect(listElement.className).toContain('max-h-[300px] overflow-y-auto overflow-x-hidden');
    });
  });

  // Test CommandEmpty Component
  describe('CommandEmpty', () => {
    test('renders with default classes', () => {
      render(<CommandEmpty>No results</CommandEmpty>);
      
      const emptyElement = screen.getByTestId('cmdk-empty');
      expect(emptyElement.className).toContain('py-6 text-center text-sm');
      expect(emptyElement).toHaveTextContent('No results');
    });
  });

  // Test CommandGroup Component
  describe('CommandGroup', () => {
    test('renders with default classes', () => {
      render(
        <CommandGroup>
          <div>Group Content</div>
        </CommandGroup>
      );
      
      const groupElement = screen.getByTestId('cmdk-group');
      expect(groupElement.className).toContain('overflow-hidden p-1 text-foreground');
    });
  });

  // Test CommandSeparator Component
  describe('CommandSeparator', () => {
    test('renders with default classes', () => {
      render(<CommandSeparator />);
      
      const separatorElement = screen.getByTestId('cmdk-separator');
      expect(separatorElement.className).toContain('-mx-1 h-px bg-border');
    });
  });

  // Test CommandItem Component
  describe('CommandItem', () => {
    test('renders with default classes', () => {
      render(<CommandItem>Item Content</CommandItem>);
      
      const itemElement = screen.getByTestId('cmdk-item');
      expect(itemElement.className).toContain('relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5');
      expect(itemElement).toHaveTextContent('Item Content');
    });

    test('applies selected and disabled states', () => {
      const { rerender } = render(<CommandItem>Selectable Item</CommandItem>);
      
      let itemElement = screen.getByTestId('cmdk-item');
      
      // Test selected state
      rerender(<CommandItem data-selected={true}>Selectable Item</CommandItem>);
      itemElement = screen.getByTestId('cmdk-item');
      expect(itemElement.className).toContain('data-[selected=true]:bg-accent');
      expect(itemElement.className).toContain('data-[selected=true]:text-accent-foreground');
      
      // Test disabled state
      rerender(<CommandItem disabled>Disabled Item</CommandItem>);
      itemElement = screen.getByTestId('cmdk-item');
      expect(itemElement.className).toContain('data-[disabled=true]:pointer-events-none');
      expect(itemElement.className).toContain('data-[disabled=true]:opacity-50');
    });
  });

  // Test CommandShortcut Component
  describe('CommandShortcut', () => {
    test('renders with default classes', () => {
      render(<CommandShortcut>⌘K</CommandShortcut>);
      
      const shortcutElement = screen.getByText('⌘K');
      expect(shortcutElement.tagName).toBe('SPAN');
      expect(shortcutElement.className).toContain('ml-auto text-xs tracking-widest text-muted-foreground');
    });
  });

  // Integration Test
  test('renders full command palette composition', () => {
    render(
      <Command>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              Item 1
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem>
              Item 2
              <CommandShortcut>⌘O</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </Command>
    );

    // Verify structure
    expect(screen.getByTestId('cmdk-command')).toBeInTheDocument();
    expect(screen.getByTestId('cmdk-input')).toBeInTheDocument();
    expect(screen.getByTestId('cmdk-list')).toBeInTheDocument();
    expect(screen.getByTestId('cmdk-empty')).toBeInTheDocument();
    expect(screen.getByTestId('cmdk-group')).toBeInTheDocument();
    expect(screen.getAllByTestId('cmdk-item').length).toBe(2);
    expect(screen.getByTestId('cmdk-separator')).toBeInTheDocument();
    
    // Verify content
    expect(screen.getByTestId('cmdk-input')).toHaveAttribute('placeholder', 'Type a command or search...');
    expect(screen.getByText('No results found.')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('⌘P')).toBeInTheDocument();
    expect(screen.getByText('⌘O')).toBeInTheDocument();
  });
});