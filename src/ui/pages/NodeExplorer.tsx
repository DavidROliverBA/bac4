/**
 * Node Explorer Page v3.0.0
 *
 * Browse all nodes in __graph__.json
 * View relationships graphically
 * Multi-select and filter
 *
 * @version 3.0.0
 */

import * as React from 'react';
import { GlobalNode, GlobalEdge, NodeType } from '../../types/graph-v3-types';

interface NodeExplorerProps {
  nodes: GlobalNode[];
  edges: GlobalEdge[];
  onDeleteNodes: (nodeIds: string[]) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const NodeExplorer: React.FC<NodeExplorerProps> = ({
  nodes,
  edges,
  onDeleteNodes,
  onRefresh,
}) => {
  const [selectedNodeIds, setSelectedNodeIds] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<NodeType | 'all'>('all');
  const [sortBy, setSortBy] = React.useState<'name' | 'type' | 'usage'>('name');

  // Count node usage (how many edges involve each node)
  const getNodeUsage = (nodeId: string): number => {
    return edges.filter((edge) => edge.source === nodeId || edge.target === nodeId).length;
  };

  // Filter and sort nodes
  const filteredNodes = React.useMemo(() => {
    let result = nodes;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (node) =>
          node.label.toLowerCase().includes(query) ||
          node.description.toLowerCase().includes(query) ||
          node.technology?.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((node) => node.type === filterType);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.label.localeCompare(b.label);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'usage':
          return getNodeUsage(b.id) - getNodeUsage(a.id);
        default:
          return 0;
      }
    });

