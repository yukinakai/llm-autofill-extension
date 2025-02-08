/// <reference types="vitest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import ApiKeyForm from '../ApiKeyForm';

describe('ApiKeyForm', () => {
  it('renders API key input fields', () => {
    render(<ApiKeyForm />);
    
    expect(screen.getByLabelText(/OpenAI API Key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gemini API Key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Claude API Key/i)).toBeInTheDocument();
  });

  it('handles API key input changes', () => {
    render(<ApiKeyForm />);
    
    const openAiInput = screen.getByLabelText(/OpenAI API Key/i);
    fireEvent.change(openAiInput, { target: { value: 'test-openai-key' } });
    expect(openAiInput).toHaveValue('test-openai-key');
  });

  it('displays validation error for invalid API key format', () => {
    render(<ApiKeyForm />);
    
    const openAiInput = screen.getByLabelText(/OpenAI API Key/i);
    fireEvent.change(openAiInput, { target: { value: 'invalid-key' } });
    fireEvent.blur(openAiInput);
    
    expect(screen.getByText('無効なAPIキーの形式です')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const onSubmit = vi.fn();
    const { debug } = render(<ApiKeyForm onSubmit={onSubmit} />);
    
    // 入力値を設定
    const openAiInput = screen.getByLabelText(/OpenAI API Key/i);
    fireEvent.change(openAiInput, { target: { value: 'sk-validopenaiapikey' } });
    
    // フォームを取得して送信
    const form = screen.getByRole('form', { name: 'api-key-form' });
    
    // デバッグ情報を出力
    console.log('Form element:', form);
    console.log('OpenAI input value:', (openAiInput as HTMLInputElement).value);
    
    fireEvent.submit(form);
    
    // 期待される引数でonSubmitが呼ばれることを確認
    expect(onSubmit).toHaveBeenCalledWith({
      openAiKey: 'sk-validopenaiapikey',
      geminiKey: '',
      claudeKey: ''
    });
  });
});
