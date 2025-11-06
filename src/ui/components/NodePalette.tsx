/**
 * Node Palette Component v3.0.0
 *
 * Shows existing nodes + create new options
 * Filtered by diagram type
 *
 * @version 3.0.0
 */

import * as React from 'react';
import { GlobalNode, DiagramType, getAllowedNodeTypes } from '../../types/graph-v3-types';

interface NodePaletteProps {
  diagramType: DiagramType;
  diagramPath: string;
  allNodes: GlobalNode[];
  currentNodeIds: string[]; // Nodes already on this diagram
  onAddExistingNode: (node: GlobalNode) => void;
  onCreateNewNode: (type: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({
  diagramType,
  allNodes,
  currentNodeIds,
  onAddExistingNode,
  onCreateNewNode,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  if (!isOpen) return null;

  const allowedTypes = getAllowedNodeTypes(diagramType);
  const currentNodeSet = new Set(currentNodeIds);

  // Filter nodes by type and search query
  const availableNodes = allNodes.filter(
    (node) =>
      allowedTypes.includes(node.type) &&
      !currentNodeSet.has(node.id) && // Not already on diagram
      (searchQuery === '' ||
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.technology?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get type labels
  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      person: '👤 Person',
      system: '🖥️ System',
      container: '📦 Container',
      component: '⚙️ Component',
      code: '💻 Code',
      market: '🌐 Market',
      organisation: '🏢 Organisation',
      capability: '🎯 Capability',
    };
    return labels[type] || type;
  };

  return (
    <div className="bac4-node-palette">
      <div className="bac4-node-palette-header">
        <h3>Node Palette</h3>
        <button onClick={onClose} className="bac4-close-btn">
          ×
        </button>
      </div>

      <div className="bac4-node-palette-search">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bac4-search-input"
        />
      </div>

      <div className="bac4-node-palette-content">
        {/* Create New Section */}
        <div className="bac4-palette-section">
          <h4>➕ Create New</h4>
          <div className="bac4-new-node-buttons">
            {allowedTypes.map((type) => (
              <button
                key={type}
                onClick={() => onCreateNewNode(type)}
                className="bac4-new-node-btn"
              >
                {getTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Existing Nodes Section */}
        <div className="bac4-palette-section">
          <h4>📦 Existing Nodes ({availableNodes.length})</h4>
          <div className="bac4-existing-nodes">
            {availableNodes.length === 0 ? (
              <p className="bac4-no-nodes">
                {searchQuery ? 'No nodes match your search' : 'No existing nodes available'}
              </p>
            ) : (
              availableNodes.map((node) => (
                <div key={node.id} className="bac4-node-card">
                  <div className="bac4-node-card-header">
                    <span className="bac4-node-icon" style={{ color: node.style.color }}>
                      {node.style.icon || getTypeLabel(node.type)}
                    </span>
                    <span className="bac4-node-label">{node.label}</span>
                  </div>
                  <div className="bac4-node-card-body">
                    <p className="bac4-node-type">Type: {node.type}</p>
                    {node.description && (
                      <p className="bac4-node-description">{node.description}</p>
                    )}
                    {node.technology && <p className="bac4-node-tech">Tech: {node.technology}</p>}
                  </div>
                  <button onClick={() => onAddExistingNode(node)} className="bac4-add-node-btn">
                    Add to Diagram
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .bac4-node-palette {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: 350px;
          background: var(--background-primary);
          border-left: 1px solid var(--background-modifier-border);
          display: flex;
          flex-direction: column;
          z-index: 1000;
        }

        .bac4-node-palette-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--background-modifier-border);
        }

        .bac4-node-palette-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .bac4-close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-muted);
        }

        .bac4-close-btn:hover {
          color: var(--text-normal);
        }

        .bac4-node-palette-search {
          padding: 12px 16px;
          border-bottom: 1px solid var(--background-modifier-border);
        }

        .bac4-search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--background-modifier-border);
          border-radius: 4px;
          background: var(--background-primary);
          color: var(--text-normal);
        }

        .bac4-node-palette-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .bac4-palette-section {
          margin-bottom: 24px;
        }

        .bac4-palette-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .bac4-new-node-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bac4-new-node-btn {
          padding: 10px 16px;
          background: var(--interactive-accent);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          text-align: left;
          transition: opacity 0.2s;
        }

        .bac4-new-node-btn:hover {
          opacity: 0.9;
        }

        .bac4-existing-nodes {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bac4-node-card {
          padding: 12px;
          border: 1px solid var(--background-modifier-border);
          border-radius: 6px;
          background: var(--background-secondary);
        }

        .bac4-node-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .bac4-node-icon {
          font-size: 18px;
        }

        .bac4-node-label {
          font-weight: 600;
          font-size: 14px;
        }

        .bac4-node-card-body {
          margin-bottom: 12px;
        }

        .bac4-node-type,
        .bac4-node-description,
        .bac4-node-tech {
          margin: 4px 0;
          font-size: 12px;
          color: var(--text-muted);
        }

        .bac4-node-description {
          color: var(--text-normal);
        }

        .bac4-add-node-btn {
          width: 100%;
          padding: 8px 12px;
          background: var(--background-primary);
          border: 1px solid var(--background-modifier-border);
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          color: var(--text-normal);
        }

        .bac4-add-node-btn:hover {
          background: var(--background-modifier-hover);
        }

        .bac4-no-nodes {
          padding: 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};
