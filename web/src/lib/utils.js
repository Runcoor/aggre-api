/*
Copyright (C) 2025 QuantumNous

cn — concatenate class strings with Tailwind-aware merging. Mirrors the
shadcn/ui utility: clsx flattens/concatenates class inputs, twMerge then
resolves Tailwind class conflicts so the LAST value of a conflicting
utility wins (e.g. `cn('h-6', 'h-3')` → `'h-3'`).

Required for components that use override patterns like
`cn('h-6 w-6', className)` where caller passes `h-3 w-6` to half-height
the element. Without twMerge both `h-6` and `h-3` end up in the final
class list and CSS source order picks the wrong winner.
*/

import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));
