/// <reference types="vitest" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ApiKeyForm from '../ApiKeyForm';
import * as storage from '../../../utils/storage';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';

// ストレージユーティリティをモック
vi.mock('../../../utils/storage', () => ({
  getApiKey: vi.fn(),
  saveApiKey: vi.fn(),
  deleteApiKey: vi.fn(),
}));

describe('ApiKeyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders API key input fields', () => {
    render(<ApiKeyForm />);

    expect(screen.getByRole('textbox', { name: /OpenAI APIキー/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /LLMプロバイダー/i })).toBeInTheDocument();
  });

  it('handles API key input changes', async () => {
    render(<ApiKeyForm />);

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    await userEvent.type(input, 'test-api-key');
    expect(input).toHaveValue('test-api-key');
  });

  it('displays validation error for invalid API key format', async () => {
    render(<ApiKeyForm />);

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    const submitButton = screen.getByRole('button', { name: /保存/i });

    await userEvent.type(input, 'invalid-key');
    await userEvent.click(submitButton);

    expect(await screen.findByText(/APIキーの形式が正しくありません/i)).toBeInTheDocument();
  });

  it('handles form submission with valid API key', async () => {
    const mockSaveApiKey = storage.saveApiKey as jest.Mock;
    mockSaveApiKey.mockResolvedValueOnce(undefined);

    render(<ApiKeyForm />);

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    const submitButton = screen.getByRole('button', { name: /保存/i });

    await userEvent.type(input, 'sk-test-valid-key');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSaveApiKey).toHaveBeenCalledWith({
        key: 'sk-test-valid-key',
        provider: 'openai',
        timestamp: expect.any(String)
      });
    });
  });

  it('shows saved API key with timestamp and allows deletion', async () => {
    const mockGetApiKey = storage.getApiKey as jest.Mock;
    const mockDeleteApiKey = storage.deleteApiKey as jest.Mock;

    mockGetApiKey.mockResolvedValueOnce({
      key: 'sk-test-key',
      provider: 'openai',
      timestamp: '2025-02-08T13:42:02.468Z'
    });

    render(<ApiKeyForm />);

    await waitFor(() => {
      expect(screen.getByText(/保存日時:/i)).toBeInTheDocument();
      expect(screen.getByText(/2025-02-08T13:42:02.468Z/i)).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /削除/i });
    await userEvent.click(deleteButton);

    expect(mockDeleteApiKey).toHaveBeenCalled();
  });

  it('shows loading state while fetching API key', () => {
    const mockGetApiKey = storage.getApiKey as jest.Mock;
    mockGetApiKey.mockImplementation(() => new Promise(() => {}));

    render(<ApiKeyForm />);

    expect(screen.getByText(/読み込み中/i)).toBeInTheDocument();
  });

  it('handles API key save error', async () => {
    const mockSaveApiKey = storage.saveApiKey as jest.Mock;
    mockSaveApiKey.mockRejectedValueOnce(new Error('Storage error'));

    render(<ApiKeyForm />);

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    const submitButton = screen.getByRole('button', { name: /保存/i });

    await userEvent.type(input, 'sk-test-valid-key');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/APIキーの保存に失敗しました/i)).toBeInTheDocument();
    });
  });

  it('handles API key delete error', async () => {
    const mockGetApiKey = storage.getApiKey as jest.Mock;
    const mockDeleteApiKey = storage.deleteApiKey as jest.Mock;

    mockGetApiKey.mockResolvedValueOnce({
      key: 'sk-test-key',
      provider: 'openai',
      timestamp: '2025-02-08T13:42:02.468Z'
    });

    mockDeleteApiKey.mockRejectedValueOnce(new Error('Storage error'));

    render(<ApiKeyForm />);

    await waitFor(() => {
      expect(screen.getByText(/保存日時:/i)).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /削除/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/APIキーの削除に失敗しました/i)).toBeInTheDocument();
    });
  });
});
