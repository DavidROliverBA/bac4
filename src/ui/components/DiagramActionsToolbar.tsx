/**
 * Diagram Actions Toolbar
 * Provides common actions for diagram manipulation
 */

import * as React from 'react';
import { Node, useReactFlow } from 'reactflow';
import { toPng, toJpeg } from 'html-to-image';

interface DiagramActionsToolbarProps {
  selectedNode: Node | null;
  onDeleteNode: () => void;
  onRenameDiagram?: () => void;
  diagramName?: string;
}

export const DiagramActionsToolbar: React.FC<DiagramActionsToolbarProps> = ({
  selectedNode,
  onDeleteNode,
  onRenameDiagram,
  diagramName = 'diagram',
}) => {
  const { getNodes } = useReactFlow();

  // Export diagram as JPEG
  const handleExportJPEG = React.useCallback(() => {
    const nodes = getNodes();
    if (nodes.length === 0) {
      alert('No nodes to export');
      return;
    }

    // Try to find the React Flow container (not viewport)
    const flowContainer = document.querySelector('.react-flow') as HTMLElement;
    if (!flowContainer) {
      console.error('Could not find React Flow container');
      alert('Failed to find diagram container');
      return;
    }

    console.log('BAC4: Exporting JPEG from .react-flow container');

    // Add a small delay to ensure rendering is complete
    setTimeout(() => {
      toJpeg(flowContainer, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 2, // Higher resolution
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `${diagramName}.jpg`;
          link.href = dataUrl;
          link.click();
          console.log('BAC4: ✅ JPEG export successful');
        })
        .catch((error) => {
          console.error('BAC4: ❌ Error exporting JPEG:', error);
          alert('Failed to export diagram as JPEG. Check console for details.');
        });
    }, 100);
  }, [getNodes, diagramName]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        background: 'var(--background-primary)',
        border: '1px solid var(--background-modifier-border)',
        borderRadius: '6px',
        minWidth: '200px',
        maxWidth: '250px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Rename Diagram */}
      {onRenameDiagram && (
        <button
          onClick={onRenameDiagram}
          title="Rename this diagram"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'var(--interactive-normal)',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '4px',
            color: 'var(--text-normal)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            width: '100%',
            justifyContent: 'flex-start',
          }}
        >
          <span>✏️</span>
          <span>Rename</span>
        </button>
      )}

      {/* Save as JPEG */}
      <button
        onClick={handleExportJPEG}
        title="Export diagram as JPEG"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          background: 'var(--interactive-normal)',
          border: '1px solid var(--background-modifier-border)',
          borderRadius: '4px',
          color: 'var(--text-normal)',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          width: '100%',
          justifyContent: 'flex-start',
        }}
      >
        <span>💾</span>
        <span>Export JPEG</span>
      </button>

      {/* Delete Node */}
      <button
        onClick={onDeleteNode}
        disabled={!selectedNode}
        title={selectedNode ? `Delete node: ${selectedNode.data.label}` : 'Select a node to delete'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          background: selectedNode ? 'rgba(220, 38, 38, 0.1)' : 'var(--background-secondary)',
          border: selectedNode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid var(--background-modifier-border)',
          borderRadius: '4px',
          color: selectedNode ? 'rgb(220, 38, 38)' : 'var(--text-muted)',
          cursor: selectedNode ? 'pointer' : 'not-allowed',
          fontSize: '13px',
          fontWeight: 500,
          opacity: selectedNode ? 1 : 0.5,
          width: '100%',
          justifyContent: 'flex-start',
        }}
      >
        <span>🗑️</span>
        <span>Delete Node</span>
      </button>

    </div>
  );
};
