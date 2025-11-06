/**
 * AnnotationService - Annotation management
 *
 * Handles creation, modification, and management of annotations.
 * Annotations are visual elements (text boxes, callouts, badges, highlights)
 * that explain changes and provide context to diagrams.
 *
 * @version 1.0.0
 * @see docs/v1.0.0-timeline-tracking-spec.md
 */

import { XYPosition } from 'reactflow';
import {
  Annotation,
  AnnotationType,
  AnnotationProperties,
  CreateAnnotationOptions,
  DEFAULT_ANNOTATION_PROPERTIES,
  BADGE_COLORS,
} from '../types/timeline';

/**
 * Service for managing annotations
 */
export class AnnotationService {
  /**
   * Generate a unique annotation ID
   */
  private static generateAnnotationId(): string {
    return `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default properties for an annotation type
   */
  private static getDefaultPropertiesForType(type: AnnotationType): Partial<AnnotationProperties> {
    switch (type) {
      case 'text-box':
        return {
          text: 'Add note here...',
          color: '#4A90E2',
          fontSize: 12,
        };

      case 'callout':
        return {
          text: 'Add explanation here...',
          color: '#4A90E2',
          fontSize: 11,
        };

      case 'badge-new':
        return {
          text: 'New',
          color: BADGE_COLORS.new,
          fontSize: 10,
        };

      case 'badge-modified':
        return {
          text: 'Modified',
          color: BADGE_COLORS.modified,
          fontSize: 10,
        };

      case 'badge-deprecated':
        return {
          text: 'Deprecated',
          color: BADGE_COLORS.deprecated,
          fontSize: 10,
        };

      case 'badge-remove':
        return {
          text: 'To Remove',
          color: BADGE_COLORS.remove,
          fontSize: 10,
        };

      case 'highlight-circle':
        return {
          text: '',
          color: '#FFD93D',
          width: 150,
          height: 150,
        };

      case 'highlight-rect':
        return {
          text: '',
          color: '#FFD93D',
          width: 200,
          height: 100,
        };

      default:
        return {};
    }
  }

  /**
   * Create a new annotation
   *
   * @param options - Annotation creation options
   * @returns New annotation
   */
  static createAnnotation(options: CreateAnnotationOptions): Annotation {
    const defaultProps = this.getDefaultPropertiesForType(options.type);

    const annotation: Annotation = {
      id: this.generateAnnotationId(),
      type: options.type,
      position: options.position,
      data: {
        ...DEFAULT_ANNOTATION_PROPERTIES,
        ...defaultProps,
        ...options.properties,
      },
    };

    console.log(
      `BAC4: Created ${options.type} annotation at (${options.position.x}, ${options.position.y})`
    );

    return annotation;
  }

  /**
   * Update annotation properties
   *
   * @param annotation - Annotation to update
   * @param updates - Properties to update
   * @returns Updated annotation
   */
  static updateAnnotation(
    annotation: Annotation,
    updates: Partial<AnnotationProperties>
  ): Annotation {
    console.log(`BAC4: Updating annotation (${annotation.id})`);

    return {
      ...annotation,
      data: {
        ...annotation.data,
        ...updates,
      },
    };
  }

  /**
   * Move annotation to new position
   *
   * @param annotation - Annotation to move
   * @param newPosition - New position
   * @returns Updated annotation
   */
  static moveAnnotation(annotation: Annotation, newPosition: XYPosition): Annotation {
    console.log(
      `BAC4: Moving annotation (${annotation.id}) to (${newPosition.x}, ${newPosition.y})`
    );

    return {
      ...annotation,
      position: newPosition,
    };
  }

  /**
   * Link annotation to a node (annotation will follow node movement)
   *
   * @param annotation - Annotation to link
   * @param nodeId - ID of node to link to
   * @returns Updated annotation
   */
  static linkAnnotationToNode(annotation: Annotation, nodeId: string): Annotation {
    console.log(`BAC4: Linking annotation (${annotation.id}) to node (${nodeId})`);

    return {
      ...annotation,
      data: {
        ...annotation.data,
        linkedNodeId: nodeId,
      },
    };
  }

  /**
   * Unlink annotation from node
   *
   * @param annotation - Annotation to unlink
   * @returns Updated annotation
   */
  static unlinkAnnotationFromNode(annotation: Annotation): Annotation {
    console.log(`BAC4: Unlinking annotation (${annotation.id}) from node`);

    return {
      ...annotation,
      data: {
        ...annotation.data,
        linkedNodeId: null,
      },
    };
  }

  /**
   * Get annotations for a specific snapshot
   *
   * Annotations are stored per-snapshot, so this filters the annotations
   * array for the given snapshot.
   *
   * @param allAnnotations - All annotations (from current snapshot)
   * @returns Annotations for the specified snapshot
   */
  static getAnnotationsForSnapshot(allAnnotations: Annotation[]): Annotation[] {
    // In our model, annotations are already snapshot-specific
    // This method is here for future filtering if needed
    return allAnnotations;
  }

  /**
   * Delete an annotation from a list
   *
   * @param annotationId - ID of annotation to delete
   * @param annotations - Current annotations list
   * @returns Updated annotations list
   */
  static deleteAnnotation(annotationId: string, annotations: Annotation[]): Annotation[] {
    console.log(`BAC4: Deleting annotation (${annotationId})`);

    return annotations.filter((a) => a.id !== annotationId);
  }

  /**
   * Find annotation by ID
   *
   * @param annotationId - Annotation ID
   * @param annotations - Annotations list
   * @returns Annotation, or null if not found
   */
  static getAnnotationById(annotationId: string, annotations: Annotation[]): Annotation | null {
    return annotations.find((a) => a.id === annotationId) || null;
  }

  /**
   * Get annotations linked to a specific node
   *
   * @param nodeId - Node ID
   * @param annotations - Annotations list
   * @returns Annotations linked to the node
   */
  static getAnnotationsForNode(nodeId: string, annotations: Annotation[]): Annotation[] {
    return annotations.filter((a) => a.data.linkedNodeId === nodeId);
  }

  /**
   * Update annotation positions when linked node moves
   *
   * When a node moves, all linked annotations should move with it.
   *
   * @param nodeId - ID of moved node
   * @param deltaX - Change in X position
   * @param deltaY - Change in Y position
   * @param annotations - Current annotations
   * @returns Updated annotations with adjusted positions
   */
  static updateLinkedAnnotationPositions(
    nodeId: string,
    deltaX: number,
    deltaY: number,
    annotations: Annotation[]
  ): Annotation[] {
    return annotations.map((annotation) => {
      if (annotation.data.linkedNodeId === nodeId) {
        return {
          ...annotation,
          position: {
            x: annotation.position.x + deltaX,
            y: annotation.position.y + deltaY,
          },
        };
      }
      return annotation;
    });
  }

  /**
   * Validate annotation properties
   *
   * @param properties - Properties to validate
   * @returns True if valid, false otherwise
   */
  static validateAnnotationProperties(properties: Partial<AnnotationProperties>): boolean {
    // Color must be valid hex code if provided
    if (properties.color && !/^#[0-9A-Fa-f]{6}$/.test(properties.color)) {
      console.warn(`BAC4: Invalid color format: ${properties.color}`);
      return false;
    }

    // Font size must be positive if provided
    if (properties.fontSize !== undefined && properties.fontSize <= 0) {
      console.warn(`BAC4: Invalid font size: ${properties.fontSize}`);
      return false;
    }

    // Width/height must be positive if provided
    if (properties.width !== undefined && properties.width <= 0) {
      console.warn(`BAC4: Invalid width: ${properties.width}`);
      return false;
    }

    if (properties.height !== undefined && properties.height <= 0) {
      console.warn(`BAC4: Invalid height: ${properties.height}`);
      return false;
    }

    return true;
  }

  /**
   * Clone an annotation (for duplication)
   *
   * @param annotation - Annotation to clone
   * @param offsetX - X offset for new annotation
   * @param offsetY - Y offset for new annotation
   * @returns New annotation
   */
  static cloneAnnotation(
    annotation: Annotation,
    offsetX: number = 20,
    offsetY: number = 20
  ): Annotation {
    return {
      ...annotation,
      id: this.generateAnnotationId(),
      position: {
        x: annotation.position.x + offsetX,
        y: annotation.position.y + offsetY,
      },
    };
  }

  /**
   * Get annotation summary (for logging/debugging)
   *
   * @param annotation - Annotation
   * @returns Human-readable summary
   */
  static getAnnotationSummary(annotation: Annotation): string {
    const { type, position, data } = annotation;
    const linkedNode = data.linkedNodeId ? ` (linked to ${data.linkedNodeId})` : '';
    return `${type} at (${position.x}, ${position.y})${linkedNode}: "${data.text}"`;
  }

  /**
   * Bulk create annotations
   *
   * Useful for programmatically generating multiple annotations
   * (e.g., from AI suggestions or templates)
   *
   * @param optionsList - Array of annotation creation options
   * @returns Array of new annotations
   */
  static bulkCreateAnnotations(optionsList: CreateAnnotationOptions[]): Annotation[] {
    console.log(`BAC4: Creating ${optionsList.length} annotations`);

    return optionsList.map((options) => this.createAnnotation(options));
  }

  /**
   * Bulk delete annotations
   *
   * @param annotationIds - IDs of annotations to delete
   * @param annotations - Current annotations list
   * @returns Updated annotations list
   */
  static bulkDeleteAnnotations(annotationIds: string[], annotations: Annotation[]): Annotation[] {
    console.log(`BAC4: Deleting ${annotationIds.length} annotations`);

    const idsToDelete = new Set(annotationIds);
    return annotations.filter((a) => !idsToDelete.has(a.id));
  }

  /**
   * Clear all annotations from node
   *
   * @param nodeId - Node ID
   * @param annotations - Current annotations
   * @returns Updated annotations (without node's annotations)
   */
  static clearNodeAnnotations(nodeId: string, annotations: Annotation[]): Annotation[] {
    console.log(`BAC4: Clearing annotations for node (${nodeId})`);

    return annotations.filter((a) => a.data.linkedNodeId !== nodeId);
  }
}
