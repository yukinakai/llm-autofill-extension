export interface FormField {
  name: string;
  type: string;
  placeholder?: string;
  value?: string;
}

export function detectForms(): FormField[] {
  const formFields: FormField[] = [];
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]');

  inputs.forEach((element) => {
    const input = element as HTMLInputElement;
    formFields.push({
      name: input.name,
      type: input.type,
      placeholder: input.placeholder || undefined,
      value: input.value || undefined
    });
  });

  return formFields;
}
