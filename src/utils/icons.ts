/**
 * Lucide Static SVG Icon Provider
 * Imports all static SVGs from lucide-static and replaces [data-lucide] placeholders
 */

// Import all SVG icons eagerly as raw strings from lucide-static
const rawSvgs = import.meta.glob<string>('../../node_modules/lucide-static/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Build a normalized lookup map (kebab-case, camelCase, lowercase)
const iconMap = new Map<string, string>();

for (const [filePath, svgContent] of Object.entries(rawSvgs)) {
  const match = filePath.match(/\/([^/]+)\.svg$/);
  if (match) {
    const rawName = match[1]; // e.g. "bot", "layout-grid", "volume-2", "chevron-right"
    const lowerName = rawName.toLowerCase();
    iconMap.set(lowerName, svgContent);

    // Also support without hyphens
    const noHyphen = lowerName.replace(/-/g, '');
    iconMap.set(noHyphen, svgContent);
  }
}

/**
 * Normalizes an icon name into standard kebab-case or lookup key
 */
function normalizeIconName(name: string): string {
  if (!name) return '';
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
    .trim();
}

/**
 * Get raw SVG markup for an icon name with custom attributes applied
 */
export function getIconSvg(name: string, customAttrs: Record<string, string> = {}): string {
  const normalized = normalizeIconName(name);
  let svg = iconMap.get(normalized) || iconMap.get(normalized.replace(/-/g, '')) || '';

  if (!svg) {
    for (const [key, val] of iconMap.entries()) {
      if (key === normalized || key.replace(/-/g, '') === normalized.replace(/-/g, '')) {
        svg = val;
        break;
      }
    }
  }

  if (!svg) {
    console.warn(`[Icons] Icon "${name}" (normalized: "${normalized}") not found in lucide-static icon set.`);
    return '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return svg;

  const existingClass = svgEl.getAttribute('class') || '';
  const mergedClass = ['icon', existingClass, customAttrs.class || ''].filter(Boolean).join(' ');
  svgEl.setAttribute('class', mergedClass);

  for (const [attrKey, attrVal] of Object.entries(customAttrs)) {
    if (attrKey !== 'class' && attrVal) {
      svgEl.setAttribute(attrKey, attrVal);
    }
  }

  return svgEl.outerHTML;
}

/**
 * Initializes Lucide icons across the document or a specific container
 */
export function initIcons(root?: HTMLElement): void {
  const scope = root || document;
  const elements = Array.from(scope.querySelectorAll<HTMLElement>('[data-lucide]'));

  for (const el of elements) {
    const iconName = el.getAttribute('data-lucide');
    if (!iconName) continue;

    const normalized = normalizeIconName(iconName);
    let rawSvg = iconMap.get(normalized) || iconMap.get(normalized.replace(/-/g, ''));

    if (!rawSvg) {
      for (const [key, val] of iconMap.entries()) {
        if (key === normalized || key.replace(/-/g, '') === normalized.replace(/-/g, '')) {
          rawSvg = val;
          break;
        }
      }
    }

    if (!rawSvg) {
      console.warn(`[Icons] <i data-lucide="${iconName}"></i> icon name was not found in the provided icons object.`);
      continue;
    }

    // Parse SVG string
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (!svgEl) continue;

    // Transfer attributes from original <i> element to the <svg> element
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      if (attr.name === 'class') {
        const existingClasses = svgEl.getAttribute('class') || '';
        const combined = Array.from(
          new Set([...existingClasses.split(' '), ...attr.value.split(' ')].filter(Boolean))
        ).join(' ');
        svgEl.setAttribute('class', combined);
      } else if (attr.name === 'style') {
        const existingStyle = svgEl.getAttribute('style') || '';
        svgEl.setAttribute('style', `${existingStyle}; ${attr.value}`.trim());
      } else if (attr.name !== 'data-lucide') {
        svgEl.setAttribute(attr.name, attr.value);
      }
    }

    // Always preserve data-lucide attribute
    svgEl.setAttribute('data-lucide', iconName);
    svgEl.setAttribute('aria-hidden', 'true');

    if (el.parentNode) {
      el.parentNode.replaceChild(svgEl, el);
    }
  }
}
