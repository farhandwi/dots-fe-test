import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar, { User } from '@/components/Sidebar';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // Destructure dan filter props yang valid
    const { priority, unoptimized, ...rest } = props;
    
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));

beforeAll(() => {
  process.env.NEXT_PUBLIC_SSO_END_POINT = 'http://localhost:3000';
  process.env.NEXT_PUBLIC_DOTS_FE_END_POINT = 'http://localhost:4000/dots';
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:4000/dots';
});

describe('Sidebar Component', () => {
  // Setup untuk mocking window.location.href
  const mockLocationHref = jest.fn();
  let originalHref: PropertyDescriptor | undefined;

  // Move the location mocking logic inside the describe block
  beforeAll(() => {
    // Save original implementation
    originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');
    
    // Replace window.location dengan mock object
    Object.defineProperty(global, 'location', {
      configurable: true,
      value: {
        ...window.location,
        // Hanya definisikan getter dan setter untuk href
        get href() {
          return '';
        },
        set href(url: string) {
          mockLocationHref(url);
        }
      }
    });
  });

  // Move afterAll inside the describe block
  afterAll(() => {
    if (originalHref) {
      // Coba restore original location
      try {
        Object.defineProperty(global, 'location', {
          configurable: true,
          value: window.location
        });
      } catch (e) {
        console.warn('Failed to restore window.location after tests', e);
      }
    }
  });

  const mockUser: User = {
    partner: 'TestPartner',
    profile_image: 'base64Image',
    name: 'Test User',
    email: 'test@example.com',
    application: [
      {
        app_name: 'TestApp',
        role: [
          {
            user_type: 'admin',
            cost_center: '123',
          },
        ],
      },
    ],
  };

  // Reset pathname mock before each test
  const usePathnameMock = jest.fn();
  const useRouterMock = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (require('next/navigation').usePathname as jest.Mock).mockImplementation(usePathnameMock);
    (require('next/navigation').useRouter as jest.Mock).mockImplementation(() => useRouterMock);
  });

  it('renders the sidebar with user information', () => {
    usePathnameMock.mockReturnValue('/admin/dashboard');
    
    render(
      <Sidebar user={mockUser}>
        <div>Test Content</div>
      </Sidebar>
    );

    // Check for user information
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();

    // Check for menu items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage Material')).toBeInTheDocument();
    expect(screen.getByText('Manage Gl')).toBeInTheDocument();
    expect(screen.getByText('Manage Role By Cost Center')).toBeInTheDocument();
    expect(screen.getByText('Manage Role By Bp')).toBeInTheDocument();

    // Check for back buttons
    expect(screen.getByText('Back to Dots')).toBeInTheDocument();
    expect(screen.getByText('Back to Main')).toBeInTheDocument();

    // Check for children content
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies active class to current route', () => {
    usePathnameMock.mockReturnValue('/admin/dashboard');
    
    render(
      <Sidebar user={mockUser}>
        <div>Test Content</div>
      </Sidebar>
    );

    // Get all menu links
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const manageMaterialLink = screen.getByText('Manage Material').closest('a');

    // Check active class is applied to current route
    expect(dashboardLink).toHaveClass('bg-[#4858a1]');
    expect(manageMaterialLink).not.toHaveClass('bg-[#4858a1]');
  });

  it('navigates to Dots page when clicking Back to Dots', () => {
    usePathnameMock.mockReturnValue('/admin/dashboard');
    
    render(
      <Sidebar user={mockUser}>
        <div>Test Content</div>
      </Sidebar>
    );

    // Click back to dots button
    fireEvent.click(screen.getByText('Back to Dots'));
    
    // Check if router push was called
    expect(useRouterMock.push).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to SSO endpoint when clicking Back to Main', () => {
    usePathnameMock.mockReturnValue('/admin/dashboard');
    
    // Reset mock function
    mockLocationHref.mockReset();
    
    render(
      <Sidebar user={mockUser}>
        <div>Test Content</div>
      </Sidebar>
    );

    // Click back to main button
    fireEvent.click(screen.getByText('Back to Main'));
    
    // Check if location.href was set to correct URL
    expect(mockLocationHref).toHaveBeenCalledWith('http://localhost:3000/dashboard');
  });

  it('renders user profile image when available', () => {
    usePathnameMock.mockReturnValue('/admin/dashboard');
    
    render(
      <Sidebar user={mockUser}>
        <div>Test Content</div>
      </Sidebar>
    );

    // Find the user avatar
    const avatar = screen.getByAltText('User Avatar');
    expect(avatar).toHaveAttribute('src', 'data:image/png;base64,base64Image');
  });

  it('renders fallback image when profile image is not available', () => {
    usePathnameMock.mockReturnValue('/admin/dashboard');
    
    // Create user without profile image
    const userWithoutImage = {
      ...mockUser,
      profile_image: '',
    };
    
    render(
      <Sidebar user={userWithoutImage}>
        <div>Test Content</div>
      </Sidebar>
    );

    // Find the user avatar
    const avatar = screen.getByAltText('User Avatar');
    expect(avatar).toHaveAttribute('src', 'images/user-circle.png');
  });
});