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

  it('renders API key input fields', async () => {
    await act(async () => {
      render(<ApiKeyForm />);
    });

    expect(screen.getByLabelText('OpenAI APIキー')).toBeInTheDocument();
    expect(screen.getByLabelText('LLMプロバイダー')).toBeInTheDocument();
  });

  it('handles API key input changes', async () => {
    await act(async () => {
      render(<ApiKeyForm />);
    });

    const input = screen.getByLabelText('OpenAI APIキー');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'sk-test-key' } });
    });

    expect(input).toHaveValue('sk-test-key');
  });

  it('displays validation error for invalid API key format', async () => {
    await act(async () => {
      render(<ApiKeyForm />);
    });

    const input = screen.getByLabelText('OpenAI APIキー');
    const submitButton = screen.getByText('保存');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'invalid-key' } });
      fireEvent.click(submitButton);
    });

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      const errorMessage = screen.getByText('APIキーの形式が正しくありません');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('handles form submission with valid API key', async () => {
    await act(async () => {
      render(<ApiKeyForm />);
    });

    const input = screen.getByLabelText('OpenAI APIキー');
    const submitButton = screen.getByText('保存');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'sk-test-key' } });
      fireEvent.click(submitButton);
    });

    // APIキーが保存されることを確認
    await waitFor(() => {
      expect(storage.saveApiKey).toHaveBeenCalledWith(expect.objectContaining({
        key: 'sk-test-key',
        provider: 'openai'
      }));
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

  it('shows loading state while fetching API key', async () => {
    (storage.getApiKey as any).mockImplementation(() => new Promise(() => {}));
    render(<ApiKeyForm />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
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
