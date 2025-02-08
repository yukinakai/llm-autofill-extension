/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileForm from '../ProfileForm';

describe('ProfileForm', () => {
  const mockOnSave = jest.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
  });

  it('初期状態で1つの空のフィールドが表示される', () => {
    render(<ProfileForm onSave={mockOnSave} />);

    const nameInputs = screen.getAllByPlaceholderText('項目名');
    const valueInputs = screen.getAllByPlaceholderText('値');

    expect(nameInputs).toHaveLength(1);
    expect(valueInputs).toHaveLength(1);
    expect(nameInputs[0]).toHaveValue('');
    expect(valueInputs[0]).toHaveValue('');
  });

  it('「項目を追加」ボタンをクリックすると新しいフィールドが追加される', () => {
    render(<ProfileForm onSave={mockOnSave} />);

    const addButton = screen.getByText('項目を追加');
    fireEvent.click(addButton);

    const nameInputs = screen.getAllByPlaceholderText('項目名');
    const valueInputs = screen.getAllByPlaceholderText('値');

    expect(nameInputs).toHaveLength(2);
    expect(valueInputs).toHaveLength(2);
  });

  it('フィールドの削除ボタンをクリックするとフィールドが削除される', () => {
    render(<ProfileForm onSave={mockOnSave} />);

    // まず新しいフィールドを追加
    const addButton = screen.getByText('項目を追加');
    fireEvent.click(addButton);

    // 削除ボタンをクリック
    const deleteButtons = screen.getAllByText('削除');
    fireEvent.click(deleteButtons[0]);

    const nameInputs = screen.getAllByPlaceholderText('項目名');
    const valueInputs = screen.getAllByPlaceholderText('値');

    expect(nameInputs).toHaveLength(1);
    expect(valueInputs).toHaveLength(1);
  });

  it('最後の1つのフィールドは削除できない', () => {
    render(<ProfileForm onSave={mockOnSave} />);

    const deleteButton = screen.getByText('削除');
    expect(deleteButton).toBeDisabled();
  });

  it('フォームを送信すると入力されたデータでonSaveが呼ばれ、フォームがリセットされる', async () => {
    render(<ProfileForm onSave={mockOnSave} />);

    // フィールドに値を入力
    const nameInput = screen.getByPlaceholderText('項目名');
    const valueInput = screen.getByPlaceholderText('値');
    await userEvent.type(nameInput, 'テスト名前');
    await userEvent.type(valueInput, 'テスト値');

    // フォームを送信
    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);

    // onSaveが正しい値で呼ばれたことを確認
    expect(mockOnSave).toHaveBeenCalledWith([
      { name: 'テスト名前', value: 'テスト値' }
    ]);

    // フォームがリセットされたことを確認
    expect(nameInput).toHaveValue('');
    expect(valueInput).toHaveValue('');
  });

  it('空のフィールドは保存時に無視される', () => {
    render(<ProfileForm onSave={mockOnSave} />);

    // 空のフォームを送信
    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);

    // onSaveが呼ばれないことを確認
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('編集モードではフォームのリセットが行われない', async () => {
    const initialFields = [
      { name: '既存の名前', value: '既存の値' }
    ];
    render(<ProfileForm onSave={mockOnSave} initialFields={initialFields} />);

    // フィールドの値を変更
    const nameInput = screen.getByPlaceholderText('項目名');
    const valueInput = screen.getByPlaceholderText('値');
    await userEvent.clear(nameInput);
    await userEvent.clear(valueInput);
    await userEvent.type(nameInput, '新しい名前');
    await userEvent.type(valueInput, '新しい値');

    // フォームを送信
    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);

    // onSaveが呼ばれたことを確認
    expect(mockOnSave).toHaveBeenCalledWith([
      { name: '新しい名前', value: '新しい値' }
    ]);

    // フォームがリセットされていないことを確認
    expect(nameInput).toHaveValue('新しい名前');
    expect(valueInput).toHaveValue('新しい値');
  });
});
