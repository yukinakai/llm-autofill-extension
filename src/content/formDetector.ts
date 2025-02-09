export interface FormField {
  name: string;
  type: string;
  placeholder?: string;
  label: string;
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
      label: input.labels && input.labels.length > 0 ? input.labels[0].textContent || '' : '',
      value: input.value || undefined
    });
  });

  return formFields;
}
