import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Radix UI DropdownMenu
jest.mock('@radix-ui/react-dropdown-menu', () => {
  // Create mock components with data-testid attributes
  const MockRoot = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-root">{children}</div>
  );

  const MockTrigger = React.forwardRef<HTMLButtonElement, any>(({ className, children, ...props }, ref) => (
    <button ref={ref} data-testid="dropdown-trigger" className={className} {...props}>
      {children}
    </button>
  ));
  MockTrigger.displayName = 'Trigger';

  const MockPortal = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-portal">{children}</div>
  );

  const MockContent = React.forwardRef<HTMLDivElement, any>(({ className, sideOffset, children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-content" className={className} data-side-offset={sideOffset} {...props}>
      {children}
    </div>
  ));
  MockContent.displayName = 'Content';

  const MockItem = React.forwardRef<HTMLDivElement, any>(({ className, children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-item" className={className} {...props}>
      {children}
    </div>
  ));
  MockItem.displayName = 'Item';

  const MockCheckboxItem = React.forwardRef<HTMLDivElement, any>(({ className, children, checked, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-checkbox-item" className={className} data-state={checked ? 'checked' : 'unchecked'} {...props}>
      {children}
    </div>
  ));
  MockCheckboxItem.displayName = 'CheckboxItem';

  const MockRadioItem = React.forwardRef<HTMLDivElement, any>(({ className, children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-radio-item" className={className} {...props}>
      {children}
    </div>
  ));
  MockRadioItem.displayName = 'RadioItem';

  const MockLabel = React.forwardRef<HTMLDivElement, any>(({ className, children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-label" className={className} {...props}>
      {children}
    </div>
  ));
  MockLabel.displayName = 'Label';

  const MockSeparator = React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-separator" className={className} {...props} />
  ));
  MockSeparator.displayName = 'Separator';

  const MockGroup = React.forwardRef<HTMLDivElement, any>(({ className, children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-group" className={className} {...props}>
      {children}
    </div>
  ));
  MockGroup.displayName = 'Group';

  const MockSub = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-sub" {...props}>
      {children}
    </div>
  ));
  MockSub.displayName = 'Sub';

  const MockSubTrigger = React.forwardRef<HTMLDivElement, any>(({ className, children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-sub-trigger" className={className} {...props}>
      {children}
    </div>
  ));
  MockSubTrigger.displayName = 'SubTrigger';

  const MockSubContent = React.forwardRef<HTMLDivElement, any>(({ className, children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-sub-content" className={className} {...props}>
      {children}
    </div>
  ));
  MockSubContent.displayName = 'SubContent';

  const MockRadioGroup = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-radio-group" {...props}>
      {children}
    </div>
  ));
  MockRadioGroup.displayName = 'RadioGroup';

  const MockItemIndicator = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="dropdown-item-indicator" {...props}>
      {children}
    </div>
  ));
  MockItemIndicator.displayName = 'ItemIndicator';

  return {
    Root: MockRoot,
    Trigger: MockTrigger,
    Portal: MockPortal,
    Content: MockContent,
    Item: MockItem,
    CheckboxItem: MockCheckboxItem,
    RadioItem: MockRadioItem,
    Label: MockLabel,
    Separator: MockSeparator,
    Group: MockGroup,
    Sub: MockSub,
    SubTrigger: MockSubTrigger,
    SubContent: MockSubContent,
    RadioGroup: MockRadioGroup,
    ItemIndicator: MockItemIndicator,
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: () => <div data-testid="check-icon">CheckIcon</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">ChevronRightIcon</div>,
  Circle: () => <div data-testid="circle-icon">CircleIcon</div>,
}));

