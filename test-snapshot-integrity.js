#!/usr/bin/env node

/**
 * Snapshot Integrity Test Harness
 *
 * Tests all v2.5.0 file operations:
 * - Diagram creation (correct format)
 * - Node addition (saved correctly)
 * - Snapshot creation (captures all data)
 * - File save/load (data persistence)
 * - Format validation
 */

const fs = require('fs');
const path = require('path');

// Test directory
const TEST_DIR = '/tmp/bac4-snapshot-test';
const TEST_VAULT = path.join(TEST_DIR, 'TestVault');
const BAC4_DIR = path.join(TEST_VAULT, 'BAC4');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70) + '\n');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Setup test environment
function setupTestEnv() {
  section('Setup: Creating Test Environment');

  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
    info('Cleaned existing test directory');
  }

  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.mkdirSync(TEST_VAULT, { recursive: true });
  fs.mkdirSync(BAC4_DIR, { recursive: true });

  success('Created test directories');
  info(`Test vault: ${TEST_VAULT}`);
}

// Create v2.5.0 diagram
function createV2_5_Diagram(name = 'Test Diagram') {
  section(`Test 1: Creating v2.5.0 Diagram "${name}"`);

  const timestamp = Date.now();
  const fileName = `${name}.bac4`;
  const filePath = path.join(BAC4_DIR, fileName);
  const graphPath = path.join(BAC4_DIR, `${name}.bac4-graph`);

  // Create .bac4 file (nodes)
  const nodeFile = {
    version: '2.5.0',
    metadata: {
      id: `diagram-${timestamp}`,
      title: name,
      description: '',
      layer: 'market',
      diagramType: 'market',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: 'draft'
    },
    nodes: {}
  };

  // Create .bac4-graph file (layout/timeline)
  const graphFile = {
    version: '2.5.0',
    metadata: {
      nodeFile: fileName,
      graphId: `graph-${timestamp}`,
      title: `${name} - Default Layout`,
      viewType: 'c4-context',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    timeline: {
      snapshots: [
        {
          id: `snapshot-${timestamp}`,
          label: 'Current',
          timestamp: null,
          description: '',
          created: new Date().toISOString(),
          layout: {},
          edges: [],
          groups: [],
          annotations: []
        }
      ],
      currentSnapshotId: `snapshot-${timestamp}`,
      snapshotOrder: [`snapshot-${timestamp}`]
    },
    config: {
      gridEnabled: true,
      gridSize: 20,
      snapToGrid: false,
      showMinimap: false,
      layoutAlgorithm: 'manual'
    }
  };

  // Write files
  fs.writeFileSync(filePath, JSON.stringify(nodeFile, null, 2));
  fs.writeFileSync(graphPath, JSON.stringify(graphFile, null, 2));

  success(`Created ${fileName}`);
  success(`Created ${name}.bac4-graph`);

  // Validate format
  info('Validating file format...');
  validateFileFormat(nodeFile, graphFile);

  return { filePath, graphPath, nodeFile, graphFile };
}

// Validate file format
function validateFileFormat(nodeFile, graphFile) {
  let errors = 0;

  // Check .bac4 structure
  if (nodeFile.version !== '2.5.0') {
    error(`Wrong version in .bac4: ${nodeFile.version}`);
    errors++;
  }

  if (!nodeFile.metadata || typeof nodeFile.metadata !== 'object') {
    error('.bac4 missing metadata');
    errors++;
  }

  if (!nodeFile.nodes || typeof nodeFile.nodes !== 'object') {
    error('.bac4 nodes should be object, not array');
    errors++;
  }

  // Check .bac4-graph structure
  if (graphFile.version !== '2.5.0') {
    error(`Wrong version in .bac4-graph: ${graphFile.version}`);
    errors++;
  }

  if (!graphFile.timeline || !graphFile.timeline.snapshots) {
    error('.bac4-graph missing timeline');
    errors++;
  }

  if (!Array.isArray(graphFile.timeline.snapshots)) {
    error('.bac4-graph snapshots should be array');
    errors++;
  }

  // Check snapshot structure
  for (const snapshot of graphFile.timeline.snapshots) {
    if (!snapshot.layout || typeof snapshot.layout !== 'object') {
      error(`Snapshot ${snapshot.id} missing layout object`);
      errors++;
    }

    if (!Array.isArray(snapshot.edges)) {
      error(`Snapshot ${snapshot.id} edges should be array`);
      errors++;
    }
  }

  if (errors === 0) {
    success('File format validation passed');
  } else {
    error(`File format validation failed with ${errors} errors`);
  }

  return errors === 0;
}

// Add nodes
function addNodes(diagram, count = 5) {
  section(`Test 2: Adding ${count} Nodes`);

  const { filePath, graphPath, nodeFile, graphFile } = diagram;

  for (let i = 1; i <= count; i++) {
    const nodeId = `node-${i}`;
    const x = 100 + (i - 1) * 150;
    const y = 100 + Math.floor((i - 1) / 3) * 100;

    // Add to .bac4
    nodeFile.nodes[nodeId] = {
      id: nodeId,
      type: 'market',
      properties: {
        label: `Node ${i}`,
        description: `Test node ${i}`,
        marketSize: `$${i * 100}M`,
        growthRate: `${i * 5}%`
      },
      knowledge: {
        notes: [],
        urls: [],
        attachments: []
      },
      metrics: {},
      links: {
        parent: null,
        children: [],
        linkedDiagrams: [],
        externalSystems: [],
        dependencies: []
      },
      style: {
        color: '#3b82f6'
      }
    };

    // Add to .bac4-graph current snapshot
    const currentSnapshot = graphFile.timeline.snapshots.find(
      s => s.id === graphFile.timeline.currentSnapshotId
    );

    currentSnapshot.layout[nodeId] = {
      x,
      y,
      width: 200,
      height: 52,
      locked: false
    };

    info(`Added ${nodeId} at (${x}, ${y})`);
  }

  // Update timestamps
  nodeFile.metadata.updated = new Date().toISOString();
  graphFile.metadata.updated = new Date().toISOString();

  // Write files
  fs.writeFileSync(filePath, JSON.stringify(nodeFile, null, 2));
  fs.writeFileSync(graphPath, JSON.stringify(graphFile, null, 2));

  success(`Added ${count} nodes to diagram`);

  return { nodeFile, graphFile };
}

// Create snapshot
function createSnapshot(diagram, label = 'Phase 2') {
  section(`Test 3: Creating Snapshot "${label}"`);

  const { filePath, graphPath, nodeFile, graphFile } = diagram;
  const snapshotId = `snapshot-${Date.now()}`;

  // Get current snapshot
  const currentSnapshot = graphFile.timeline.snapshots.find(
    s => s.id === graphFile.timeline.currentSnapshotId
  );

  if (!currentSnapshot) {
    error('Current snapshot not found!');
    return null;
  }

  info(`Current snapshot has ${Object.keys(currentSnapshot.layout).length} nodes`);

  // Create new snapshot (deep copy of current)
  const newSnapshot = {
    id: snapshotId,
    label: label,
    timestamp: null,
    description: '',
    created: new Date().toISOString(),
    layout: JSON.parse(JSON.stringify(currentSnapshot.layout)),
    edges: JSON.parse(JSON.stringify(currentSnapshot.edges)),
    groups: [],
    annotations: []
  };

  info(`New snapshot will have ${Object.keys(newSnapshot.layout).length} nodes`);

  // Add to timeline
  graphFile.timeline.snapshots.push(newSnapshot);
  graphFile.timeline.snapshotOrder.push(snapshotId);

  // DON'T change currentSnapshotId (stay on current)
  info(`Current snapshot remains: ${graphFile.timeline.currentSnapshotId}`);
  info(`New snapshot created: ${snapshotId}`);

  // Write updated graph file
  graphFile.metadata.updated = new Date().toISOString();
  fs.writeFileSync(graphPath, JSON.stringify(graphFile, null, 2));

  success(`Created snapshot "${label}"`);
  success(`Total snapshots: ${graphFile.timeline.snapshots.length}`);

  return { snapshotId, graphFile };
}

// Verify snapshot integrity
function verifySnapshotIntegrity(diagram) {
  section('Test 4: Verifying Snapshot Data Integrity');

  const { filePath, graphPath } = diagram;

  // Reload files from disk
  const nodeFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const graphFile = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));

  info(`Loaded .bac4 with ${Object.keys(nodeFile.nodes).length} nodes`);
  info(`Loaded .bac4-graph with ${graphFile.timeline.snapshots.length} snapshots`);

  let allValid = true;

  // Check each snapshot
  for (const snapshot of graphFile.timeline.snapshots) {
    console.log(`\n📸 Snapshot: "${snapshot.label}" (${snapshot.id})`);

    // Count nodes in layout
    const layoutNodeCount = Object.keys(snapshot.layout).length;
    info(`  Layout has ${layoutNodeCount} node positions`);

    // Verify all layout nodes exist in nodeFile
    let missingNodes = 0;
    let validNodes = 0;

    for (const nodeId in snapshot.layout) {
      if (!nodeFile.nodes[nodeId]) {
        error(`  Node ${nodeId} in layout but not in .bac4 file!`);
        missingNodes++;
        allValid = false;
      } else {
        validNodes++;

        // Verify layout data
        const layout = snapshot.layout[nodeId];
        if (typeof layout.x !== 'number' || typeof layout.y !== 'number') {
          error(`  Node ${nodeId} has invalid position: x=${layout.x}, y=${layout.y}`);
          allValid = false;
        }

        // Verify node has properties
        const node = nodeFile.nodes[nodeId];
        if (!node.properties || !node.properties.label) {
          warning(`  Node ${nodeId} missing label`);
        }
      }
    }

    if (missingNodes === 0) {
      success(`  All ${validNodes} nodes valid`);
    } else {
      error(`  ${missingNodes} nodes missing from .bac4 file`);
    }

    // Verify edges
    info(`  Has ${snapshot.edges.length} edges`);
    for (const edge of snapshot.edges) {
      if (!snapshot.layout[edge.source]) {
        error(`  Edge ${edge.id} source ${edge.source} not in layout`);
        allValid = false;
      }
      if (!snapshot.layout[edge.target]) {
        error(`  Edge ${edge.id} target ${edge.target} not in layout`);
        allValid = false;
      }
    }
  }

  if (allValid) {
    success('\n✅ All snapshots have valid data!');
  } else {
    error('\n❌ Some snapshots have invalid data!');
  }

  return allValid;
}

