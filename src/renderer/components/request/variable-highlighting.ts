/**
 * Variable Highlighting for Input Fields
 * Provides visual highlighting and tooltips for {{variable}} syntax in input fields
 */

import { Environment } from '../../../shared/types';
import { detectVariables, resolveVariable } from './variable-detection';
import {
  createVariableTooltip,
  removeGlobalTooltip,
  getGlobalTooltip,
  setGlobalTooltip,
} from './variable-tooltip';

/**
 * Adds variable highlighting to an input field
 */
export function addVariableHighlighting(
  inputElement: HTMLInputElement,
  activeEnvironment: Environment | undefined,
  globals: { variables: Record<string, string> },
  folderVars?: Record<string, string>
): void {
  const text = inputElement.value;
  const variables = detectVariables(text);
  const highlightId =
    inputElement.dataset.variableHighlightId ||
    `var-highlight-${Math.random().toString(36).slice(2)}`;
  inputElement.dataset.variableHighlightId = highlightId;

  if (variables.length === 0) {
    // Remove any existing highlight container
    const existing = inputElement.parentElement?.querySelector(
      `.variable-highlight-container[data-for="${highlightId}"]`
    );
    if (existing) {
      existing.remove();
    }
    inputElement.classList.remove('has-variable-overlay');
    return;
  }

  // Create or get highlight container
  let container = inputElement.parentElement?.querySelector(
    `.variable-highlight-container[data-for="${highlightId}"]`
  ) as HTMLDivElement;
  const isNewContainer = !container;

  if (isNewContainer) {
    container = document.createElement('div');
    container.className = 'variable-highlight-container';
    container.dataset.for = highlightId;
    // Insert BEFORE the input so overlay renders behind (lower in stacking order)
    inputElement.parentElement?.insertBefore(container, inputElement);
  }

  // CRITICAL FIX: Always update position and size, not just on creation
  // This ensures the overlay stays aligned when DOM reflows or tabs switch
  const updatePosition = () => {
    // For URL input wrapper, use inset: 0 from CSS instead of explicit dimensions
    // to prevent overflow issues when the input changes size
    const isInUrlWrapper = inputElement.closest('.url-input-wrapper');
    if (isInUrlWrapper) {
      // Don't set explicit dimensions - let CSS handle it with inset: 0
      container.style.left = '';
      container.style.top = '';
      container.style.width = '';
      container.style.height = '';
    } else {
      // For other inputs, calculate position relative to parent
      const rect = inputElement.getBoundingClientRect();
      const parentRect = inputElement.parentElement!.getBoundingClientRect();
      container.style.left = `${rect.left - parentRect.left}px`;
      container.style.top = `${rect.top - parentRect.top}px`;
      container.style.width = `${rect.width}px`;
      container.style.height = `${rect.height}px`;
    }
  };
  updatePosition();

  // Match input typography so overlay text is identical size/weight
  const computed = window.getComputedStyle(inputElement);
  container.style.fontSize = computed.fontSize;
  container.style.fontFamily = computed.fontFamily;
  container.style.fontWeight = computed.fontWeight;
  container.style.lineHeight = computed.lineHeight;
  container.style.letterSpacing = computed.letterSpacing;
  container.style.padding = computed.padding;

  if (isNewContainer) {
    // CRITICAL FIX: Sync scroll position between input and overlay
    // This allows the overlay to scroll naturally with the input text
    const syncScroll = () => {
      container.scrollLeft = inputElement.scrollLeft;
    };
    inputElement.addEventListener('scroll', syncScroll);

    // Store cleanup function to remove listener if needed
    (container as any).__scrollSyncCleanup = () => {
      inputElement.removeEventListener('scroll', syncScroll);
    };

    // Update position on window resize
    window.addEventListener('resize', updatePosition);

    // When input gains focus: clear any stale tooltip from a previous hover.
    // We deliberately do NOT drop the overlay behind the input here; the overlay
    // stays on top so variable spans remain hoverable while the user is editing.
    // (See _variable-highlighting.scss — container z-index is fixed at 3.)
    const focusHandler = () => {
      removeGlobalTooltip();
    };
    inputElement.addEventListener('focus', focusHandler);

    // Remove tooltip when clicking anywhere in the document
    const clickHandler = (e: MouseEvent) => {
      const globalTooltip = getGlobalTooltip();
      if (globalTooltip && !globalTooltip.contains(e.target as Node)) {
        removeGlobalTooltip();
      }
    };
    document.addEventListener('click', clickHandler);

    // Store cleanup for these listeners too
    (container as any).__inputCleanup = () => {
      inputElement.removeEventListener('focus', focusHandler);
      document.removeEventListener('click', clickHandler);
    };
  } else {
    // Container exists, ensure scroll is synced
    container.scrollLeft = inputElement.scrollLeft;
  }

  // Clear existing content
  container.innerHTML = '';

  // Add text segments with highlights
  let lastIndex = 0;
  variables.forEach((variable) => {
    // Add text before variable
    if (variable.start > lastIndex) {
      const textSpan = document.createElement('span');
      textSpan.textContent = text.substring(lastIndex, variable.start);
      container.appendChild(textSpan);
    }

    // Add highlighted variable
    const varSpan = document.createElement('span');
    varSpan.className = 'variable-highlight';
    varSpan.textContent = text.substring(variable.start, variable.end);

    // Resolve variable to determine if it's defined
    const { value, source } = resolveVariable(
      variable.name,
      activeEnvironment,
      globals,
      folderVars
    );
    if (!value) {
      varSpan.classList.add('undefined');
    }

    // Add hover tooltip to the variable span
    varSpan.style.pointerEvents = 'auto';
    varSpan.style.cursor = 'help';

    // Pending teardown timer shared by this span's hover handlers. Declared up
    // front so the mouseenter handler can cancel a teardown queued by a very
    // recent mouseleave (e.g. a quick down→up re-approach over the variable).
    let keepTooltipTimer: number | null = null;

    varSpan.addEventListener('mouseenter', (e: MouseEvent) => {
      // Cancel any queued teardown from a previous hover so a stale timer can't
      // remove the tooltip we are about to (re)create.
      if (keepTooltipTimer !== null) {
        clearTimeout(keepTooltipTimer);
        keepTooltipTimer = null;
      }

      // Remove any existing tooltip
      removeGlobalTooltip();

      // Copy handler for the tooltip
      const handleCopy = (valueToCopy: string) => {
        navigator.clipboard.writeText(valueToCopy).catch((err) => {
          console.error('Failed to copy to clipboard:', err);
        });
      };

      // Create and position new tooltip
      const tooltip = createVariableTooltip(
        variable.name,
        value,
        source,
        handleCopy
      );
      setGlobalTooltip(tooltip);
      document.body.appendChild(tooltip);

      // Position tooltip near the cursor
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      tooltip.style.position = 'fixed';
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.bottom + 5}px`;
      tooltip.style.zIndex = '10000';
      tooltip.style.pointerEvents = 'auto';

      // Track if mouse enters tooltip
      let mouseEnteredTooltip = false;

      const tooltipMouseEnter = () => {
        mouseEnteredTooltip = true;
      };

      const tooltipMouseLeave = () => {
        removeGlobalTooltip();
      };

      tooltip.addEventListener('mouseenter', tooltipMouseEnter);
      tooltip.addEventListener('mouseleave', tooltipMouseLeave);

      // Store cleanup function
      (tooltip as any).__cleanup = () => {
        tooltip.removeEventListener('mouseenter', tooltipMouseEnter);
        tooltip.removeEventListener('mouseleave', tooltipMouseLeave);
      };
    });

    varSpan.addEventListener('mouseleave', () => {
      // Delay teardown so the cursor has time to travel from the variable to
      // the tooltip (which is rendered just below it).
      keepTooltipTimer = window.setTimeout(() => {
        keepTooltipTimer = null;

        // Only remove if a tooltip exists and the cursor has actually left the
        // hover zone.
        const globalTooltip = getGlobalTooltip();
        if (!globalTooltip) {
          return;
        }

        const tooltipRect = globalTooltip.getBoundingClientRect();
        const varRect = varSpan.getBoundingClientRect();
        const mouseX = (window as any).__mouseX || 0;
        const mouseY = (window as any).__mouseY || 0;

        // The tooltip is positioned a few px BELOW the variable, leaving a thin
        // gap between them. Approaching the variable from below leaves the
        // cursor sitting in (or jittering into) that gap — neither over the
        // variable nor over the tooltip — which previously tore the tooltip down
        // ~half the time. Treat the variable span, the tooltip, and the gap
        // between them as one contiguous hover zone (plus a small tolerance) so
        // the hover is reliable from every direction.
        const TOLERANCE = 6;
        const withinHoverZone =
          mouseX >= Math.min(varRect.left, tooltipRect.left) - TOLERANCE &&
          mouseX <= Math.max(varRect.right, tooltipRect.right) + TOLERANCE &&
          mouseY >= Math.min(varRect.top, tooltipRect.top) - TOLERANCE &&
          mouseY <= Math.max(varRect.bottom, tooltipRect.bottom) + TOLERANCE;

        if (!withinHoverZone) {
          if ((globalTooltip as any).__cleanup) {
            (globalTooltip as any).__cleanup();
          }
          removeGlobalTooltip();
        }
      }, 50);
    });

    container.appendChild(varSpan);
    lastIndex = variable.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    const textSpan = document.createElement('span');
    textSpan.textContent = text.substring(lastIndex);
    container.appendChild(textSpan);
  }

  // Mark input so CSS can hide the native text while overlay is active
  inputElement.classList.add('has-variable-overlay');
}
