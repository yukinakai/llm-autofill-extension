/// <reference types="vitest" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ApiKeyForm from '../ApiKeyForm';
import * as storage from '../../../utils/storage';

vi.mock('../../../utils/storage', () => ({
  getApiKey: vi.fn(),
  saveApiKey: vi.fn(),
  deleteApiKey: vi.fn()
}));

describe('ApiKeyForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders API key input fields', async () => {
    vi.mocked(storage.getApiKey).mockResolvedValue(null);
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'LLMプロバイダー' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'OpenAI APIキー' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    });
  });

  it('handles API key input changes', async () => {
    vi.mocked(storage.getApiKey).mockResolvedValue(null);
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      const input = screen.getByRole('textbox', { name: 'OpenAI APIキー' });
      fireEvent.change(input, { target: { value: 'test-key' } });
      expect(input).toHaveValue('test-key');
    });
  });

  it('displays validation error for invalid API key format', async () => {
    vi.mocked(storage.getApiKey).mockResolvedValue(null);
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      const input = screen.getByRole('textbox', { name: 'OpenAI APIキー' });
      const submitButton = screen.getByRole('button', { name: '保存' });

      fireEvent.change(input, { target: { value: 'invalid-key' } });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('OpenAIのAPIキーは"sk-"で始まる必要があります')).toBeInTheDocument();
    });
  });

  it('handles form submission with valid API key', async () => {
    vi.mocked(storage.getApiKey).mockResolvedValue(null);
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      const input = screen.getByRole('textbox', { name: 'OpenAI APIキー' });
      const submitButton = screen.getByRole('button', { name: '保存' });

      fireEvent.change(input, { target: { value: 'sk-test-key' } });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(storage.saveApiKey).toHaveBeenCalledWith(expect.objectContaining({
        key: 'sk-test-key',
        provider: 'openai'
      }));
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('shows saved API key with timestamp and allows deletion', async () => {
    const mockApiKey = {
      key: 'sk-test-key',
      provider: 'openai' as const,
      timestamp: '2025/2/8 19:40:00'
    };

    vi.mocked(storage.getApiKey).mockResolvedValue(mockApiKey);
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByText('APIキーが保存されています')).toBeInTheDocument();
      expect(screen.getByText('プロバイダー: OpenAI')).toBeInTheDocument();
      expect(screen.getByText('登録日時: 2025/2/8 19:40:00')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: '削除' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(storage.deleteApiKey).toHaveBeenCalled();
    });
  });

  it('shows loading state while fetching API key', () => {
    vi.mocked(storage.getApiKey).mockImplementation(() => new Promise(() => {}));
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('handles API key save error', async () => {
    vi.mocked(storage.getApiKey).mockResolvedValue(null);
    vi.mocked(storage.saveApiKey).mockRejectedValue(new Error('Storage error'));
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      const input = screen.getByRole('textbox', { name: 'OpenAI APIキー' });
      const submitButton = screen.getByRole('button', { name: '保存' });

      fireEvent.change(input, { target: { value: 'sk-test-key' } });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('APIキーの保存に失敗しました')).toBeInTheDocument();
    });
  });

  it('handles API key delete error', async () => {
    const mockApiKey = {
      key: 'sk-test-key',
      provider: 'openai' as const,
      timestamp: '2025/2/8 19:40:00'
    };

    vi.mocked(storage.getApiKey).mockResolvedValue(mockApiKey);
    vi.mocked(storage.deleteApiKey).mockRejectedValue(new Error('Storage error'));
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByText('APIキーが保存されています')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: '削除' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('APIキーの削除に失敗しました')).toBeInTheDocument();
    });
  });
});