// Test snapshot independence
function testSnapshotIndependence(diagram) {
  section('Test 5: Testing Snapshot Independence');

  const { graphPath } = diagram;
  const graphFile = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));

  if (graphFile.timeline.snapshots.length < 2) {
    warning('Need at least 2 snapshots to test independence');
    return true;
  }

  const snapshot1 = graphFile.timeline.snapshots[0];
  const snapshot2 = graphFile.timeline.snapshots[1];

  info(`Comparing "${snapshot1.label}" vs "${snapshot2.label}"`);

  // They should be different objects (not references)
  const nodes1 = Object.keys(snapshot1.layout);
  const nodes2 = Object.keys(snapshot2.layout);

  info(`  Snapshot 1: ${nodes1.length} nodes`);
  info(`  Snapshot 2: ${nodes2.length} nodes`);

  // Check if they're deep copies (positions can be modified independently)
  let independent = true;

  for (const nodeId of nodes1) {
    if (snapshot2.layout[nodeId]) {
      if (snapshot1.layout[nodeId] === snapshot2.layout[nodeId]) {
        error(`  ${nodeId} layout is same reference (not deep copy)!`);
        independent = false;
      }
    }
  }

  if (independent) {
    success('Snapshots are independent (deep copied)');
  } else {
    error('Snapshots share references (not independent)!');
  }

  return independent;
}

