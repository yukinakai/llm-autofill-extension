/// <reference types="vitest" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ApiKeyForm from '../ApiKeyForm';
import * as storage from '../../../utils/storage';

vi.mock('../../../utils/storage', () => ({
  loadApiKey: vi.fn(),
  saveApiKey: vi.fn(),
  deleteApiKey: vi.fn(),
}));

describe('ApiKeyForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2025-02-08T19:40:00'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders API key input fields', async () => {
    vi.mocked(storage.loadApiKey).mockResolvedValue(null);
    render(<ApiKeyForm onSubmit={() => {}} />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('combobox', { name: /LLMプロバイダー/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /OpenAI APIキー/i })).toBeInTheDocument();
  });

  it('handles API key input changes', async () => {
    vi.mocked(storage.loadApiKey).mockResolvedValue(null);
    render(<ApiKeyForm onSubmit={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    fireEvent.change(input, { target: { value: 'sk-test-key' } });
    expect(input).toHaveValue('sk-test-key');
  });

  it('displays validation error for invalid API key format', async () => {
    vi.mocked(storage.loadApiKey).mockResolvedValue(null);
    render(<ApiKeyForm onSubmit={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    fireEvent.change(input, { target: { value: 'invalid-key' } });
    
    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      const errorAlert = screen.getByTestId('error-alert');
      expect(errorAlert).toHaveTextContent('OpenAIのAPIキーは"sk-"で始まる必要があります');
    });
  });

  it('handles form submission with valid API key', async () => {
    const mockOnSubmit = vi.fn();
    vi.mocked(storage.loadApiKey).mockResolvedValue(null);
    vi.mocked(storage.saveApiKey).mockResolvedValue();

    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    fireEvent.change(input, { target: { value: 'sk-test-key' } });
    
    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        provider: 'openai',
        key: 'sk-test-key',
        timestamp: '2025/2/8 19:40:00'
      });
    });
  });

  it('shows saved API key with timestamp and allows deletion', async () => {
    const mockOnSubmit = vi.fn();
    const savedApiKey = {
      provider: 'openai' as const,
      key: 'sk-test-key',
      timestamp: '2025/2/8 19:40:00'
    };

    vi.mocked(storage.loadApiKey).mockResolvedValue(savedApiKey);
    vi.mocked(storage.deleteApiKey).mockResolvedValue();

    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByText('登録済みのAPIキー')).toBeInTheDocument();
    });

    expect(screen.getByText(/プロバイダー: OpenAI/i)).toBeInTheDocument();
    expect(screen.getByText(/登録日時: 2025\/2\/8 19:40:00/i)).toBeInTheDocument();

    const deleteButton = screen.getByLabelText('APIキーを削除');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /OpenAI APIキー/i })).toBeInTheDocument();
    });

    expect(mockOnSubmit).toHaveBeenLastCalledWith(null);
  });

  it('loads saved API key on mount', async () => {
    const mockOnSubmit = vi.fn();
    const savedApiKey = {
      provider: 'openai' as const,
      key: 'sk-test-key',
      timestamp: '2025/2/8 19:40:00'
    };

    vi.mocked(storage.loadApiKey).mockResolvedValue(savedApiKey);

    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByText('登録済みのAPIキー')).toBeInTheDocument();
    });

    expect(screen.getByText(/プロバイダー: OpenAI/i)).toBeInTheDocument();
    expect(screen.getByText(/登録日時: 2025\/2\/8 19:40:00/i)).toBeInTheDocument();
    expect(mockOnSubmit).toHaveBeenCalledWith(savedApiKey);
  });

  it('shows loading state while fetching API key', () => {
    vi.mocked(storage.loadApiKey).mockResolvedValue(null);
    render(<ApiKeyForm onSubmit={() => {}} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('handles API key save error', async () => {
    const mockOnSubmit = vi.fn();
    vi.mocked(storage.loadApiKey).mockResolvedValue(null);
    vi.mocked(storage.saveApiKey).mockRejectedValue(new Error('Storage error'));

    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    fireEvent.change(input, { target: { value: 'sk-test-key' } });
    
    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorAlert = screen.getByTestId('error-alert');
      expect(errorAlert).toHaveTextContent('APIキーの保存に失敗しました');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles API key delete error', async () => {
    const mockOnSubmit = vi.fn();
    const savedApiKey = {
      provider: 'openai' as const,
      key: 'sk-test-key',
      timestamp: '2025/2/8 19:40:00'
    };

    vi.mocked(storage.loadApiKey).mockResolvedValue(savedApiKey);
    vi.mocked(storage.deleteApiKey).mockRejectedValue(new Error('Storage error'));

    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByText('登録済みのAPIキー')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('APIキーを削除');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const errorAlert = screen.getByTestId('error-alert');
      expect(errorAlert).toHaveTextContent('APIキーの削除に失敗しました');
    });

    expect(mockOnSubmit).not.toHaveBeenCalledWith(null);
  });

  it('handles API key load error', async () => {
    const mockOnSubmit = vi.fn();
    vi.mocked(storage.loadApiKey).mockRejectedValue(new Error('Storage error'));

    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      const errorAlert = screen.getByTestId('error-alert');
      expect(errorAlert).toHaveTextContent('APIキーの読み込みに失敗しました');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
