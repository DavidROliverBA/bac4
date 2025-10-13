/**
 * Navigation Utilities
 *
 * Utility functions for determining navigation icon visibility based on
 * node type and diagram hierarchy level.
 */

// No imports needed for basic types

/**
 * C4 Model hierarchy levels
 */
export type DiagramType = 'context' | 'container' | 'component';

/**
 * Determine if a node can have drill-down navigation (plus icon)
 *
 * Rules:
 * - Context diagrams: System and Person nodes can drill down
 * - Container diagrams: Container nodes can drill down
 * - Component diagrams: No drill-down (leaf level)
 *
 * @param nodeType - The type of the node
 * @param diagramType - The current diagram type
 * @param hasChildDiagram - Whether the node already has a child diagram
 * @returns true if plus icon should be shown
 */
export function canDrillDown(
  nodeType: string | undefined,
  diagramType: DiagramType,
  hasChildDiagram: boolean
): boolean {
  // Component diagrams are at the leaf level - no drill-down
  if (diagramType === 'component') {
    return false;
  }

  // Context diagrams - only System and Person nodes can drill down
  if (diagramType === 'context') {
    return (nodeType === 'system' || nodeType === 'person') && hasChildDiagram;
  }

  // Container diagrams - only Container nodes can drill down
  if (diagramType === 'container') {
    return nodeType === 'container' && hasChildDiagram;
  }

  return false;
}

/**
 * Determine if navigation up to parent is available (minus icon)
 *
 * Rules:
 * - Context diagrams: No parent (top level)
 * - Container diagrams: Can go to parent Context
 * - Component diagrams: Can go to parent Container
 *
 * @param diagramType - The current diagram type
 * @param hasParent - Whether the diagram has a parent diagram
 * @returns true if minus icon should be shown
 */
export function canGoToParent(
  diagramType: DiagramType,
  hasParent: boolean
): boolean {
  // Context is the top level - no parent
  if (diagramType === 'context') {
    return false;
  }

  // Container and Component diagrams can have parents
  return hasParent;
}

/**
 * Get navigation icon visibility for a node
 *
 * Returns which icons (plus and/or minus) should be shown for a given node
 * in the current diagram context.
 *
 * @param nodeType - The type of the node
 * @param diagramType - The current diagram type
 * @param hasChildDiagram - Whether the node has a child diagram
 * @param hasParent - Whether the current diagram has a parent
 * @returns Object with showPlus and showMinus flags
 */
export function getNavigationIconVisibility(
  nodeType: string | undefined,
  diagramType: DiagramType,
  hasChildDiagram: boolean,
  hasParent: boolean
): { showPlus: boolean; showMinus: boolean } {
  return {
    showPlus: canDrillDown(nodeType, diagramType, hasChildDiagram),
    showMinus: canGoToParent(diagramType, hasParent),
  };
}

/**
 * Infer diagram type from file path
 *
 * Attempts to determine the diagram type based on common naming conventions
 * and file paths. Falls back to 'context' if cannot be determined.
 *
 * @param filePath - Path to the diagram file
 * @returns The inferred diagram type
 */
export function inferDiagramType(filePath: string): DiagramType {
  const lowerPath = filePath.toLowerCase();

  if (lowerPath.includes('component')) {
    return 'component';
  }

  if (lowerPath.includes('container')) {
    return 'container';
  }

  // Default to context if unclear
  return 'context';
}

/**
 * Calculate screen position for navigation icon
 *
 * Converts React Flow node coordinates to screen coordinates, accounting for
 * viewport transforms (pan and zoom).
 *
 * @param node - The React Flow node
 * @param side - Which side of the node ('left' or 'right')
 * @param zoom - Current zoom level
 * @param panX - Current X pan offset
 * @param panY - Current Y pan offset
 * @param wrapperRect - Bounding rect of the React Flow wrapper
 * @returns Screen coordinates {x, y} for the icon
 */
export function calculateIconPosition(
  node: { position: { x: number; y: number }; width?: number | null; height?: number | null },
  side: 'left' | 'right',
  zoom: number,
  panX: number,
  panY: number,
  wrapperRect: DOMRect
): { x: number; y: number } {
  // Get node dimensions (with fallback defaults)
  const nodeWidth = node.width ?? 100;
  const nodeHeight = node.height ?? 50;

  // Convert node position to screen coordinates using React Flow formula:
  // screenX = nodeX * zoom + viewportX + wrapperOffsetX
  const nodeScreenX = node.position.x * zoom + panX + wrapperRect.left;
  const nodeScreenY = node.position.y * zoom + panY + wrapperRect.top;

  // Node dimensions also need to be scaled by zoom
  const scaledWidth = nodeWidth * zoom;
  const scaledHeight = nodeHeight * zoom;

  // Calculate icon position based on side
  const iconSize = 24; // Size of the icon in pixels
  const offset = 8; // Distance from node edge

  let x: number;
  let y: number;

  if (side === 'left') {
    // Position on left side, vertically centered
    x = nodeScreenX - offset - iconSize;
    y = nodeScreenY + scaledHeight / 2 - iconSize / 2;
  } else {
    // Position on right side, vertically centered
    x = nodeScreenX + scaledWidth + offset;
    y = nodeScreenY + scaledHeight / 2 - iconSize / 2;
  }

  console.log('BAC4 calculateIconPosition:', {
    side,
    nodePos: node.position,
    nodeWidth,
    nodeHeight,
    zoom,
    panX,
    panY,
    wrapperRect: { left: wrapperRect.left, top: wrapperRect.top },
    nodeScreenPos: { x: nodeScreenX, y: nodeScreenY },
    scaledDimensions: { width: scaledWidth, height: scaledHeight },
    finalIconPos: { x, y }
  });

  return { x, y };
}

/**
 * Check if an icon position is within viewport bounds
 *
 * Used to determine if icon should be rendered or hidden when near edge.
 *
 * @param iconPos - Icon screen position
 * @param iconSize - Icon size in pixels
 * @param viewportRect - Viewport bounding rectangle
 * @returns true if icon is within visible bounds
 */
export function isIconInViewport(
  iconPos: { x: number; y: number },
  iconSize: number,
  viewportRect: DOMRect
): boolean {
  return (
    iconPos.x >= viewportRect.left &&
    iconPos.x + iconSize <= viewportRect.right &&
    iconPos.y >= viewportRect.top &&
    iconPos.y + iconSize <= viewportRect.bottom
  );
}