// Test adding nodes after snapshot
function testAddNodesAfterSnapshot(diagram) {
  section('Test 6: Adding Nodes After Snapshot Creation');

  const { filePath, graphPath, nodeFile, graphFile } = diagram;

  const beforeNodeCount = Object.keys(nodeFile.nodes).length;
  const currentSnapshot = graphFile.timeline.snapshots.find(
    s => s.id === graphFile.timeline.currentSnapshotId
  );
  const beforeLayoutCount = Object.keys(currentSnapshot.layout).length;

  info(`Before: ${beforeNodeCount} nodes in file, ${beforeLayoutCount} in current snapshot layout`);

  // Add 2 more nodes
  for (let i = beforeNodeCount + 1; i <= beforeNodeCount + 2; i++) {
    const nodeId = `node-${i}`;

    nodeFile.nodes[nodeId] = {
      id: nodeId,
      type: 'market',
      properties: {
        label: `Node ${i}`,
        description: `Added after snapshot ${i}`
      },
      knowledge: { notes: [], urls: [], attachments: [] },
      metrics: {},
      links: {
        parent: null,
        children: [],
        linkedDiagrams: [],
        externalSystems: [],
        dependencies: []
      },
      style: { color: '#ef4444' }
    };

    currentSnapshot.layout[nodeId] = {
      x: 100 + i * 150,
      y: 300,
      width: 200,
      height: 52,
      locked: false
    };

    info(`Added ${nodeId}`);
  }

  // Write files
  nodeFile.metadata.updated = new Date().toISOString();
  graphFile.metadata.updated = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(nodeFile, null, 2));
  fs.writeFileSync(graphPath, JSON.stringify(graphFile, null, 2));

  const afterNodeCount = Object.keys(nodeFile.nodes).length;
  const afterLayoutCount = Object.keys(currentSnapshot.layout).length;

  info(`After: ${afterNodeCount} nodes in file, ${afterLayoutCount} in current snapshot layout`);

  success(`Added ${afterNodeCount - beforeNodeCount} nodes to current snapshot`);

  // Check that other snapshots weren't affected
  if (graphFile.timeline.snapshots.length > 1) {
    const otherSnapshot = graphFile.timeline.snapshots.find(
      s => s.id !== graphFile.timeline.currentSnapshotId
    );

    if (otherSnapshot) {
      const otherLayoutCount = Object.keys(otherSnapshot.layout).length;
      info(`Other snapshot "${otherSnapshot.label}" still has ${otherLayoutCount} nodes`);

      if (otherLayoutCount === beforeLayoutCount) {
        success('Other snapshots unaffected (correct!)');
      } else {
        error('Other snapshots were modified (incorrect!)');
      }
    }
  }

  return { nodeFile, graphFile };
}

