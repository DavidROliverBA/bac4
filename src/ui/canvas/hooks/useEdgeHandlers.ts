/**
 * Edge Handlers Hook
 *
 * Custom React hook that manages all edge-related event handlers:
 * - Edge selection (click)
 * - Edge creation (connect)
 * - Edge label updates
 * - Edge direction updates
 * - Edge deletion
 *
 * @module useEdgeHandlers
 */

import * as React from 'react';
import type { Edge, Connection } from 'reactflow';
import { addEdge } from 'reactflow';
import type { EdgeData } from '../../../types/canvas-types';
import { getEdgeMarkers } from '../utils/canvas-utils';

export interface UseEdgeHandlersProps {
  setEdges: React.Dispatch<React.SetStateAction<Edge<EdgeData>[]>>;
  onEdgeSelect: (edge: Edge<EdgeData> | null) => void;
}

export interface EdgeHandlers {
  onConnect: (params: Connection) => void;
  onEdgeClick: (event: React.MouseEvent, edge: Edge<EdgeData>) => void;
  updateEdgeLabel: (edgeId: string, newLabel: string) => void;
  updateEdgeDirection: (edgeId: string, direction: 'right' | 'left' | 'both') => void;
  handleDeleteEdge: (edgeId: string) => void;
}

/**
 * Custom hook for edge event handlers
 *
 * @param props - Configuration options
 * @returns Object containing all edge handler functions
 */
export function useEdgeHandlers(props: UseEdgeHandlersProps): EdgeHandlers {
  const { setEdges, onEdgeSelect } = props;

  /**
   * Handle new edge connections
   */
  const onConnect = React.useCallback(
    (params: Connection) => {
      console.log('BAC4: onConnect params:', params);
      const direction = 'right';
      const markers = getEdgeMarkers(direction);

      const edge = {
        ...params,
        type: 'directional',
        animated: false,
        ...markers,
        data: {
          label: 'uses',
          direction,
        },
      };
      console.log('BAC4: Creating edge:', edge);
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  /**
   * Handle edge click (selection)
   */
  const onEdgeClick = React.useCallback(
    (_event: React.MouseEvent, edge: Edge<EdgeData>) => {
      onEdgeSelect(edge);
    },
    [onEdgeSelect]
  );

  /**
   * Update edge label
   */
  const updateEdgeLabel = React.useCallback(
    (edgeId: string, newLabel: string) => {
      let updatedEdge: Edge<EdgeData> | null = null;

      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            updatedEdge = {
              ...edge,
              data: { ...edge.data, label: newLabel },
            };
            return updatedEdge;
          }
          return edge;
        })
      );

      // Update selected edge if this is the selected edge
      if (updatedEdge) {
        onEdgeSelect(updatedEdge);
      }
    },
    [setEdges, onEdgeSelect]
  );

  /**
   * Update edge direction
   */
  const updateEdgeDirection = React.useCallback(
    (edgeId: string, direction: 'right' | 'left' | 'both') => {
      console.log('BAC4: updateEdgeDirection called', { edgeId, direction });
      const markers = getEdgeMarkers(direction);
      let updatedEdge: Edge<EdgeData> | null = null;

      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            console.log('BAC4: Found edge to update', {
              oldDirection: edge.data?.direction,
              newDirection: direction,
            });
            updatedEdge = {
              ...edge,
              ...markers,
              data: { ...edge.data, direction },
            };
            return updatedEdge;
          }
          return edge;
        })
      );

      // Update selected edge if this is the selected edge
      if (updatedEdge) {
        onEdgeSelect(updatedEdge);
      }
      console.log('BAC4: ✅ Updated edge direction and markers', markers);
    },
    [setEdges, onEdgeSelect]
  );

  /**
   * Delete edge
   */
  const handleDeleteEdge = React.useCallback(
    (edgeId: string) => {
      console.log('BAC4: Deleting edge', edgeId);
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    },
    [setEdges]
  );

  return {
    onConnect,
    onEdgeClick,
    updateEdgeLabel,
    updateEdgeDirection,
    handleDeleteEdge,
  };
}