    return result;
  }, [nodes, searchQuery, filterType, sortBy, edges]);

  // Get edges for selected nodes
  const selectedEdges = React.useMemo(() => {
    return edges.filter(
      (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );
  }, [edges, selectedNodeIds]);

  // Toggle node selection
  const toggleNode = (nodeId: string) => {
    const newSet = new Set(selectedNodeIds);
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId);
    } else {
      newSet.add(nodeId);
    }
    setSelectedNodeIds(newSet);
  };

  // Select all/none
  const toggleSelectAll = () => {
    if (selectedNodeIds.size === filteredNodes.length) {
      setSelectedNodeIds(new Set());
    } else {
      setSelectedNodeIds(new Set(filteredNodes.map((n) => n.id)));
    }
  };

  // Delete selected nodes
  const handleDelete = async () => {
    if (selectedNodeIds.size === 0) return;

    const confirmed = confirm(
      `Delete ${selectedNodeIds.size} node${selectedNodeIds.size !== 1 ? 's' : ''}? This will remove them from all diagrams.`
    );

    if (confirmed) {
      await onDeleteNodes(Array.from(selectedNodeIds));
      setSelectedNodeIds(new Set());
      await onRefresh();
    }
  };

  return (
    <div className="bac4-node-explorer">
      {/* Header */}
      <div className="bac4-explorer-header">
        <h2>Node Explorer</h2>
        <div className="bac4-explorer-actions">
          <button onClick={onRefresh} className="bac4-btn">
            🔄 Refresh
          </button>
          <button onClick={() => {}} className="bac4-btn">
            📤 Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bac4-explorer-controls">
        <input
          type="text"
          placeholder="🔍 Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bac4-search"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="bac4-select"
        >
          <option value="all">All Types</option>
          <option value="person">Person</option>
          <option value="system">System</option>
          <option value="container">Container</option>
          <option value="component">Component</option>
          <option value="code">Code</option>
          <option value="market">Market</option>
          <option value="organisation">Organisation</option>
          <option value="capability">Capability</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bac4-select"
        >
          <option value="name">Sort by Name</option>
          <option value="type">Sort by Type</option>
          <option value="usage">Sort by Usage</option>
        </select>

        <label className="bac4-select-all">
          <input
            type="checkbox"
            checked={selectedNodeIds.size === filteredNodes.length && filteredNodes.length > 0}
            onChange={toggleSelectAll}
          />
          Select All ({selectedNodeIds.size} selected)
        </label>
      </div>

      {/* Main Content */}
      <div className="bac4-explorer-content">
        {/* Node List */}
        <div className="bac4-node-list">
          <h3>Nodes ({filteredNodes.length})</h3>

          {filteredNodes.length === 0 ? (
            <p className="bac4-empty">No nodes found</p>
          ) : (
            filteredNodes.map((node) => (
              <div
                key={node.id}
                className={`bac4-node-item ${selectedNodeIds.has(node.id) ? 'selected' : ''}`}
                onClick={() => toggleNode(node.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedNodeIds.has(node.id)}
                  onChange={() => {}}
                  className="bac4-checkbox"
                />
                <div className="bac4-node-info">
                  <div className="bac4-node-name" style={{ color: node.style.color }}>
                    {node.label}
                  </div>
                  <div className="bac4-node-meta">
                    Type: {node.type} • Edges: {getNodeUsage(node.id)}
                  </div>
                  {node.technology && <div className="bac4-node-tech">Tech: {node.technology}</div>}
                </div>
              </div>
            ))
          )}

          {selectedNodeIds.size > 0 && (
            <button onClick={handleDelete} className="bac4-delete-btn">
              🗑️ Delete Selected Nodes
            </button>
          )}
        </div>

        {/* Relationship Graph */}
        <div className="bac4-relationship-graph">
          <h3>Relationship Graph</h3>

          {selectedNodeIds.size === 0 ? (
            <div className="bac4-empty">Select nodes to view relationships</div>
          ) : (
            <div className="bac4-graph-view">
              <div className="bac4-graph-info">
                Showing {selectedNodeIds.size} nodes, {selectedEdges.length} edges
              </div>

              <div className="bac4-graph-placeholder">
                <p>📊 Graph visualization coming soon</p>
                <p>Selected nodes: {Array.from(selectedNodeIds).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .bac4-node-explorer {
          padding: 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .bac4-explorer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .bac4-explorer-header h2 {
          margin: 0;
        }

        .bac4-explorer-actions {
          display: flex;
          gap: 8px;
        }

        .bac4-btn {
          padding: 8px 16px;
          background: var(--interactive-accent);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .bac4-btn:hover {
          opacity: 0.9;
        }

        .bac4-explorer-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          align-items: center;
        }

        .bac4-search {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--background-modifier-border);
          border-radius: 4px;
          background: var(--background-primary);
        }

        .bac4-select {
          padding: 8px 12px;
          border: 1px solid var(--background-modifier-border);
          border-radius: 4px;
          background: var(--background-primary);
        }

        .bac4-select-all {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .bac4-explorer-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          overflow: hidden;
        }

        .bac4-node-list,
        .bac4-relationship-graph {
          border: 1px solid var(--background-modifier-border);
          border-radius: 8px;
          padding: 16px;
          overflow-y: auto;
        }

        .bac4-node-list h3,
        .bac4-relationship-graph h3 {
          margin: 0 0 16px 0;
        }

        .bac4-node-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--background-modifier-border);
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .bac4-node-item:hover {
          background: var(--background-modifier-hover);
        }

        .bac4-node-item.selected {
          background: var(--background-modifier-active-hover);
          border-color: var(--interactive-accent);
        }

        .bac4-checkbox {
          cursor: pointer;
        }

        .bac4-node-info {
          flex: 1;
        }

        .bac4-node-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .bac4-node-meta,
        .bac4-node-tech {
          font-size: 12px;
          color: var(--text-muted);
        }

        .bac4-delete-btn {
          width: 100%;
          padding: 12px;
          margin-top: 16px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .bac4-delete-btn:hover {
          opacity: 0.9;
        }

        .bac4-empty {
          text-align: center;
          color: var(--text-muted);
          padding: 40px 20px;
        }

        .bac4-graph-view {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .bac4-graph-info {
          margin-bottom: 16px;
          padding: 8px 12px;
          background: var(--background-secondary);
          border-radius: 4px;
          font-size: 13px;
        }

        .bac4-graph-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--background-modifier-border);
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }

        .bac4-graph-placeholder p {
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
};
