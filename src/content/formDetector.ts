export interface FormField {
  name: string;
  type: string;
  placeholder?: string;
  value?: string;
  label?: string;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

function findLabel(input: HTMLInputElement): string | undefined {
  // idに関連付けられたlabelを探す
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      return label.textContent?.trim();
    }
  }

  // 親要素内のlabelを探す
  let parent = input.parentElement;
  while (parent) {
    if (parent.tagName.toLowerCase() === 'label') {
      return parent.textContent?.trim();
    }
    parent = parent.parentElement;
  }

  // 前後の要素からラベルっぽいテキストを探す
  const previousElement = input.previousElementSibling;
  if (previousElement && previousElement.textContent) {
    return previousElement.textContent.trim();
  }

  return undefined;
}

export function detectForms(): FormField[] {
  const formFields: FormField[] = [];
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"], input[type="search"], input[type="url"], input[type="number"]');

  inputs.forEach((element) => {
    const input = element as HTMLInputElement;
    formFields.push({
      name: input.name,
      type: input.type,
      placeholder: input.placeholder || undefined,
      value: input.value || undefined,
      label: findLabel(input),
      id: input.id || undefined,
      className: input.className || undefined,
      ariaLabel: input.getAttribute('aria-label') || undefined
    });
  });

  return formFields;
}
