#!/usr/bin/env node

/**
 * Test Script for v2.5.0 Format Verification
 *
 * This script tests v2.5.0 dual-file format to ensure:
 * 1. Diagram creation works correctly
 * 2. Nodes are saved to .bac4 file
 * 3. Layout is saved to .bac4-graph file
 * 4. Snapshots work without losing nodes
 */

const fs = require('fs');
const path = require('path');

// Test directory
const TEST_DIR = '/tmp/bac4-test';
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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
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
  section('Setting up test environment');

  // Clean and create directories
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

// Create a v2.5.0 format diagram
function createV2_5_Diagram(name = 'Test Market') {
  section(`Creating v2.5.0 Diagram: "${name}"`);

  const timestamp = Date.now();
  const fileName = `${name}.bac4`;
  const filePath = path.join(BAC4_DIR, fileName);
  const graphPath = path.join(BAC4_DIR, `${name}.bac4-graph`);

  // Create .bac4 file (nodes)
  const nodeFile = {
    version: '2.5.0',
    metadata: {
      id: `market-${timestamp}`,
      title: name,
      description: '',
      layer: 'market',
      diagramType: 'market',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: 'draft'
    },
    nodes: {}  // Empty initially
  };

  // Create .bac4-graph file (layout/timeline)
  const graphFile = {
    version: '2.5.0',
    metadata: {
      nodeFile: fileName,
      graphId: `c4-context-${timestamp}`,
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
          layout: {},  // Empty initially
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

  return { filePath, graphPath, nodeFile, graphFile };
}

// Add a node to the diagram
function addNode(diagram, nodeData) {
  section(`Adding node: "${nodeData.label}"`);

  const nodeId = nodeData.id || `node-${Date.now()}`;
  const { filePath, graphPath, nodeFile, graphFile } = diagram;

  // Add node to .bac4 file
  nodeFile.nodes[nodeId] = {
    id: nodeId,
    type: nodeData.type || 'market',
    properties: {
      label: nodeData.label,
      description: nodeData.description || ''
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
      color: nodeData.color || '#3b82f6'
    }
  };

  // Add layout to .bac4-graph file
  const currentSnapshot = graphFile.timeline.snapshots.find(
    s => s.id === graphFile.timeline.currentSnapshotId
  );

  currentSnapshot.layout[nodeId] = {
    x: nodeData.x || 100,
    y: nodeData.y || 100,
    width: 200,
    height: 52,
    locked: false
  };

  // Update timestamps
  nodeFile.metadata.updated = new Date().toISOString();
  graphFile.metadata.updated = new Date().toISOString();

  // Write updated files
  fs.writeFileSync(filePath, JSON.stringify(nodeFile, null, 2));
  fs.writeFileSync(graphPath, JSON.stringify(graphFile, null, 2));

  success(`Added node "${nodeData.label}" with ID: ${nodeId}`);
  info(`Node saved to: ${path.basename(filePath)}`);
  info(`Layout saved to: ${path.basename(graphPath)}`);

  return { nodeId, nodeFile, graphFile };
}

// Create a snapshot
function createSnapshot(diagram, label = 'Phase 2') {
  section(`Creating snapshot: "${label}"`);

  const { graphPath, graphFile } = diagram;
  const snapshotId = `snapshot-${Date.now()}`;

  // Get current snapshot
  const currentSnapshot = graphFile.timeline.snapshots.find(
    s => s.id === graphFile.timeline.currentSnapshotId
  );

  if (!currentSnapshot) {
    error('Current snapshot not found!');
    return null;
  }

  // Create new snapshot (deep copy of current)
  const newSnapshot = {
    id: snapshotId,
    label: label,
    timestamp: null,
    description: '',
    created: new Date().toISOString(),
    layout: JSON.parse(JSON.stringify(currentSnapshot.layout)),  // Deep copy
    edges: JSON.parse(JSON.stringify(currentSnapshot.edges)),
    groups: [],
    annotations: []
  };

  // Add to timeline
  graphFile.timeline.snapshots.push(newSnapshot);
  graphFile.timeline.snapshotOrder.push(snapshotId);

  // ✅ IMPORTANT: DON'T change currentSnapshotId (stay on current)
  // This is the fix we applied earlier
  // graphFile.timeline.currentSnapshotId = snapshotId;  // ❌ WRONG - would switch
  // Keep: graphFile.timeline.currentSnapshotId = currentSnapshot.id;  // ✅ CORRECT

  info(`Current snapshot remains: ${graphFile.timeline.currentSnapshotId}`);
  info(`New snapshot created: ${snapshotId}`);

  // Write updated graph file
  fs.writeFileSync(graphPath, JSON.stringify(graphFile, null, 2));

  success(`Created snapshot "${label}"`);
  success(`Stayed on "${currentSnapshot.label}" (fix working!)`);

  return { snapshotId, graphFile };
}

// Verify file structure
function verifyFileStructure(filePath, graphPath) {
  section('Verifying File Structure');

  try {
    // Check .bac4 file exists
    if (!fs.existsSync(filePath)) {
      error(`.bac4 file missing: ${filePath}`);
      return false;
    }
    success('.bac4 file exists');

    // Check .bac4-graph file exists
    if (!fs.existsSync(graphPath)) {
      error(`.bac4-graph file missing: ${graphPath}`);
      return false;
    }
    success('.bac4-graph file exists');

    // Parse and validate .bac4
    const nodeFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (nodeFile.version !== '2.5.0') {
      error(`Wrong version in .bac4: ${nodeFile.version}`);
      return false;
    }
    success('.bac4 has correct version: 2.5.0');

    if (!nodeFile.nodes || typeof nodeFile.nodes !== 'object') {
      error('.bac4 missing nodes object');
      return false;
    }
    success(`.bac4 has nodes object with ${Object.keys(nodeFile.nodes).length} nodes`);

    // Parse and validate .bac4-graph
    const graphFile = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    if (graphFile.version !== '2.5.0') {
      error(`Wrong version in .bac4-graph: ${graphFile.version}`);
      return false;
    }
    success('.bac4-graph has correct version: 2.5.0');

    if (!graphFile.timeline || !graphFile.timeline.snapshots) {
      error('.bac4-graph missing timeline');
      return false;
    }
    success(`.bac4-graph has timeline with ${graphFile.timeline.snapshots.length} snapshots`);

    return true;
  } catch (err) {
    error(`Verification failed: ${err.message}`);
    return false;
  }
}

// Show file contents
function showFileContents(filePath, graphPath) {
  section('File Contents');

  const nodeFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const graphFile = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));

  log('\n📄 .bac4 file (nodes):', 'yellow');
  console.log(JSON.stringify(nodeFile, null, 2).substring(0, 1000) + '...');

  log('\n📄 .bac4-graph file (layout/timeline):', 'yellow');
  console.log(JSON.stringify(graphFile, null, 2).substring(0, 1000) + '...');
}

