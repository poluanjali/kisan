import React from 'react';
import { resolveBilingualString } from '../utils/translations';

interface BilingualTextProps {
  text?: string;
  className?: string;
  subClassName?: string;
  layout?: 'stacked' | 'inline' | 'tag';
  langCode?: string;
}

/**
 * Cleanly renders text in ONLY the user's chosen language:
 * - If langCode is 'en' (English): shows ONLY clean English text with ZERO Hindi or Indic characters.
 * - If langCode is a specific regional language: shows ONLY that regional language translation.
 *   Never leaks Hindi to English, Telugu, Tamil, Kannada, or other languages.
 */
export const BilingualText: React.FC<BilingualTextProps> = ({
  text,
  className = '',
  subClassName = '',
  layout = 'stacked',
  langCode = 'en',
}) => {
  if (!text) return null;

  const resolved = resolveBilingualString(text, langCode);
  const displayText = resolved.display || resolved.primary;

  if (layout === 'tag') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold">
        <span className={className || 'text-gray-900 font-bold'}>{displayText}</span>
      </span>
    );
  }

  return (
    <span className={className || 'font-semibold text-gray-900'}>
      {displayText}
    </span>
  );
};
