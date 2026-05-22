export type CustomerComponentSpecName =
  | 'button'
  | 'input'
  | 'card'
  | 'modal'
  | 'header'
  | 'badge'
  | 'loader'
  | 'emptyState'
  | 'errorState'
  | 'toast'
  | 'bottomSheet';

export const customerUiSpecs = {
  button: {
    minHeight: 46,
    borderRadius: 12,
    paddingX: 20,
    fontWeight: '900',
    variants: ['primary', 'secondary', 'outline', 'soft', 'ghost', 'danger'],
    accessibilityRole: 'button',
  },
  input: {
    minHeight: 48,
    borderRadius: 13,
    paddingX: 14,
    states: ['default', 'focus', 'disabled', 'error'],
  },
  card: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    hover: 'raise-shadow-on-web-only',
  },
  modal: {
    maxWidth: 720,
    borderRadius: 18,
    closeOnBackdrop: true,
    trapsFocusOnWeb: true,
  },
  header: {
    minHeight: 56,
    titleWeight: '900',
    supportsBackAction: true,
  },
  badge: {
    borderRadius: 8,
    paddingX: 8,
    paddingY: 5,
    tones: ['green', 'red', 'purple', 'orange', 'blue', 'muted'],
  },
  loader: {
    minDisplayMs: 220,
    labelRequired: false,
  },
  emptyState: {
    iconSize: 32,
    titleRequired: true,
    actionOptional: true,
  },
  errorState: {
    titleRequired: true,
    retryOptional: true,
    tone: 'danger',
  },
  toast: {
    durationMs: 2200,
    placement: 'bottom',
    dismissible: false,
  },
  bottomSheet: {
    snapPoints: ['content'],
    dragHandle: true,
    mobileOnly: true,
  },
} as const;

export function getCustomerUiSpec<TName extends CustomerComponentSpecName>(name: TName): typeof customerUiSpecs[TName] {
  return customerUiSpecs[name];
}