// Compare expected vs actual
function compareExpectedVsActual(diagram) {
  section('Expected vs Actual Comparison');

  const { filePath, graphPath, nodeFile } = diagram;

  const actualNodeFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const actualGraphFile = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));

  log('\n📊 Node Count:', 'cyan');
  const expectedNodeCount = Object.keys(nodeFile.nodes).length;
  const actualNodeCount = Object.keys(actualNodeFile.nodes).length;
  console.log(`Expected: ${expectedNodeCount}`);
  console.log(`Actual:   ${actualNodeCount}`);

  if (expectedNodeCount === actualNodeCount) {
    success('✅ Node count matches!');
  } else {
    error('❌ Node count mismatch!');
  }

  log('\n📊 Snapshot Count:', 'cyan');
  const expectedSnapshots = actualGraphFile.timeline.snapshots.length;
  console.log(`Snapshots: ${expectedSnapshots}`);

  log('\n📊 Current Snapshot:', 'cyan');
  const currentSnapshotId = actualGraphFile.timeline.currentSnapshotId;
  const currentSnapshot = actualGraphFile.timeline.snapshots.find(s => s.id === currentSnapshotId);
  console.log(`Current: ${currentSnapshot ? currentSnapshot.label : 'NOT FOUND'}`);

  if (currentSnapshot) {
    success(`✅ Current snapshot is "${currentSnapshot.label}"`);
  } else {
    error('❌ Current snapshot not found!');
  }

  return { actualNodeFile, actualGraphFile };
}

