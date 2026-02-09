type AlertOptions = {
  icon: 'warning' | 'error' | 'success' | 'info' | 'question';
  title: string;
  text?: string;
  html?: string;
  confirmButtonColor?: string;
};

const CONFIRM_COLOR = '#4F46E5';

export const getMissingFieldsAlert = (
  missingFields: string[]
): AlertOptions => ({
  icon: 'error',
  title: 'Missing Required Fields',
  html: `<p class="text-sm mb-3">Please complete the following fields before submitting:</p><ul class="text-left text-sm space-y-1">${missingFields
    .map((field) => `<li>• ${field}</li>`)
    .join('')}</ul>`,
  confirmButtonColor: CONFIRM_COLOR
});

export const getPriceRequiredAlert = (count: number): AlertOptions => ({
  icon: 'warning',
  title: 'Pricing Required',
  text: `Please set price for all ${count} line item(s) before approving.`,
  confirmButtonColor: CONFIRM_COLOR
});

export const getActualEtdRequiredAlert = (count: number): AlertOptions => ({
  icon: 'warning',
  title: 'Actual ETD Required',
  text: `Please set actual ETD for all ${count} line item(s).`,
  confirmButtonColor: CONFIRM_COLOR
});

export const getNoFilesSelectedAlert = (): AlertOptions => ({
  icon: 'warning',
  title: 'No Documents Selected',
  text: 'Please select at least one file to upload.',
  confirmButtonColor: CONFIRM_COLOR
});
