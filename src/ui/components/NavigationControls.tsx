/**
 * Navigation Controls Component
 *
 * Back/Forward navigation buttons with keyboard shortcut support.
 *
 * @version 2.3.0
 */

import * as React from 'react';
import type BAC4Plugin from '../../main';
import type { NavigationHistoryService } from '../../services/navigation-history-service';

interface NavigationControlsProps {
  plugin: BAC4Plugin;
  navigationService: NavigationHistoryService;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  navigationService,
  onNavigateBack,
  onNavigateForward,
}) => {
  const [canGoBack, setCanGoBack] = React.useState(false);
  const [canGoForward, setCanGoForward] = React.useState(false);

  // Update button states
  React.useEffect(() => {
    const updateStates = () => {
      setCanGoBack(navigationService.canGoBack());
      setCanGoForward(navigationService.canGoForward());
    };

    updateStates();

    // Update every second (in case state changes externally)
    const interval = setInterval(updateStates, 1000);
    return () => clearInterval(interval);
  }, [navigationService]);

  const handleBack = () => {
    if (canGoBack) {
      onNavigateBack();
    }
  };

  const handleForward = () => {
    if (canGoForward) {
      onNavigateForward();
    }
  };

  return (
    <div className="bac4-navigation-controls">
      <button
        className="bac4-nav-button bac4-nav-back"
        onClick={handleBack}
        disabled={!canGoBack}
        title="Go back (Alt+Left)"
        aria-label="Navigate back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button
        className="bac4-nav-button bac4-nav-forward"
        onClick={handleForward}
        disabled={!canGoForward}
        title="Go forward (Alt+Right)"
        aria-label="Navigate forward"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
};
