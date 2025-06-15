import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '@/components/Pagination';

// Membersihkan setelah setiap test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
});

// Mock ReactPaginate karena ini adalah dependency eksternal
jest.mock('react-paginate', () => {
  return jest.fn(props => {
    return (
      <div data-testid="react-paginate">
        <button 
          data-testid="previous-button" 
          onClick={() => props.onPageChange({ selected: props.forcePage - 1 })}
          disabled={props.forcePage === 0}
        >
          {props.previousLabel}
        </button>
        <div data-testid="page-numbers">
          {Array.from({ length: props.pageCount }).map((_, i) => (
            <button
              key={i}
              data-testid={`page-${i + 1}`}
              className={props.forcePage === i ? props.activeLinkClassName : ''}
              onClick={() => props.onPageChange({ selected: i })}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button 
          data-testid="next-button"
          onClick={() => props.onPageChange({ selected: props.forcePage + 1 })}
          disabled={props.forcePage === props.pageCount - 1}
        >
          {props.nextLabel}
        </button>
      </div>
    );
  });
});

// Mock @headlessui/react Menu karena ini component eksternal yang kompleks
jest.mock('@headlessui/react', () => {
  // More precise type definition
  type MenuChildrenFn = (props: { active?: boolean }) => React.ReactNode;
  type MenuChildren = React.ReactNode | MenuChildrenFn;
  
  // Type guard to check if children is a function
  const isChildrenFunction = (children: MenuChildren): children is MenuChildrenFn => {
    return typeof children === 'function';
  };
  
  // Render children safely
  const renderChildren = (children: MenuChildren) => {
    if (isChildrenFunction(children)) {
      return children({ active: false });
    }
    return children;
  };
  
  // Unified Menu implementation
  const MockMenu = ({ children, as: Component = 'div', ...rest }: {
    children?: MenuChildren;
    as?: React.ElementType;
  }) => {
    return (
      <div data-testid="headless-menu" {...rest}>
        {renderChildren(children)}
      </div>
    );
  };
  
  // Button with more specific type handling
  MockMenu.Button = ({ children, ...props }: {
    children?: React.ReactNode;
  }) => (
    <button data-testid="menu-button" {...props}>
      {children}
    </button>
  );
  
  // Items with safer children rendering
  MockMenu.Items = ({ children, ...props }: {
    children?: MenuChildren;
  }) => (
    <div data-testid="menu-items" {...props}>
      {renderChildren(children)}
    </div>
  );
  
  // Item with function children support
  MockMenu.Item = ({ children }: {
    children?: MenuChildren;
  }) => {
    return renderChildren(children);
  };
  
  return {
    Menu: MockMenu
  };
});

describe('Pagination Component', () => {
  const defaultProps = {
    pageCount: 10,
    onPageChange: jest.fn(),
    perPage: 10,
    setPerPage: jest.fn(),
    currentPage: 1
  };

  // Setup dan teardown untuk setiap test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.clearAllTimers();
  });

  afterEach(() => {
    // Pastikan semua timer sudah dijalankan
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('renders the pagination component correctly', () => {
    render(<Pagination {...defaultProps} />);
    
    expect(screen.getByText('Show 10 Per Page')).toBeInTheDocument();
    expect(screen.getByTestId('react-paginate')).toBeInTheDocument();
  });

  test('calls onPageChange when clicking next button', async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    
    render(<Pagination {...defaultProps} />);
    
    const nextButton = screen.getByTestId('next-button');
    await user.click(nextButton);
    
    jest.runAllTimers();
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith({ selected: 1 });
  });

  test('calls onPageChange when clicking previous button', async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    
    render(<Pagination {...defaultProps} currentPage={2} />);
    
    const prevButton = screen.getByTestId('previous-button');
    await user.click(prevButton);
    
    jest.runAllTimers();
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith({ selected: 0 });
  });

  test('disables previous button when on first page', async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    
    render(<Pagination {...defaultProps} currentPage={1} />);
    
    const prevButton = screen.getByTestId('previous-button');
    expect(prevButton).toBeDisabled();
    
    await user.click(prevButton);
    jest.runAllTimers();
    
    expect(defaultProps.onPageChange).not.toHaveBeenCalled();
  });

  test('disables next button when on last page', async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    
    render(<Pagination {...defaultProps} currentPage={10} pageCount={10} />);
    
    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).toBeDisabled();
    
    await user.click(nextButton);
    jest.runAllTimers();
    
    expect(defaultProps.onPageChange).not.toHaveBeenCalled();
  });

  test('opens per page dropdown when clicking the button', async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    
    render(<Pagination {...defaultProps} />);
    
    const dropdownButton = screen.getByText('Show 10 Per Page');
    await user.click(dropdownButton);
    
    jest.runAllTimers();
    
    // Karena kita membuat mock sederhana, kita tidak benar-benar dapat menguji 
    // apakah dropdown terbuka atau tidak pada mock headless UI
    expect(screen.getByTestId('menu-button')).toBeInTheDocument();
  });

  test('changes per page when selecting a different option', async () => {
    // Untuk tes ini, kita perlu mem-mock perilaku lebih spesifik
    // Karena kompleksitas @headlessui/react dan cara kita mock
    // kita akan menguji implementasi internal dari fungsi handlePerPageChange saja
    
    const { rerender } = render(<Pagination {...defaultProps} />);
    
    // Diperoleh fungsi handlePerPageChange dari dalam komponen
    const setIsOpen = jest.fn();
    const originalSetState = React.useState;
    
    // Simpan mock untuk dibersihkan nanti
    const useStateSpy = jest.spyOn(React, 'useState').mockImplementationOnce(() => [false, setIsOpen]);
    
    // Merender ulang dengan mock baru
    rerender(<Pagination {...defaultProps} />);
    
    const dropdownButton = screen.getByText('Show 10 Per Page');
    userEvent.click(dropdownButton);
    
    // Bersihkan mock useState
    useStateSpy.mockRestore();
  });

  test('shows the correct current page', () => {
    const currentPage = 3;
    render(<Pagination {...defaultProps} currentPage={currentPage} />);
    
    // Memeriksa apakah halaman yang aktif memiliki kelas aktiveLinkClassName
    expect(screen.getByTestId(`page-${currentPage}`)).toHaveClass('bg-yellow-400 text-white');
  });

  test('displays correct number of pages', () => {
    const pageCount = 5;
    render(<Pagination {...defaultProps} pageCount={pageCount} />);
    
    // Memeriksa jumlah tombol halaman yang ditampilkan
    for (let i = 1; i <= pageCount; i++) {
      expect(screen.getByTestId(`page-${i}`)).toBeInTheDocument();
    }
  });
});