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
      hasChildDiagram: false,
    },
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
  };
}

/**
 * Create a container node
 *
 * @param id - Unique node ID
 * @param position - Node position on canvas
 * @param label - Node label
 * @param containerType - Type of container (webapp, api, database, etc.)
 * @param technology - Technology stack (optional)
 * @returns Configured container node
 */
export function createContainerNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  containerType?: 'webapp' | 'mobileapp' | 'api' | 'database' | 'queue',
  technology?: string
): Node<ContainerNodeData> {
  return {
    id,
    type: 'container',
    position,
    data: {
      label,
      containerType,
      technology,
      hasChildDiagram: false,
    },
  };
}

/**
 * Create a cloud component node
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
  return {
    id,
    type: 'cloudComponent',
    position,
    data: {
      label,
      component,
      properties: { ...component.defaultProps },
    },
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
  };
}
