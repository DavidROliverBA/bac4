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
import type { EdgeData, DiagramType } from '../../../types/canvas-types';
import { getEdgeMarkers } from '../utils/canvas-utils';

export interface UseEdgeHandlersProps {
  setEdges: React.Dispatch<React.SetStateAction<Edge<EdgeData>[]>>;
  onEdgeSelect: (edge: Edge<EdgeData> | null) => void;
  diagramType?: DiagramType; // v2.5.0: Used to determine edge type (wardley vs directional)
}

export interface EdgeHandlers {
  onConnect: (params: Connection) => void;
  onEdgeClick: (event: React.MouseEvent, edge: Edge<EdgeData>) => void;
  updateEdgeLabel: (edgeId: string, newLabel: string) => void;
  updateEdgeDirection: (edgeId: string, direction: 'right' | 'left' | 'both') => void;
  updateEdgeStyle: (edgeId: string, style: 'diagonal' | 'rightAngle' | 'curved') => void;
  handleDeleteEdge: (edgeId: string) => void;
}

/**
 * Custom hook for edge event handlers
 *
 * @param props - Configuration options
 * @returns Object containing all edge handler functions
 */
export function useEdgeHandlers(props: UseEdgeHandlersProps): EdgeHandlers {
  const { setEdges, onEdgeSelect, diagramType } = props;

  /**
   * Handle new edge connections
   * v2.5.0: Creates 'wardley' edges for Wardley Maps, 'directional' for all others
   */
  const onConnect = React.useCallback(
    (params: Connection) => {
      console.log('BAC4: onConnect params:', params);

      // v2.5.0: Use 'wardley' edge type for Wardley Maps
      const edgeType = diagramType === 'wardley' ? 'wardley' : 'directional';
      const direction = 'right';
      const markers = getEdgeMarkers(direction);

      // v2.5.0: Default edge style (diagonal for Wardley, curved for others)
      const defaultStyle = diagramType === 'wardley' ? 'diagonal' : 'curved';

      const edge = {
        ...params,
        type: edgeType,
        animated: false,
        ...markers,
        data: {
          label: diagramType === 'wardley' ? '' : 'uses', // No default label for Wardley edges
          direction,
          style: defaultStyle, // v2.5.0: Default edge style
        },
      };
      console.log('BAC4: Creating edge:', edge);
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, diagramType]
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
   * Update edge style (v2.5.0)
   * Allows user to choose between diagonal, right-angle, or curved paths
   */
  const updateEdgeStyle = React.useCallback(
    (edgeId: string, style: 'diagonal' | 'rightAngle' | 'curved') => {
      console.log('BAC4: updateEdgeStyle called', { edgeId, style });
      let updatedEdge: Edge<EdgeData> | null = null;

      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            console.log('BAC4: Found edge to update', {
              oldStyle: edge.data?.style,
              newStyle: style,
            });
            updatedEdge = {
              ...edge,
              data: { ...edge.data, style },
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
      console.log('BAC4: ✅ Updated edge style');
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
    updateEdgeStyle,
    handleDeleteEdge,
  };
}