// Mock utility function
jest.mock('../../src/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Import components after mocks
import {
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
} from '@/components/ui/dropdown-menu';

describe('DropdownMenu Components', () => {
  // Test DropdownMenu basic structure
  describe('DropdownMenu Structure', () => {
    test('renders basic dropdown menu structure', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-trigger')).toHaveTextContent('Open Menu');
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-item')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-item')).toHaveTextContent('Item 1');
    });
  });
  
  // Test DropdownMenuTrigger
  describe('DropdownMenuTrigger', () => {
    test('renders with correct attributes', () => {
      render(<DropdownMenuTrigger className="custom-trigger">Click Me</DropdownMenuTrigger>);
      
      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Click Me');
      expect(trigger.className).toContain('custom-trigger');
    });
  });
  
  // Test DropdownMenuContent
  describe('DropdownMenuContent', () => {
    test('renders with default classes and sideOffset', () => {
      render(<DropdownMenuContent>Content</DropdownMenuContent>);
      
      const content = screen.getByTestId('dropdown-content');
      expect(content).toBeInTheDocument();
      expect(content.className).toContain('z-50');
      expect(content.className).toContain('min-w-[8rem]');
      expect(content.className).toContain('rounded-md');
      expect(content).toHaveAttribute('data-side-offset', '4');
    });
    
    test('accepts custom sideOffset', () => {
      render(<DropdownMenuContent sideOffset={8}>Content</DropdownMenuContent>);
      
      const content = screen.getByTestId('dropdown-content');
      expect(content).toHaveAttribute('data-side-offset', '8');
    });
    
    test('applies additional className', () => {
      render(<DropdownMenuContent className="custom-content">Content</DropdownMenuContent>);
      
      const content = screen.getByTestId('dropdown-content');
      expect(content.className).toContain('custom-content');
    });
  });
  
  // Test DropdownMenuItem
  describe('DropdownMenuItem', () => {
    test('renders with default classes', () => {
      render(<DropdownMenuItem>Menu Item</DropdownMenuItem>);
      
      const item = screen.getByTestId('dropdown-item');
      expect(item).toBeInTheDocument();
      expect(item.className).toContain('relative');
      expect(item.className).toContain('flex');
      expect(item.className).toContain('cursor-default');
      expect(item.className).toContain('select-none');
    });
    
    test('applies inset property', () => {
      render(<DropdownMenuItem inset>Inset Item</DropdownMenuItem>);
      
      const item = screen.getByTestId('dropdown-item');
      expect(item.className).toContain('pl-8');
    });
    
    test('applies additional className', () => {
      render(<DropdownMenuItem className="custom-item">Item</DropdownMenuItem>);
      
      const item = screen.getByTestId('dropdown-item');
      expect(item.className).toContain('custom-item');
    });
  });
  
  // Test DropdownMenuCheckboxItem
  describe('DropdownMenuCheckboxItem', () => {
    test('renders unchecked state correctly', () => {
      render(<DropdownMenuCheckboxItem checked={false}>Checkbox Item</DropdownMenuCheckboxItem>);
      
      const checkboxItem = screen.getByTestId('dropdown-checkbox-item');
      expect(checkboxItem).toBeInTheDocument();
      expect(checkboxItem).toHaveTextContent('Checkbox Item');
      expect(checkboxItem).toHaveAttribute('data-state', 'unchecked');
    });
    
    test('renders checked state correctly', () => {
      render(<DropdownMenuCheckboxItem checked={true}>Checkbox Item</DropdownMenuCheckboxItem>);
      
      const checkboxItem = screen.getByTestId('dropdown-checkbox-item');
      expect(checkboxItem).toHaveAttribute('data-state', 'checked');
    });
    
    test('renders indicator when checked', () => {
      render(<DropdownMenuCheckboxItem checked={true}>Checkbox Item</DropdownMenuCheckboxItem>);
      
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
  });
  
  // Test DropdownMenuRadioItem
  describe('DropdownMenuRadioItem', () => {
    test('renders with correct structure', () => {
      render(<DropdownMenuRadioItem value="option1">Radio Item</DropdownMenuRadioItem>);
      
      const radioItem = screen.getByTestId('dropdown-radio-item');
      expect(radioItem).toBeInTheDocument();
      expect(radioItem).toHaveTextContent('Radio Item');
      expect(radioItem.className).toContain('relative');
      expect(radioItem.className).toContain('flex');
      expect(radioItem.className).toContain('pl-8');
    });
  });
  
  // Test DropdownMenuLabel
  describe('DropdownMenuLabel', () => {
    test('renders with default classes', () => {
      render(<DropdownMenuLabel>Label Text</DropdownMenuLabel>);
      
      const label = screen.getByTestId('dropdown-label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('Label Text');
      expect(label.className).toContain('px-2');
      expect(label.className).toContain('py-1.5');
      expect(label.className).toContain('font-semibold');
    });
    
    test('applies inset property', () => {
      render(<DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>);
      
      const label = screen.getByTestId('dropdown-label');
      expect(label.className).toContain('pl-8');
    });
  });
  
  // Test DropdownMenuSeparator
  describe('DropdownMenuSeparator', () => {
    test('renders with default classes', () => {
      render(<DropdownMenuSeparator />);
      
      const separator = screen.getByTestId('dropdown-separator');
      expect(separator).toBeInTheDocument();
      expect(separator.className).toContain('-mx-1');
      expect(separator.className).toContain('my-1');
      expect(separator.className).toContain('h-px');
      expect(separator.className).toContain('bg-muted');
    });
  });
  
  // Test DropdownMenuShortcut
  describe('DropdownMenuShortcut', () => {
    test('renders with default classes', () => {
      render(<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>);
      
      const shortcut = screen.getByText('⌘K');
      expect(shortcut).toBeInTheDocument();
      expect(shortcut.tagName).toBe('SPAN');
      expect(shortcut.className).toContain('ml-auto');
      expect(shortcut.className).toContain('text-xs');
      expect(shortcut.className).toContain('tracking-widest');
      expect(shortcut.className).toContain('opacity-60');
    });
    
    test('applies additional className', () => {
      render(<DropdownMenuShortcut className="custom-shortcut">⌘K</DropdownMenuShortcut>);
      
      const shortcut = screen.getByText('⌘K');
      expect(shortcut.className).toContain('custom-shortcut');
    });
  });
  
  // Test DropdownMenuSubTrigger
  describe('DropdownMenuSubTrigger', () => {
    test('renders with default classes and ChevronRight icon', () => {
      render(<DropdownMenuSubTrigger>Sub Menu</DropdownMenuSubTrigger>);
      
      const subTrigger = screen.getByTestId('dropdown-sub-trigger');
      expect(subTrigger).toBeInTheDocument();
      expect(subTrigger).toHaveTextContent('Sub Menu');
      expect(subTrigger.className).toContain('flex');
      expect(subTrigger.className).toContain('cursor-default');
      
      // Check for ChevronRight icon
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    });
    
    test('applies inset property', () => {
      render(<DropdownMenuSubTrigger inset>Inset Sub Menu</DropdownMenuSubTrigger>);
      
      const subTrigger = screen.getByTestId('dropdown-sub-trigger');
      expect(subTrigger.className).toContain('pl-8');
    });
  });
  
  // Test DropdownMenuSubContent
  describe('DropdownMenuSubContent', () => {
    test('renders with default classes', () => {
      render(<DropdownMenuSubContent>Sub Content</DropdownMenuSubContent>);
      
      const subContent = screen.getByTestId('dropdown-sub-content');
      expect(subContent).toBeInTheDocument();
      expect(subContent).toHaveTextContent('Sub Content');
      expect(subContent.className).toContain('z-50');
      expect(subContent.className).toContain('min-w-[8rem]');
      expect(subContent.className).toContain('rounded-md');
      expect(subContent.className).toContain('bg-popover');
    });
  });
  
  // Integration Test
  describe('DropdownMenu Integration', () => {
    test('renders complete dropdown menu structure', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={true}>
              Show Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup>
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Tools</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Tool 1</DropdownMenuItem>
                <DropdownMenuItem>Tool 2</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      // Verify structure
      expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-label').length).toBe(2); // There are two labels
      expect(screen.getAllByTestId('dropdown-separator').length).toBe(4);
      expect(screen.getByTestId('dropdown-group')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-item').length).toBe(4);
      expect(screen.getByTestId('dropdown-checkbox-item')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-radio-group')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-radio-item').length).toBe(3);
      expect(screen.getByTestId('dropdown-sub')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-sub-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-sub-content')).toBeInTheDocument();
      
      // Verify content
      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByText('My Account')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('⇧⌘P')).toBeInTheDocument();
      expect(screen.getByText('Show Status')).toBeInTheDocument();
      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('More Tools')).toBeInTheDocument();
      expect(screen.getByText('Tool 1')).toBeInTheDocument();
      expect(screen.getByText('Tool 2')).toBeInTheDocument();
    });
  });
});