import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CSVUploader } from './CSVUploader'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.csv' }, error: null }),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'job-123', status: 'pending' },
            error: null,
          }),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  },
}))

describe('CSVUploader', () => {
  const mockOnUploadComplete = vi.fn()

  beforeEach(() => {
    mockOnUploadComplete.mockClear()
  })

  it('should render drop zone', () => {
    render(<CSVUploader onUploadComplete={mockOnUploadComplete} />)

    expect(screen.getByText(/Glissez-déposez vos fichiers CSV ici/i)).toBeInTheDocument()
  })

  it('should show instructions when no files', () => {
    render(<CSVUploader onUploadComplete={mockOnUploadComplete} />)

    expect(screen.getByText(/Format CSV attendu/i)).toBeInTheDocument()
  })

  it('should handle file input change', async () => {
    render(<CSVUploader onUploadComplete={mockOnUploadComplete} />)

    const fileContent = 'EAN,Nom,Prix\n5901234123457,Test Product,99.99'
    const file = new File([fileContent], 'test.csv', { type: 'text/csv' })

    const input = screen.getByRole('input', { hidden: true }) as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument()
    })
  })

  it('should parse CSV and show preview', async () => {
    render(<CSVUploader onUploadComplete={mockOnUploadComplete} />)

    const fileContent = 'EAN,Nom,Prix\n5901234123457,Test Product,99.99\n5901234123458,Another Product,149.99'
    const file = new File([fileContent], 'products.csv', { type: 'text/csv' })

    const input = screen.getByRole('input', { hidden: true }) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('EAN')).toBeInTheDocument()
      expect(screen.getByText('Nom')).toBeInTheDocument()
      expect(screen.getByText('Prix')).toBeInTheDocument()
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
  })

  it('should handle file upload', async () => {
    const { container } = render(
      <CSVUploader supplierId="supplier-123" onUploadComplete={mockOnUploadComplete} />
    )

    const fileContent = 'EAN,Nom,Prix\n5901234123457,Test Product,99.99'
    const file = new File([fileContent], 'test.csv', { type: 'text/csv' })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(input, 'files', {
      value: [file],
    })
    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument()
    })

    const importButton = screen.getByText('Importer')
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith('job-123')
    })
  })

  it('should reject non-CSV files', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<CSVUploader onUploadComplete={mockOnUploadComplete} />)

    const file = new File(['content'], 'test.txt', { type: 'text/plain' })

    const input = screen.getByRole('input', { hidden: true }) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Veuillez sélectionner uniquement des fichiers CSV')
    })

    alertSpy.mockRestore()
  })

  it('should allow removing files', async () => {
    render(<CSVUploader onUploadComplete={mockOnUploadComplete} />)

    const fileContent = 'EAN,Nom,Prix\n5901234123457,Test Product,99.99'
    const file = new File([fileContent], 'test.csv', { type: 'text/csv' })

    const input = screen.getByRole('input', { hidden: true }) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument()
    })

    const removeButtons = screen.getAllByRole('button')
    const removeButton = removeButtons.find((btn) => btn.querySelector('svg'))

    if (removeButton) {
      fireEvent.click(removeButton)
    }

    await waitFor(() => {
      expect(screen.queryByText('test.csv')).not.toBeInTheDocument()
    })
  })

  it('should handle empty CSV', async () => {
    render(<CSVUploader onUploadComplete={mockOnUploadComplete} />)

    const file = new File([''], 'empty.csv', { type: 'text/csv' })

    const input = screen.getByRole('input', { hidden: true }) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/Erreur de lecture/i)).toBeInTheDocument()
    })
  })

  it('should show file size', async () => {
    render(<CSVUploader onUploadComplete={mockOnUploadComplete} />)

    const fileContent = 'A'.repeat(2048) // 2 KB
    const file = new File([fileContent], 'large.csv', { type: 'text/csv' })

    const input = screen.getByRole('input', { hidden: true }) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/2\.00 KB/i)).toBeInTheDocument()
    })
  })
})
