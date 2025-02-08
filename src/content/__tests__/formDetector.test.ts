import { describe, it, expect, vi } from 'vitest';
import { detectForms, FormField } from '../formDetector';

describe('FormDetector', () => {
  it('should detect form fields in the document', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="firstName" placeholder="First Name">
        <input type="email" name="emailAddress" placeholder="Email">
        <input type="tel" name="phoneNumber" placeholder="Phone">
      </form>
    `;

    const fields = detectForms();
    expect(fields).toHaveLength(3);
    expect(fields).toContainEqual(expect.objectContaining({
      name: 'firstName',
      type: 'text',
      placeholder: 'First Name'
    }));
  });

  it('should handle forms with no fields', () => {
    document.body.innerHTML = '<form></form>';
    const fields = detectForms();
    expect(fields).toHaveLength(0);
  });
});
