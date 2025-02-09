import { describe, it, expect, vi } from 'vitest';
import { detectForms, FormField } from '../formDetector';

describe('FormDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

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

  it('should detect form fields with labels using "for" attribute', () => {
    document.body.innerHTML = `
      <form>
        <label for="firstName">First Name</label>
        <input type="text" id="firstName" name="firstName">
        
        <label for="email">Email Address</label>
        <input type="email" id="email" name="emailAddress">
        
        <label for="phone">Phone Number</label>
        <input type="tel" id="phone" name="phoneNumber">
      </form>
    `;

    const fields = detectForms();
    expect(fields).toHaveLength(3);
    expect(fields).toContainEqual(expect.objectContaining({
      name: 'firstName',
      type: 'text',
      label: 'First Name',
      id: 'firstName'
    }));
    expect(fields).toContainEqual(expect.objectContaining({
      name: 'emailAddress',
      type: 'email',
      label: 'Email Address',
      id: 'email'
    }));
  });

  it('should detect form fields with wrapper label elements', () => {
    document.body.innerHTML = `
      <form>
        <label>
          First Name
          <input type="text" name="firstName">
        </label>
        <label>
          Email
          <input type="email" name="emailAddress">
        </label>
      </form>
    `;

    const fields = detectForms();
    expect(fields).toHaveLength(2);
    expect(fields).toContainEqual(expect.objectContaining({
      name: 'firstName',
      type: 'text',
      label: 'First Name'
    }));
  });

  it('should detect form fields with aria-label attributes', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="firstName" aria-label="First Name">
        <input type="email" name="emailAddress" aria-label="Email Address">
      </form>
    `;

    const fields = detectForms();
    expect(fields).toHaveLength(2);
    expect(fields).toContainEqual(expect.objectContaining({
      name: 'firstName',
      type: 'text',
      ariaLabel: 'First Name'
    }));
  });

  it('should detect form fields with placeholders', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="firstName" placeholder="Enter your first name">
        <input type="email" name="emailAddress" placeholder="Enter your email">
      </form>
    `;

    const fields = detectForms();
    expect(fields).toHaveLength(2);
    expect(fields).toContainEqual(expect.objectContaining({
      name: 'firstName',
      type: 'text',
      placeholder: 'Enter your first name'
    }));
  });

  it('should detect form fields with class names', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="firstName" class="form-control name-field">
        <input type="email" name="emailAddress" class="form-control email-field">
      </form>
    `;

    const fields = detectForms();
    expect(fields).toHaveLength(2);
    expect(fields).toContainEqual(expect.objectContaining({
      name: 'firstName',
      type: 'text',
      className: 'form-control name-field'
    }));
  });

  it('should handle forms with no fields', () => {
    document.body.innerHTML = '<form></form>';
    const fields = detectForms();
    expect(fields).toHaveLength(0);
  });

  it('should handle forms with invalid or unsupported input types', () => {
    document.body.innerHTML = `
      <form>
        <input type="submit" name="submit">
        <input type="reset" name="reset">
        <input type="button" name="button">
        <input type="hidden" name="hidden">
      </form>
    `;

    const fields = detectForms();
    expect(fields).toHaveLength(0);
  });
});