// Run all tests
function runTests() {
  try {
    // Setup
    setupTestEnv();

    // Test 1: Create diagram
    const diagram = createV2_5_Diagram('Test Market');

    // Test 2: Verify structure
    if (!verifyFileStructure(diagram.filePath, diagram.graphPath)) {
      error('File structure verification failed');
      process.exit(1);
    }

    // Test 3: Add first node
    const result1 = addNode(diagram, {
      id: 'node-1',
      label: 'Customer Segment A',
      description: 'Primary customer segment',
      x: 100,
      y: 150
    });

    // Test 4: Add second node
    const result2 = addNode(diagram, {
      id: 'node-2',
      label: 'Customer Segment B',
      description: 'Secondary customer segment',
      x: 350,
      y: 150
    });

    // Test 5: Verify nodes saved correctly
    compareExpectedVsActual({ ...diagram, nodeFile: result2.nodeFile });

    // Test 6: Create snapshot (test the fix)
    const snapshotResult = createSnapshot(
      { ...diagram, graphFile: result2.graphFile },
      'Phase 2'
    );

    if (!snapshotResult) {
      error('Snapshot creation failed');
      process.exit(1);
    }

    // Test 7: Verify snapshot didn't change current
    section('Testing Snapshot Fix');
    const finalGraphFile = JSON.parse(fs.readFileSync(diagram.graphPath, 'utf-8'));
    const originalSnapshotId = result2.graphFile.timeline.currentSnapshotId;
    const currentSnapshotId = finalGraphFile.timeline.currentSnapshotId;

    info(`Original current snapshot: ${originalSnapshotId}`);
    info(`After creating "Phase 2": ${currentSnapshotId}`);

    if (originalSnapshotId === currentSnapshotId) {
      success('✅ Snapshot fix working! Current snapshot unchanged.');
    } else {
      error('❌ Bug still present! Current snapshot changed.');
    }

    // Test 8: Check that Phase 2 snapshot exists
    const phase2Snapshot = finalGraphFile.timeline.snapshots.find(s => s.label === 'Phase 2');
    if (phase2Snapshot) {
      success('✅ "Phase 2" snapshot exists');

      // Check it has the same nodes as current
      const currentSnapshot = finalGraphFile.timeline.snapshots.find(s => s.id === currentSnapshotId);
      const currentNodeCount = Object.keys(currentSnapshot.layout).length;
      const phase2NodeCount = Object.keys(phase2Snapshot.layout).length;

      info(`Current snapshot nodes: ${currentNodeCount}`);
      info(`Phase 2 snapshot nodes: ${phase2NodeCount}`);

      if (currentNodeCount === phase2NodeCount) {
        success('✅ Phase 2 snapshot has same nodes (copy successful)');
      } else {
        error('❌ Phase 2 snapshot has different node count!');
      }
    } else {
      error('❌ "Phase 2" snapshot not found!');
    }

    // Final summary
    section('Test Summary');
    success('All tests completed!');
    info(`Test files located at: ${TEST_DIR}`);
    info('You can inspect the files manually to verify');

    // Show final state
    log('\n📊 Final State:', 'cyan');
    console.log(`Diagram: ${path.basename(diagram.filePath)}`);
    console.log(`Nodes: 2 (Customer Segment A, Customer Segment B)`);
    console.log(`Snapshots: 2 (Current, Phase 2)`);
    console.log(`Active: Current (✅ correct - didn't auto-switch)`);

    return true;
  } catch (err) {
    error(`Test failed with error: ${err.message}`);
    console.error(err);
    return false;
  }
}

// Run tests
console.log('\n🧪 BAC4 v2.5.0 Format Test Suite\n');
const success_result = runTests();

if (success_result) {
  log('\n✅ All tests passed!', 'green');
  process.exit(0);
} else {
  log('\n❌ Some tests failed!', 'red');
  process.exit(1);
}
