/// <reference types="vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import ApiKeyForm from '../ApiKeyForm';

describe('ApiKeyForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-08T19:40:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders API key input fields', () => {
    render(<ApiKeyForm onSubmit={() => {}} />);
    
    // プルダウンメニューの確認
    expect(screen.getByLabelText(/LLMプロバイダー/i)).toBeInTheDocument();
    // APIキー入力フィールドの確認
    expect(screen.getByLabelText(/OpenAI APIキー/i)).toBeInTheDocument();
  });

  it('handles API key input changes', () => {
    render(<ApiKeyForm onSubmit={() => {}} />);
    
    const input = screen.getByLabelText(/OpenAI APIキー/i);
    fireEvent.change(input, { target: { value: 'sk-test-key' } });
    
    expect(input).toHaveValue('sk-test-key');
  });

  it('displays validation error for invalid API key format', () => {
    render(<ApiKeyForm onSubmit={() => {}} />);
    
    const input = screen.getByLabelText(/OpenAI APIキー/i);
    fireEvent.change(input, { target: { value: 'invalid-key' } });
    
    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/OpenAIのAPIキーは"sk-"で始まる必要があります/i)).toBeInTheDocument();
  });

  it('handles form submission with valid API key', () => {
    const mockOnSubmit = vi.fn();
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);
    
    const input = screen.getByLabelText(/OpenAI APIキー/i);
    fireEvent.change(input, { target: { value: 'sk-test-key' } });
    
    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      provider: 'openai',
      key: 'sk-test-key',
      timestamp: '2025/2/8 19:40:00'
    });
  });

  it('shows saved API key with timestamp and allows deletion', async () => {
    const mockOnSubmit = vi.fn();
    render(<ApiKeyForm onSubmit={mockOnSubmit} />);
    
    // APIキーを保存
    const input = screen.getByLabelText(/OpenAI APIキー/i);
    fireEvent.change(input, { target: { value: 'sk-test-key' } });
    
    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);
    
    // 保存済みのAPIキー情報が表示されることを確認
    expect(screen.getByText('登録済みのAPIキー')).toBeInTheDocument();
    expect(screen.getByText(/プロバイダー: OpenAI/i)).toBeInTheDocument();
    expect(screen.getByText(/登録日時: 2025\/2\/8 19:40:00/i)).toBeInTheDocument();
    
    // 削除ボタンをクリック
    const deleteButton = screen.getByLabelText('APIキーを削除');
    fireEvent.click(deleteButton);
    
    // 削除後にフォームが再表示されることを確認
    expect(screen.getByLabelText(/OpenAI APIキー/i)).toBeInTheDocument();
    expect(mockOnSubmit).toHaveBeenLastCalledWith(null);
  });
});
