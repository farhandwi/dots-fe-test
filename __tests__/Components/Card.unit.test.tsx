import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';

describe('Card Components', () => {
  // Test Card component
  describe('Card', () => {
    test('renders with default classes', () => {
      render(<Card>Card Content</Card>);
      
      const cardElement = screen.getByText('Card Content');
      expect(cardElement).toBeInTheDocument();
      expect(cardElement).toHaveClass('rounded-xl');
      expect(cardElement).toHaveClass('border');
      expect(cardElement).toHaveClass('bg-card');
      expect(cardElement).toHaveClass('text-card-foreground');
      expect(cardElement).toHaveClass('shadow');
    });

    test('applies additional className', () => {
      render(<Card className="custom-card-class">Card Content</Card>);
      
      const cardElement = screen.getByText('Card Content');
      expect(cardElement).toHaveClass('custom-card-class');
    });

    test('forwards ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Card Content</Card>);
      
      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe('DIV');
    });
  });

  // Test CardHeader component
  describe('CardHeader', () => {
    test('renders with default classes', () => {
      render(<CardHeader>Header Content</CardHeader>);
      
      const headerElement = screen.getByText('Header Content');
      expect(headerElement).toBeInTheDocument();
      expect(headerElement).toHaveClass('flex');
      expect(headerElement).toHaveClass('flex-col');
      expect(headerElement).toHaveClass('space-y-1.5');
      expect(headerElement).toHaveClass('p-6');
    });

    test('applies additional className', () => {
      render(<CardHeader className="custom-header-class">Header Content</CardHeader>);
      
      const headerElement = screen.getByText('Header Content');
      expect(headerElement).toHaveClass('custom-header-class');
    });
  });

  // Test CardTitle component
  describe('CardTitle', () => {
    test('renders with default classes', () => {
      render(<CardTitle>Title Content</CardTitle>);
      
      const titleElement = screen.getByText('Title Content');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveClass('font-semibold');
      expect(titleElement).toHaveClass('leading-none');
      expect(titleElement).toHaveClass('tracking-tight');
    });

    test('applies additional className', () => {
      render(<CardTitle className="custom-title-class">Title Content</CardTitle>);
      
      const titleElement = screen.getByText('Title Content');
      expect(titleElement).toHaveClass('custom-title-class');
    });
  });

  // Test CardDescription component
  describe('CardDescription', () => {
    test('renders with default classes', () => {
      render(<CardDescription>Description Content</CardDescription>);
      
      const descElement = screen.getByText('Description Content');
      expect(descElement).toBeInTheDocument();
      expect(descElement).toHaveClass('text-sm');
      expect(descElement).toHaveClass('text-muted-foreground');
    });

    test('applies additional className', () => {
      render(<CardDescription className="custom-desc-class">Description Content</CardDescription>);
      
      const descElement = screen.getByText('Description Content');
      expect(descElement).toHaveClass('custom-desc-class');
    });
  });

  // Test CardContent component
  describe('CardContent', () => {
    test('renders with default classes', () => {
      render(<CardContent>Content Details</CardContent>);
      
      const contentElement = screen.getByText('Content Details');
      expect(contentElement).toBeInTheDocument();
      expect(contentElement).toHaveClass('p-6');
      expect(contentElement).toHaveClass('pt-0');
    });

    test('applies additional className', () => {
      render(<CardContent className="custom-content-class">Content Details</CardContent>);
      
      const contentElement = screen.getByText('Content Details');
      expect(contentElement).toHaveClass('custom-content-class');
    });
  });

  // Test CardFooter component
  describe('CardFooter', () => {
    test('renders with default classes', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      
      const footerElement = screen.getByText('Footer Content');
      expect(footerElement).toBeInTheDocument();
      expect(footerElement).toHaveClass('flex');
      expect(footerElement).toHaveClass('items-center');
      expect(footerElement).toHaveClass('p-6');
      expect(footerElement).toHaveClass('pt-0');
    });

    test('applies additional className', () => {
      render(<CardFooter className="custom-footer-class">Footer Content</CardFooter>);
      
      const footerElement = screen.getByText('Footer Content');
      expect(footerElement).toHaveClass('custom-footer-class');
    });
  });

  // Test Card composition
  test('renders Card with all components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });
});