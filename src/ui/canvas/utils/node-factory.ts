/**
 * Node Factory Utilities
 *
 * Creates new nodes for the canvas with proper type definitions and default properties.
 * Handles node ID generation and positioning.
 *
 * @module node-factory
 */

import type { Node } from 'reactflow';
import type {
  CanvasNodeData,
  C4NodeData,
  CloudComponentNodeData,
  SystemNodeData,
  PersonNodeData,
  ContainerNodeData,
  CapabilityNodeData,
  GraphNodeData,
} from '../../../types/canvas-types';
import type { ComponentDefinition } from '../../../../component-library/types';

/**
 * Generate unique node ID
 *
 * Creates sequential node IDs using a counter reference.
 *
 * @param counterRef - React ref object containing the current counter value
 * @returns Unique node ID in format "node-{number}"
 *
 * @example
 * ```ts
 * const nodeCounterRef = useRef(0);
 * const id = generateNodeId(nodeCounterRef);
 * // Returns "node-1", "node-2", etc.
 * ```
 */
export function generateNodeId(counterRef: React.MutableRefObject<number>): string {
  counterRef.current += 1;
  return `node-${counterRef.current}`;
}

/**
 * Generate random position for new node
 *
 * Creates a random position within a reasonable canvas area to avoid
 * stacking all new nodes on top of each other.
 *
 * @returns Position object with x and y coordinates
 */
export function generateRandomPosition(): { x: number; y: number } {
  return {
    x: Math.random() * 500 + 100,
    y: Math.random() * 300 + 100,
  };
}

/**
 * Create a C4 node
 *
 * @param id - Unique node ID
 * @param position - Node position on canvas
 * @param label - Node label
 * @param type - C4 diagram type (context, container, component)
 * @returns Configured C4 node
 */
export function createC4Node(
  id: string,
  position: { x: number; y: number },
  label: string,
  type: 'context' | 'container' | 'component'
): Node<C4NodeData> {
  return {
    id,
    type: 'c4',
    position,
    data: {
      label,
      type,
      technology: '',
      description: '',
    },
    zIndex: 1, // Regular nodes on top
  };
}

/**
 * Create a system node
 *
 * @param id - Unique node ID
 * @param position - Node position on canvas
 * @param label - Node label
 * @param external - Whether this is an external system
 * @returns Configured system node
 */
export function createSystemNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  external: boolean = false
): Node<SystemNodeData> {
  return {
    id,
    type: 'system',
    position,
    data: {
      label,
      external,
      // v0.6.0: hasChildDiagram removed, use linkedDiagramPath instead
    },
    zIndex: 1, // Regular nodes on top
  };
}

/**
 * Create a person node
 *
 * @param id - Unique node ID
 * @param position - Node position on canvas
 * @param label - Node label
 * @param role - Person's role (optional)
 * @returns Configured person node
 */
export function createPersonNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  role?: string
): Node<PersonNodeData> {
  return {
    id,
    type: 'person',
    position,
    data: {
      label,
      role,
    },
    zIndex: 1, // Regular nodes on top
  };
}

/**
 * Create a container node
 * Schema v0.4.0: Uses flexible icon field instead of containerType enum
 *
 * @param id - Unique node ID
 * @param position - Node position on canvas
 * @param label - Node label
 * @param icon - Lucide icon ID (default: 'box')
 * @param type - Optional type tag (e.g., "REST API", "PostgreSQL")
 * @returns Configured container node
 */
export function createContainerNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  icon: string = 'box',
  type?: string
): Node<ContainerNodeData> {
  return {
    id,
    type: 'container',
    position,
    data: {
      label,
      icon,
      type,
      // v0.6.0: hasChildDiagram removed, use linkedDiagramPath instead
    },
    zIndex: 1, // Regular nodes on top
  };
}

/**
 * Create a cloud component node
 * v1.0.0: Supports container nodes with sizing from component definition
 *
 * @param id - Unique node ID
 * @param position - Node position on canvas
 * @param label - Node label
 * @param component - Component definition from library
 * @returns Configured cloud component node
 */
export function createCloudComponentNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  component: ComponentDefinition
): Node<CloudComponentNodeData> {
  // Build the node
  const node: Node<CloudComponentNodeData> = {
    id,
    type: 'cloudComponent',
    position,
    data: {
      label,
      componentId: component.id,
      componentType: component.name, // Store component type (e.g., "EC2", "Lambda", "Fargate")
      provider: component.provider as 'aws' | 'azure' | 'gcp' | 'saas',
      category: component.category,
      icon: component.icon,
      isContainer: component.isContainer || false, // v1.0.0: Container support
      color: component.color, // Use component's defined color
    },
    // Container nodes stay in background (z-index 0), regular nodes on top (z-index 1)
    zIndex: component.isContainer ? 0 : 1,
  };

  // Set dimensions for container nodes (v1.0.0)
  if (component.isContainer && component.defaultWidth && component.defaultHeight) {
    node.style = {
      width: component.defaultWidth,
      height: component.defaultHeight,
    };
  }

  return node;
}

/**
 * Create a capability node
 *
 * @param id - Unique node ID
 * @param position - Node position on canvas
 * @param label - Node label
 * @param width - Optional custom width (default: 180)
 * @param height - Optional custom height (default: 100)
 * @returns Configured capability node
 */
export function createCapabilityNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  width?: number,
  height?: number
): Node<CapabilityNodeData> {
  return {
    id,
    type: 'capability',
    position,
    data: {
      label,
      width,
      height,
    },
    zIndex: 1, // Regular nodes on top
  };
}

/**
 * Create a graph node (v0.9.0)
 *
 * Represents a diagram in the graph view (meta-diagram).
 * Used to visualize all parent-child relationships between diagrams.
 *
 * @param id - Unique node ID
 * @param position - Node position on canvas
 * @param label - Diagram name
 * @param diagramPath - Path to the diagram file this node represents
 * @param diagramType - Type of the represented diagram
 * @param parentCount - Optional number of parent diagrams
 * @param childCount - Optional number of child diagrams
 * @returns Configured graph node
 */
export function createGraphNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  diagramPath: string,
  diagramType: 'context' | 'container' | 'component' | 'capability',
  parentCount?: number,
  childCount?: number
): Node<GraphNodeData> {
  return {
    id,
    type: 'graph',
    position,
    data: {
      label,
      diagramPath,
      diagramType,
      parentCount,
      childCount,
    },
    zIndex: 1, // Regular nodes on top
  };
}

/**
 * Create a generic node
 *
 * Flexible node creation for any node type with custom data.
 *
 * @param id - Unique node ID
 * @param type - Node type string
 * @param position - Node position on canvas
 * @param data - Node data (must include at least a label)
 * @returns Configured generic node
 */
export function createGenericNode(
  id: string,
  type: string,
  position: { x: number; y: number },
  data: Record<string, unknown> & { label: string }
): Node<CanvasNodeData> {
  return {
    id,
    type,
    position,
    data,
    zIndex: 1, // Regular nodes on top by default
  };
}