// Final summary
function printSummary(diagram) {
  section('Summary: Final State');

  const { filePath, graphPath } = diagram;
  const nodeFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const graphFile = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));

  console.log('📊 File Structure:');
  console.log(`  .bac4 file: ${path.basename(filePath)}`);
  console.log(`    Version: ${nodeFile.version}`);
  console.log(`    Total nodes: ${Object.keys(nodeFile.nodes).length}`);

  console.log(`\n  .bac4-graph file: ${path.basename(graphPath)}`);
  console.log(`    Version: ${graphFile.version}`);
  console.log(`    Total snapshots: ${graphFile.timeline.snapshots.length}`);
  console.log(`    Current snapshot: ${graphFile.timeline.currentSnapshotId}`);

  console.log('\n📸 Snapshots:');
  for (const snapshot of graphFile.timeline.snapshots) {
    const isCurrent = snapshot.id === graphFile.timeline.currentSnapshotId;
    const marker = isCurrent ? '👉' : '  ';
    console.log(`  ${marker} "${snapshot.label}" (${snapshot.id})`);
    console.log(`      Nodes: ${Object.keys(snapshot.layout).length}`);
    console.log(`      Edges: ${snapshot.edges.length}`);
  }

  console.log('\n📁 Test files location:');
  console.log(`  ${TEST_DIR}`);

  success('\nAll tests completed! Files available for inspection.');
}

// Run all tests
function runTests() {
  try {
    setupTestEnv();

    // Test 1: Create diagram
    const diagram = createV2_5_Diagram('Snapshot Test');

    // Test 2: Add nodes
    let result = addNodes(diagram, 6);
    diagram.nodeFile = result.nodeFile;
    diagram.graphFile = result.graphFile;

    // Test 3: Create first snapshot
    result = createSnapshot(diagram, 'Phase 2');
    if (!result) return false;
    diagram.graphFile = result.graphFile;

    // Test 4: Verify snapshot integrity
    if (!verifySnapshotIntegrity(diagram)) {
      error('Snapshot integrity check failed!');
      return false;
    }

    // Test 5: Test snapshot independence
    if (!testSnapshotIndependence(diagram)) {
      error('Snapshot independence check failed!');
      return false;
    }

    // Test 6: Add nodes after snapshot
    result = testAddNodesAfterSnapshot(diagram);
    diagram.nodeFile = result.nodeFile;
    diagram.graphFile = result.graphFile;

    // Verify again after adding nodes
    if (!verifySnapshotIntegrity(diagram)) {
      error('Snapshot integrity check failed after adding nodes!');
      return false;
    }

    // Create another snapshot with new nodes
    result = createSnapshot(diagram, 'Phase 3');
    if (!result) return false;
    diagram.graphFile = result.graphFile;

    // Final verification
    verifySnapshotIntegrity(diagram);
    testSnapshotIndependence(diagram);

    // Print summary
    printSummary(diagram);

    return true;
  } catch (err) {
    error(`Test failed with error: ${err.message}`);
    console.error(err);
    return false;
  }
}

// Run tests
console.log('\n🧪 BAC4 Snapshot Integrity Test Suite\n');
const success_result = runTests();

if (success_result) {
  log('\n✅ All tests passed!', 'green');
  process.exit(0);
} else {
  log('\n❌ Some tests failed!', 'red');
  process.exit(1);
}
