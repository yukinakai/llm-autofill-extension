/// <reference types="vitest" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ApiKeyForm from '../ApiKeyForm';
import * as storage from '../../../utils/storage';
import { act } from 'react-dom/test-utils';

// ストレージユーティリティをモック
vi.mock('../../../utils/storage', () => ({
  getApiKey: vi.fn(),
  saveApiKey: vi.fn(),
  deleteApiKey: vi.fn(),
}));

describe('ApiKeyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトのモック実装
    (storage.getApiKey as any).mockResolvedValue(null);
    (storage.saveApiKey as any).mockResolvedValue(undefined);
    (storage.deleteApiKey as any).mockResolvedValue(undefined);
  });

  it('renders API key input fields', () => {
    render(
      <ApiKeyForm />
    );

    expect(screen.getByRole('textbox', { name: /OpenAI APIキー/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /LLMプロバイダー/i })).toBeInTheDocument();
  });

  it('handles API key input changes', () => {
    render(
      <ApiKeyForm />
    );

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    fireEvent.change(input, { target: { value: 'test-api-key' } });
    expect(input).toHaveValue('test-api-key');
  });

  it('displays validation error for invalid API key format', () => {
    render(
      <ApiKeyForm />
    );

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    const submitButton = screen.getByRole('button', { name: /保存/i });

    fireEvent.change(input, { target: { value: 'invalid-key' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/APIキーの形式が正しくありません/i)).toBeInTheDocument();
  });

  it('handles form submission with valid API key', async () => {
    const mockSaveApiKey = jest.fn();
    (storage.saveApiKey as jest.Mock).mockImplementation(mockSaveApiKey);

    render(
      <ApiKeyForm />
    );

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    const submitButton = screen.getByRole('button', { name: /保存/i });

    fireEvent.change(input, { target: { value: 'sk-validapikey123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSaveApiKey).toHaveBeenCalledWith('sk-validapikey123');
    });
  });

  it('shows saved API key with timestamp and allows deletion', async () => {
    const mockGetApiKey = jest.fn().mockResolvedValue({
      key: 'sk-existingkey123',
      timestamp: new Date().toISOString()
    });
    (storage.getApiKey as jest.Mock).mockImplementation(mockGetApiKey);

    render(
      <ApiKeyForm />
    );

    await waitFor(() => {
      expect(screen.getByText(/APIキーが保存されています/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching API key', () => {
    const mockGetApiKey = jest.fn().mockImplementation(() => new Promise(() => {}));
    (storage.getApiKey as jest.Mock).mockImplementation(mockGetApiKey);

    render(
      <ApiKeyForm />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles API key save error', async () => {
    const mockSaveApiKey = jest.fn().mockRejectedValue(new Error('Storage error'));
    (storage.saveApiKey as jest.Mock).mockImplementation(mockSaveApiKey);

    render(
      <ApiKeyForm />
    );

    const input = screen.getByRole('textbox', { name: /OpenAI APIキー/i });
    const submitButton = screen.getByRole('button', { name: /保存/i });

    fireEvent.change(input, { target: { value: 'sk-validapikey123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/APIキーの保存に失敗しました/i)).toBeInTheDocument();
    });
  });

  it('handles API key delete error', async () => {
    const mockGetApiKey = jest.fn().mockResolvedValue({
      key: 'sk-existingkey123',
      timestamp: new Date().toISOString()
    });
    const mockDeleteApiKey = jest.fn().mockRejectedValue(new Error('Storage error'));
    (storage.getApiKey as jest.Mock).mockImplementation(mockGetApiKey);
    (storage.deleteApiKey as jest.Mock).mockImplementation(mockDeleteApiKey);

    render(
      <ApiKeyForm />
    );

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /削除/i });
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/APIキーの削除に失敗しました/i)).toBeInTheDocument();
    });
  });

  it('shows saved API key with timestamp and allows deletion', async () => {
    const mockApiKey = {
      key: 'sk-test-key',
      provider: 'openai',
      timestamp: '2025/2/8 22:32:39'
    };

    (storage.getApiKey as any).mockResolvedValue(mockApiKey);

    await act(async () => {
      render(<ApiKeyForm />);
    });

    // 保存されたAPIキーが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('保存日時: 2025/2/8 22:32:39')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButton = screen.getByText('削除');
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // APIキーが削除されることを確認
    await waitFor(() => {
      expect(storage.deleteApiKey).toHaveBeenCalled();
    });
  });

  it('handles API key save error', async () => {
    (storage.saveApiKey as any).mockRejectedValue(new Error('Storage error'));

    await act(async () => {
      render(<ApiKeyForm />);
    });

    const input = screen.getByLabelText('OpenAI APIキー');
    const submitButton = screen.getByText('保存');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'sk-test-key' } });
      fireEvent.click(submitButton);
    });

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      const errorMessage = screen.getByText('APIキーの保存に失敗しました');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('handles API key delete error', async () => {
    const mockApiKey = {
      key: 'sk-test-key',
      provider: 'openai',
      timestamp: '2025/2/8 22:32:39'
    };

    (storage.getApiKey as any).mockResolvedValue(mockApiKey);
    (storage.deleteApiKey as any).mockRejectedValue(new Error('Storage error'));

    await act(async () => {
      render(<ApiKeyForm />);
    });

    // 削除ボタンが表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButton = screen.getByText('削除');
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      const errorMessage = screen.getByText('APIキーの削除に失敗しました');
      expect(errorMessage).toBeInTheDocument();
    });
  });
});
