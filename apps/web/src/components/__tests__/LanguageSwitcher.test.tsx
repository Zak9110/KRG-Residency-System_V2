import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import LanguageSwitcher from '../LanguageSwitcher';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('LanguageSwitcher Component', () => {
  const mockPush = jest.fn();
  const mockUseRouter = useRouter as jest.Mock;
  const mockUsePathname = usePathname as jest.Mock;

  beforeEach(() => {
    mockUseRouter.mockReturnValue({ push: mockPush });
    mockPush.mockClear();
  });

  it('should render language buttons', () => {
    mockUsePathname.mockReturnValue('/en/dashboard');
    
    render(<LanguageSwitcher />);
    
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('AR')).toBeInTheDocument();
  });

  it('should highlight English button when on English page', () => {
    mockUsePathname.mockReturnValue('/en/dashboard');
    
    render(<LanguageSwitcher />);
    
    const enButton = screen.getByText('EN').closest('button');
    const arButton = screen.getByText('AR').closest('button');
    
    expect(enButton).toHaveClass('bg-blue-600');
    expect(arButton).not.toHaveClass('bg-blue-600');
  });

  it('should highlight Arabic button when on Arabic page', () => {
    mockUsePathname.mockReturnValue('/ar/dashboard');
    
    render(<LanguageSwitcher />);
    
    const enButton = screen.getByText('EN').closest('button');
    const arButton = screen.getByText('AR').closest('button');
    
    expect(arButton).toHaveClass('bg-blue-600');
    expect(enButton).not.toHaveClass('bg-blue-600');
  });

  it('should switch to Arabic when AR button is clicked', () => {
    mockUsePathname.mockReturnValue('/en/dashboard');
    
    render(<LanguageSwitcher />);
    
    const arButton = screen.getByText('AR').closest('button');
    if (arButton) {
      fireEvent.click(arButton);
      expect(mockPush).toHaveBeenCalledWith('/ar/dashboard');
    }
  });

  it('should switch to English when EN button is clicked', () => {
    mockUsePathname.mockReturnValue('/ar/login');
    
    render(<LanguageSwitcher />);
    
    const enButton = screen.getByText('EN').closest('button');
    if (enButton) {
      fireEvent.click(enButton);
      expect(mockPush).toHaveBeenCalledWith('/en/login');
    }
  });

  it('should preserve pathname when switching languages', () => {
    mockUsePathname.mockReturnValue('/en/dashboard/director');
    
    render(<LanguageSwitcher />);
    
    const arButton = screen.getByText('AR').closest('button');
    if (arButton) {
      fireEvent.click(arButton);
      expect(mockPush).toHaveBeenCalledWith('/ar/dashboard/director');
    }
  });

  it('should handle root path correctly', () => {
    mockUsePathname.mockReturnValue('/en');
    
    render(<LanguageSwitcher />);
    
    const arButton = screen.getByText('AR').closest('button');
    if (arButton) {
      fireEvent.click(arButton);
      expect(mockPush).toHaveBeenCalledWith('/ar');
    }
  });

  it('should not navigate when clicking current language button', () => {
    mockUsePathname.mockReturnValue('/en/dashboard');
    
    render(<LanguageSwitcher />);
    
    const enButton = screen.getByText('EN').closest('button');
    if (enButton) {
      fireEvent.click(enButton);
      // Should not push same route
      expect(mockPush).not.toHaveBeenCalled();
    }
  });

  it('should have correct accessibility attributes', () => {
    mockUsePathname.mockReturnValue('/en/dashboard');
    
    render(<LanguageSwitcher />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    
    buttons.forEach(button => {
      expect(button).toBeEnabled();
    });
  });

  it('should show English and Arabic labels', () => {
    mockUsePathname.mockReturnValue('/en/dashboard');
    
    render(<LanguageSwitcher />);
    
    expect(screen.getByText('EN')).toBeVisible();
    expect(screen.getByText('AR')).toBeVisible();
  });
});
