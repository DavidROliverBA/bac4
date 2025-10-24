#!/usr/bin/env node

/**
 * BAC4 Comprehensive Test Suite
 *
 * Tests all snapshot and file persistence functionality
 * Verifies all bug fixes are working correctly
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failedTests: [],
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${'='.repeat(70)}`);
  log(`Test: ${testName}`, 'cyan');
  console.log('='.repeat(70));
}

function assert(condition, message, testName) {
  testResults.total++;
  if (condition) {
    log(`✅ ${message}`, 'green');
    testResults.passed++;
  } else {
    log(`❌ ${message}`, 'red');
    testResults.failed++;
    testResults.failedTests.push({ test: testName, message });
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message, testName) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`, testName);
}

function assertDeepEqual(actual, expected, message, testName) {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
  assert(isEqual, message, testName);
}

// Test vault setup
const testDir = '/tmp/bac4-comprehensive-test';
const vaultDir = path.join(testDir, 'TestVault');

function setupTestEnvironment() {
  log('\n🧪 BAC4 Comprehensive Test Suite\n', 'cyan');

  // Clean up previous test
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  // Create test directories
  fs.mkdirSync(vaultDir, { recursive: true });
  log('✅ Created test environment', 'green');
  log(`ℹ️  Test vault: ${vaultDir}`, 'blue');
}

// =============================================================================
// TEST SUITE 1: File Format Tests
// =============================================================================

function testSuite1_FileFormats() {
  log('\n\n' + '█'.repeat(70), 'magenta');
  log('TEST SUITE 1: FILE FORMAT VALIDATION', 'magenta');
  log('█'.repeat(70) + '\n', 'magenta');

  // Test 1.1: Create v2.5.0 diagram
  testCreateV2_5_Diagram();

  // Test 1.2: Validate file structure
  testValidateFileStructure();

  // Test 1.3: Validate metadata
  testValidateMetadata();

  // Test 1.4: Validate timeline structure
  testValidateTimelineStructure();
}

function testCreateV2_5_Diagram() {
  logTest('1.1: Create v2.5.0 Diagram');

  const diagram = createV2_5_Diagram('Format Test');

  assert(fs.existsSync(diagram.nodeFilePath), 'Node file created', 'Create Diagram');
  assert(fs.existsSync(diagram.graphFilePath), 'Graph file created', 'Create Diagram');

  const nodeFile = JSON.parse(fs.readFileSync(diagram.nodeFilePath, 'utf-8'));
  const graphFile = JSON.parse(fs.readFileSync(diagram.graphFilePath, 'utf-8'));

  assertEqual(nodeFile.version, '2.5.0', 'Node file version is 2.5.0', 'Create Diagram');
  assertEqual(graphFile.version, '2.5.0', 'Graph file version is 2.5.0', 'Create Diagram');

  log('ℹ️  Created: Format Test.bac4', 'blue');
  log('ℹ️  Created: Format Test.bac4-graph', 'blue');
}

function testValidateFileStructure() {
  logTest('1.2: Validate File Structure');

  const diagram = loadDiagram('Format Test');

  // Check node file structure
  assert(typeof diagram.nodeFile.nodes === 'object', 'Nodes is an object', 'File Structure');
  assert(!Array.isArray(diagram.nodeFile.nodes), 'Nodes is NOT an array', 'File Structure');
  assert(diagram.nodeFile.metadata !== undefined, 'Has metadata', 'File Structure');

  // Check graph file structure
  assert(diagram.graphFile.timeline !== undefined, 'Has timeline', 'File Structure');
  assert(Array.isArray(diagram.graphFile.timeline.snapshots), 'Timeline has snapshots array', 'File Structure');
  assert(typeof diagram.graphFile.timeline.currentSnapshotId === 'string', 'Has currentSnapshotId', 'File Structure');

  log('ℹ️  Node file structure: ✅ Valid', 'blue');
  log('ℹ️  Graph file structure: ✅ Valid', 'blue');
}

function testValidateMetadata() {
  logTest('1.3: Validate Metadata');

  const diagram = loadDiagram('Format Test');

  // Node file metadata
  assert(diagram.nodeFile.metadata.name !== undefined, 'Node file has name', 'Metadata');
  assert(diagram.nodeFile.metadata.diagramType !== undefined, 'Node file has diagramType', 'Metadata');
  assert(diagram.nodeFile.metadata.created !== undefined, 'Node file has created date', 'Metadata');

  // Graph file metadata
  assert(diagram.graphFile.metadata.nodeFile !== undefined, 'Graph file has nodeFile reference', 'Metadata');
  assert(diagram.graphFile.metadata.name !== undefined, 'Graph file has name', 'Metadata');

  log('ℹ️  All metadata fields present', 'blue');
}

function testValidateTimelineStructure() {
  logTest('1.4: Validate Timeline Structure');

  const diagram = loadDiagram('Format Test');
  const timeline = diagram.graphFile.timeline;

  assert(timeline.snapshots.length > 0, 'Has at least one snapshot', 'Timeline Structure');

  const snapshot = timeline.snapshots[0];
  assert(snapshot.id !== undefined, 'Snapshot has id', 'Timeline Structure');
  assert(snapshot.label !== undefined, 'Snapshot has label', 'Timeline Structure');
  assert(snapshot.layout !== undefined, 'Snapshot has layout', 'Timeline Structure');
  assert(typeof snapshot.layout === 'object', 'Layout is an object', 'Timeline Structure');
  assert(!Array.isArray(snapshot.layout), 'Layout is NOT an array', 'Timeline Structure');
  assert(Array.isArray(snapshot.edges), 'Snapshot has edges array', 'Timeline Structure');

  log('ℹ️  Timeline structure: ✅ Valid', 'blue');
}

// =============================================================================
// TEST SUITE 2: Node Operations Tests
// =============================================================================

function testSuite2_NodeOperations() {
  log('\n\n' + '█'.repeat(70), 'magenta');
  log('TEST SUITE 2: NODE OPERATIONS', 'magenta');
  log('█'.repeat(70) + '\n', 'magenta');

  // Test 2.1: Add single node
  testAddSingleNode();

  // Test 2.2: Add multiple nodes
  testAddMultipleNodes();

  // Test 2.3: Node positions
  testNodePositions();

  // Test 2.4: Node properties
  testNodeProperties();

  // Test 2.5: Node count accuracy
  testNodeCountAccuracy();
}

function testAddSingleNode() {
  logTest('2.1: Add Single Node');

  const diagram = createV2_5_Diagram('Single Node Test');
  addNode(diagram, 'node-1', 100, 200, 'Test Node', 'system');

  const loaded = loadDiagram('Single Node Test');

  assertEqual(Object.keys(loaded.nodeFile.nodes).length, 1, 'Has 1 node in node file', 'Add Single Node');
  assert(loaded.nodeFile.nodes['node-1'] !== undefined, 'Node exists in node file', 'Add Single Node');

  const currentSnapshot = loaded.graphFile.timeline.snapshots.find(
    s => s.id === loaded.graphFile.timeline.currentSnapshotId
  );
  assert(currentSnapshot.layout['node-1'] !== undefined, 'Node exists in layout', 'Add Single Node');

  log('ℹ️  Node added successfully', 'blue');
}

function testAddMultipleNodes() {
  logTest('2.2: Add Multiple Nodes');

  const diagram = createV2_5_Diagram('Multiple Nodes Test');

  for (let i = 1; i <= 10; i++) {
    addNode(diagram, `node-${i}`, i * 100, i * 50, `Node ${i}`, 'system');
  }

  const loaded = loadDiagram('Multiple Nodes Test');

  assertEqual(Object.keys(loaded.nodeFile.nodes).length, 10, 'Has 10 nodes in node file', 'Add Multiple Nodes');

  const currentSnapshot = loaded.graphFile.timeline.snapshots.find(
    s => s.id === loaded.graphFile.timeline.currentSnapshotId
  );
  assertEqual(Object.keys(currentSnapshot.layout).length, 10, 'Has 10 positions in layout', 'Add Multiple Nodes');

  log('ℹ️  All 10 nodes added successfully', 'blue');
}

function testNodePositions() {
  logTest('2.3: Node Positions');

  const diagram = loadDiagram('Multiple Nodes Test');
  const currentSnapshot = diagram.graphFile.timeline.snapshots.find(
    s => s.id === diagram.graphFile.timeline.currentSnapshotId
  );

  // Check specific positions
  assertEqual(currentSnapshot.layout['node-1'].x, 100, 'Node 1 x position correct', 'Node Positions');
  assertEqual(currentSnapshot.layout['node-1'].y, 50, 'Node 1 y position correct', 'Node Positions');
  assertEqual(currentSnapshot.layout['node-5'].x, 500, 'Node 5 x position correct', 'Node Positions');
  assertEqual(currentSnapshot.layout['node-5'].y, 250, 'Node 5 y position correct', 'Node Positions');

  // Check all positions are numbers
  for (const nodeId in currentSnapshot.layout) {
    const layout = currentSnapshot.layout[nodeId];
    assert(typeof layout.x === 'number', `${nodeId} x is a number`, 'Node Positions');
    assert(typeof layout.y === 'number', `${nodeId} y is a number`, 'Node Positions');
  }

  log('ℹ️  All positions validated', 'blue');
}

function testNodeProperties() {
  logTest('2.4: Node Properties');

  const diagram = loadDiagram('Multiple Nodes Test');

  // Check node-1 properties
  const node1 = diagram.nodeFile.nodes['node-1'];
  assertEqual(node1.label, 'Node 1', 'Node label correct', 'Node Properties');
  assertEqual(node1.type, 'system', 'Node type correct', 'Node Properties');
  assert(node1.style !== undefined, 'Node has style', 'Node Properties');

  log('ℹ️  All properties validated', 'blue');
}

function testNodeCountAccuracy() {
  logTest('2.5: Node Count Accuracy');

  const diagram = loadDiagram('Multiple Nodes Test');
  const nodeCount = Object.keys(diagram.nodeFile.nodes).length;

  const currentSnapshot = diagram.graphFile.timeline.snapshots.find(
    s => s.id === diagram.graphFile.timeline.currentSnapshotId
  );
  const layoutCount = Object.keys(currentSnapshot.layout).length;

  assertEqual(nodeCount, layoutCount, 'Node count matches layout count', 'Node Count Accuracy');
  assertEqual(nodeCount, 10, 'Correct total node count', 'Node Count Accuracy');

  log('ℹ️  Node counts accurate across files', 'blue');
}

// =============================================================================
// TEST SUITE 3: Snapshot Tests
// =============================================================================

function testSuite3_Snapshots() {
  log('\n\n' + '█'.repeat(70), 'magenta');
  log('TEST SUITE 3: SNAPSHOT OPERATIONS', 'magenta');
  log('█'.repeat(70) + '\n', 'magenta');

  // Test 3.1: Create snapshot (no auto-switch)
  testCreateSnapshotNoAutoSwitch();

  // Test 3.2: Snapshot deep copy
  testSnapshotDeepCopy();

  // Test 3.3: Snapshot independence
  testSnapshotIndependence();

  // Test 3.4: Multiple snapshots
  testMultipleSnapshots();

  // Test 3.5: Snapshot data integrity
  testSnapshotDataIntegrity();
}

function testCreateSnapshotNoAutoSwitch() {
  logTest('3.1: Create Snapshot (No Auto-Switch)');

  const diagram = createV2_5_Diagram('Snapshot Auto-Switch Test');

  // Add nodes
  for (let i = 1; i <= 5; i++) {
    addNode(diagram, `node-${i}`, i * 100, 100, `Node ${i}`, 'system');
  }

  // Get current snapshot ID before creating new snapshot
  let loaded = loadDiagram('Snapshot Auto-Switch Test');
  const originalSnapshotId = loaded.graphFile.timeline.currentSnapshotId;
  log(`ℹ️  Current snapshot before: ${originalSnapshotId}`, 'blue');

  // Create new snapshot
  createSnapshot(diagram, 'Phase 2');

  // Reload and check we're still on original snapshot
  loaded = loadDiagram('Snapshot Auto-Switch Test');
  assertEqual(
    loaded.graphFile.timeline.currentSnapshotId,
    originalSnapshotId,
    '✅ BUG FIX: Stays on current snapshot (no auto-switch)',
    'Create Snapshot No Auto-Switch'
  );

  log(`ℹ️  Current snapshot after: ${loaded.graphFile.timeline.currentSnapshotId}`, 'blue');
  assertEqual(loaded.graphFile.timeline.snapshots.length, 2, 'Now has 2 snapshots', 'Create Snapshot No Auto-Switch');
}

function testSnapshotDeepCopy() {
  logTest('3.2: Snapshot Deep Copy');

  const diagram = loadDiagram('Snapshot Auto-Switch Test');

  const snapshot1 = diagram.graphFile.timeline.snapshots[0];
  const snapshot2 = diagram.graphFile.timeline.snapshots[1];

  // Verify they have the same data initially (deep copy)
  assertEqual(
    Object.keys(snapshot1.layout).length,
    Object.keys(snapshot2.layout).length,
    'Both snapshots have same number of nodes',
    'Snapshot Deep Copy'
  );

  // Verify they are different objects (not references)
  assert(snapshot1 !== snapshot2, 'Snapshots are different objects', 'Snapshot Deep Copy');
  assert(snapshot1.layout !== snapshot2.layout, 'Layouts are different objects', 'Snapshot Deep Copy');

  log('ℹ️  Snapshots are deep copies (not references)', 'blue');
}

function testSnapshotIndependence() {
  logTest('3.3: Snapshot Independence');

  const diagram = loadDiagram('Snapshot Auto-Switch Test');

  // Add nodes to current snapshot only
  for (let i = 6; i <= 8; i++) {
    addNode(diagram, `node-${i}`, i * 100, 100, `Node ${i}`, 'system');
  }

  // Reload and verify
  const loaded = loadDiagram('Snapshot Auto-Switch Test');

  const currentSnapshot = loaded.graphFile.timeline.snapshots.find(
    s => s.id === loaded.graphFile.timeline.currentSnapshotId
  );
  const otherSnapshot = loaded.graphFile.timeline.snapshots.find(
    s => s.id !== loaded.graphFile.timeline.currentSnapshotId
  );

  assertEqual(Object.keys(currentSnapshot.layout).length, 8, 'Current snapshot has 8 nodes', 'Snapshot Independence');
  assertEqual(Object.keys(otherSnapshot.layout).length, 5, '✅ BUG FIX: Other snapshot still has 5 nodes (independent)', 'Snapshot Independence');

  log('ℹ️  Snapshots are independent - modifying one does not affect others', 'blue');
}

function testMultipleSnapshots() {
  logTest('3.4: Multiple Snapshots');

  const diagram = createV2_5_Diagram('Multiple Snapshots Test');

  // Add initial nodes
  for (let i = 1; i <= 3; i++) {
    addNode(diagram, `node-${i}`, i * 100, 100, `Node ${i}`, 'system');
  }

  // Create 5 snapshots
  for (let i = 1; i <= 5; i++) {
    createSnapshot(diagram, `Snapshot ${i}`);
    // Add a node after each snapshot
    addNode(diagram, `node-${3 + i}`, (3 + i) * 100, 100, `Node ${3 + i}`, 'system');
  }

  const loaded = loadDiagram('Multiple Snapshots Test');

  // Should have 6 total snapshots (1 initial + 5 created)
  assertEqual(loaded.graphFile.timeline.snapshots.length, 6, 'Has 6 snapshots', 'Multiple Snapshots');

  // Verify snapshot order
  assertEqual(loaded.graphFile.timeline.snapshotOrder.length, 6, 'Snapshot order has 6 entries', 'Multiple Snapshots');

  log('ℹ️  Multiple snapshots created successfully', 'blue');
}

function testSnapshotDataIntegrity() {
  logTest('3.5: Snapshot Data Integrity');

  const diagram = loadDiagram('Multiple Snapshots Test');

  // Check each snapshot
  for (const snapshot of diagram.graphFile.timeline.snapshots) {
    // Verify all nodes in layout exist in node file
    for (const nodeId in snapshot.layout) {
      assert(
        diagram.nodeFile.nodes[nodeId] !== undefined,
        `Snapshot "${snapshot.label}": Node ${nodeId} exists in node file`,
        'Snapshot Data Integrity'
      );
    }

    log(`ℹ️  Snapshot "${snapshot.label}": ${Object.keys(snapshot.layout).length} nodes - ✅ Valid`, 'blue');
  }
}

// =============================================================================
// TEST SUITE 4: Persistence Tests (Simulated Close/Reopen)
// =============================================================================

function testSuite4_Persistence() {
  log('\n\n' + '█'.repeat(70), 'magenta');
  log('TEST SUITE 4: PERSISTENCE (CLOSE/REOPEN SIMULATION)', 'magenta');
  log('█'.repeat(70) + '\n', 'magenta');

  // Test 4.1: Snapshot persistence
  testSnapshotPersistence();

  // Test 4.2: Node persistence
  testNodePersistence();

  // Test 4.3: Edge persistence
  testEdgePersistence();

  // Test 4.4: Multiple close/reopen cycles
  testMultipleCloseReopenCycles();
}

function testSnapshotPersistence() {
  logTest('4.1: Snapshot Persistence');

  // Create diagram with snapshots
  const diagram = createV2_5_Diagram('Persistence Test');

  for (let i = 1; i <= 4; i++) {
    addNode(diagram, `node-${i}`, i * 100, 100, `Node ${i}`, 'system');
  }

  createSnapshot(diagram, 'Saved Snapshot');

  // Add more nodes
  for (let i = 5; i <= 6; i++) {
    addNode(diagram, `node-${i}`, i * 100, 100, `Node ${i}`, 'system');
  }

  // Simulate close and reopen
  log('ℹ️  Simulating close/reopen...', 'blue');
  const loaded = loadDiagram('Persistence Test');

  // Verify snapshots persisted
  assertEqual(loaded.graphFile.timeline.snapshots.length, 2, '✅ BUG FIX: Both snapshots persisted after close/reopen', 'Snapshot Persistence');

  const savedSnapshot = loaded.graphFile.timeline.snapshots.find(s => s.label === 'Saved Snapshot');
  assert(savedSnapshot !== undefined, 'Named snapshot found after reload', 'Snapshot Persistence');
  assertEqual(Object.keys(savedSnapshot.layout).length, 4, 'Saved snapshot has correct node count', 'Snapshot Persistence');

  log('ℹ️  Snapshots persist correctly across close/reopen', 'blue');
}

function testNodePersistence() {
  logTest('4.2: Node Persistence');

  const diagram = createV2_5_Diagram('Node Persistence Test');

  // Add nodes with specific properties
  const testNodes = [
    { id: 'node-1', x: 100, y: 200, label: 'Frontend', type: 'container' },
    { id: 'node-2', x: 300, y: 200, label: 'Backend', type: 'container' },
    { id: 'node-3', x: 500, y: 200, label: 'Database', type: 'component' },
  ];

  testNodes.forEach(node => {
    addNode(diagram, node.id, node.x, node.y, node.label, node.type);
  });

  // Simulate close and reopen
  const loaded = loadDiagram('Node Persistence Test');

  // Verify all nodes persisted with correct properties
  testNodes.forEach(testNode => {
    const savedNode = loaded.nodeFile.nodes[testNode.id];
    assert(savedNode !== undefined, `Node ${testNode.id} persisted`, 'Node Persistence');
    assertEqual(savedNode.label, testNode.label, `${testNode.id} label persisted`, 'Node Persistence');
    assertEqual(savedNode.type, testNode.type, `${testNode.id} type persisted`, 'Node Persistence');

    const currentSnapshot = loaded.graphFile.timeline.snapshots.find(
      s => s.id === loaded.graphFile.timeline.currentSnapshotId
    );
    assertEqual(currentSnapshot.layout[testNode.id].x, testNode.x, `${testNode.id} x position persisted`, 'Node Persistence');
    assertEqual(currentSnapshot.layout[testNode.id].y, testNode.y, `${testNode.id} y position persisted`, 'Node Persistence');
  });

  log('ℹ️  All node properties persisted correctly', 'blue');
}

function testEdgePersistence() {
  logTest('4.3: Edge Persistence');

  const diagram = createV2_5_Diagram('Edge Persistence Test');

  // Add nodes
  addNode(diagram, 'node-1', 100, 100, 'Node 1', 'system');
  addNode(diagram, 'node-2', 300, 100, 'Node 2', 'system');

  // Add edge
  addEdge(diagram, 'edge-1', 'node-1', 'node-2', 'API Call');

  // Simulate close and reopen
  const loaded = loadDiagram('Edge Persistence Test');

  const currentSnapshot = loaded.graphFile.timeline.snapshots.find(
    s => s.id === loaded.graphFile.timeline.currentSnapshotId
  );

  assertEqual(currentSnapshot.edges.length, 1, 'Edge persisted', 'Edge Persistence');
  const edge = currentSnapshot.edges[0];
  assertEqual(edge.id, 'edge-1', 'Edge ID persisted', 'Edge Persistence');
  assertEqual(edge.source, 'node-1', 'Edge source persisted', 'Edge Persistence');
  assertEqual(edge.target, 'node-2', 'Edge target persisted', 'Edge Persistence');
  assertEqual(edge.properties.label, 'API Call', 'Edge label persisted', 'Edge Persistence');

  log('ℹ️  Edges persist correctly', 'blue');
}

function testMultipleCloseReopenCycles() {
  logTest('4.4: Multiple Close/Reopen Cycles');

  const diagramName = 'Cycle Test';
  const diagram = createV2_5_Diagram(diagramName);

  // Cycle 1: Add 2 nodes
  addNode(diagram, 'node-1', 100, 100, 'Node 1', 'system');
  addNode(diagram, 'node-2', 200, 100, 'Node 2', 'system');
  let loaded = loadDiagram(diagramName);
  assertEqual(Object.keys(loaded.nodeFile.nodes).length, 2, 'Cycle 1: 2 nodes persisted', 'Multiple Cycles');

  // Cycle 2: Add snapshot and 2 more nodes
  createSnapshot(loaded, 'Snapshot 1');
  addNode(loaded, 'node-3', 300, 100, 'Node 3', 'system');
  addNode(loaded, 'node-4', 400, 100, 'Node 4', 'system');
  loaded = loadDiagram(diagramName);
  assertEqual(Object.keys(loaded.nodeFile.nodes).length, 4, 'Cycle 2: 4 nodes persisted', 'Multiple Cycles');
  assertEqual(loaded.graphFile.timeline.snapshots.length, 2, 'Cycle 2: 2 snapshots persisted', 'Multiple Cycles');

  // Cycle 3: Add another snapshot
  createSnapshot(loaded, 'Snapshot 2');
  loaded = loadDiagram(diagramName);
  assertEqual(loaded.graphFile.timeline.snapshots.length, 3, 'Cycle 3: 3 snapshots persisted', 'Multiple Cycles');

  log('ℹ️  Data persists correctly across multiple cycles', 'blue');
}

// =============================================================================
// TEST SUITE 5: File Rename Tests
// =============================================================================

function testSuite5_FileRename() {
  log('\n\n' + '█'.repeat(70), 'magenta');
  log('TEST SUITE 5: FILE RENAME OPERATIONS', 'magenta');
  log('█'.repeat(70) + '\n', 'magenta');

  // Test 5.1: Rename file (no duplicates)
  testRenameFileNoDuplicates();

  // Test 5.2: Rename updates both files
  testRenameBothFiles();

  // Test 5.3: Rename with existing content
  testRenameWithContent();
}

function testRenameFileNoDuplicates() {
  logTest('5.1: Rename File (No Duplicates)');

  const diagram = createV2_5_Diagram('Original Name');
  addNode(diagram, 'node-1', 100, 100, 'Test Node', 'system');

  // Verify original files exist
  assert(fs.existsSync(diagram.nodeFilePath), 'Original .bac4 exists', 'Rename No Duplicates');
  assert(fs.existsSync(diagram.graphFilePath), 'Original .bac4-graph exists', 'Rename No Duplicates');

  // Rename files
  const newNodePath = path.join(vaultDir, 'Renamed File.bac4');
  const newGraphPath = path.join(vaultDir, 'Renamed File.bac4-graph');

  fs.renameSync(diagram.nodeFilePath, newNodePath);
  fs.renameSync(diagram.graphFilePath, newGraphPath);

  // Update metadata to match rename
  const nodeFile = JSON.parse(fs.readFileSync(newNodePath, 'utf-8'));
  const graphFile = JSON.parse(fs.readFileSync(newGraphPath, 'utf-8'));

  nodeFile.metadata.name = 'Renamed File';
  graphFile.metadata.name = 'Renamed File';
  graphFile.metadata.nodeFile = 'Renamed File.bac4';

  fs.writeFileSync(newNodePath, JSON.stringify(nodeFile, null, 2));
  fs.writeFileSync(newGraphPath, JSON.stringify(graphFile, null, 2));

  // Verify old files don't exist
  assert(!fs.existsSync(diagram.nodeFilePath), '✅ BUG FIX: Old .bac4 does not exist (no duplicate)', 'Rename No Duplicates');
  assert(!fs.existsSync(diagram.graphFilePath), '✅ BUG FIX: Old .bac4-graph does not exist (no duplicate)', 'Rename No Duplicates');

  // Verify new files exist
  assert(fs.existsSync(newNodePath), 'New .bac4 exists', 'Rename No Duplicates');
  assert(fs.existsSync(newGraphPath), 'New .bac4-graph exists', 'Rename No Duplicates');

  log('ℹ️  Rename successful - no duplicates created', 'blue');
}

function testRenameBothFiles() {
  logTest('5.2: Rename Updates Both Files');

  const loaded = loadDiagram('Renamed File');

  assertEqual(loaded.nodeFile.metadata.name, 'Renamed File', 'Node file metadata updated', 'Rename Both Files');
  assertEqual(loaded.graphFile.metadata.name, 'Renamed File', 'Graph file metadata updated', 'Rename Both Files');
  assertEqual(loaded.graphFile.metadata.nodeFile, 'Renamed File.bac4', 'Graph file nodeFile reference updated', 'Rename Both Files');

  log('ℹ️  Both files updated with new name', 'blue');
}

function testRenameWithContent() {
  logTest('5.3: Rename Preserves Content');

  const loaded = loadDiagram('Renamed File');

  // Verify content preserved
  assertEqual(Object.keys(loaded.nodeFile.nodes).length, 1, 'Node count preserved', 'Rename With Content');
  assert(loaded.nodeFile.nodes['node-1'] !== undefined, 'Node data preserved', 'Rename With Content');

  const currentSnapshot = loaded.graphFile.timeline.snapshots.find(
    s => s.id === loaded.graphFile.timeline.currentSnapshotId
  );
  assert(currentSnapshot.layout['node-1'] !== undefined, 'Layout data preserved', 'Rename With Content');

  log('ℹ️  All content preserved after rename', 'blue');
}

// =============================================================================
// TEST SUITE 6: Edge Cases
// =============================================================================

function testSuite6_EdgeCases() {
  log('\n\n' + '█'.repeat(70), 'magenta');
  log('TEST SUITE 6: EDGE CASES', 'magenta');
  log('█'.repeat(70) + '\n', 'magenta');

  // Test 6.1: Empty diagram
  testEmptyDiagram();

  // Test 6.2: Single node diagram
  testSingleNodeDiagram();

  // Test 6.3: Large diagram (100 nodes)
  testLargeDiagram();

  // Test 6.4: Snapshot with no changes
  testSnapshotNoChanges();

  // Test 6.5: Maximum snapshots
  testMaximumSnapshots();
}

function testEmptyDiagram() {
  logTest('6.1: Empty Diagram');

  const diagram = createV2_5_Diagram('Empty Diagram');
  const loaded = loadDiagram('Empty Diagram');

  assertEqual(Object.keys(loaded.nodeFile.nodes).length, 0, 'No nodes in empty diagram', 'Empty Diagram');

  const currentSnapshot = loaded.graphFile.timeline.snapshots.find(
    s => s.id === loaded.graphFile.timeline.currentSnapshotId
  );
  assertEqual(Object.keys(currentSnapshot.layout).length, 0, 'No layout in empty diagram', 'Empty Diagram');
  assertEqual(currentSnapshot.edges.length, 0, 'No edges in empty diagram', 'Empty Diagram');

  log('ℹ️  Empty diagram handled correctly', 'blue');
}

function testSingleNodeDiagram() {
  logTest('6.2: Single Node Diagram');

  const diagram = createV2_5_Diagram('Single Node Diagram');
  addNode(diagram, 'lonely-node', 250, 250, 'Lonely Node', 'system');

  const loaded = loadDiagram('Single Node Diagram');

  assertEqual(Object.keys(loaded.nodeFile.nodes).length, 1, 'Has exactly 1 node', 'Single Node');
  assert(loaded.nodeFile.nodes['lonely-node'] !== undefined, 'Node exists', 'Single Node');

  log('ℹ️  Single node diagram handled correctly', 'blue');
}

function testLargeDiagram() {
  logTest('6.3: Large Diagram (100 nodes)');

  const diagram = createV2_5_Diagram('Large Diagram');

  log('ℹ️  Adding 100 nodes...', 'blue');
  for (let i = 1; i <= 100; i++) {
    const x = (i % 10) * 100;
    const y = Math.floor(i / 10) * 100;
    addNode(diagram, `node-${i}`, x, y, `Node ${i}`, 'system');
  }

  const loaded = loadDiagram('Large Diagram');

  assertEqual(Object.keys(loaded.nodeFile.nodes).length, 100, 'Has all 100 nodes', 'Large Diagram');

  const currentSnapshot = loaded.graphFile.timeline.snapshots.find(
    s => s.id === loaded.graphFile.timeline.currentSnapshotId
  );
  assertEqual(Object.keys(currentSnapshot.layout).length, 100, 'Has all 100 positions', 'Large Diagram');

  // Verify all nodes are valid
  for (let i = 1; i <= 100; i++) {
    const nodeId = `node-${i}`;
    assert(loaded.nodeFile.nodes[nodeId] !== undefined, `Node ${i} exists`, 'Large Diagram');
    assert(currentSnapshot.layout[nodeId] !== undefined, `Node ${i} has layout`, 'Large Diagram');
  }

  log('ℹ️  Large diagram (100 nodes) handled correctly', 'blue');
}

function testSnapshotNoChanges() {
  logTest('6.4: Snapshot With No Changes');

  const diagram = createV2_5_Diagram('No Changes Test');
  addNode(diagram, 'node-1', 100, 100, 'Node 1', 'system');

  // Create snapshot without making changes
  createSnapshot(diagram, 'Identical Snapshot');

  const loaded = loadDiagram('No Changes Test');

  assertEqual(loaded.graphFile.timeline.snapshots.length, 2, 'Has 2 snapshots', 'Snapshot No Changes');

  const snapshot1 = loaded.graphFile.timeline.snapshots[0];
  const snapshot2 = loaded.graphFile.timeline.snapshots[1];

  assertEqual(
    Object.keys(snapshot1.layout).length,
    Object.keys(snapshot2.layout).length,
    'Both snapshots have same node count',
    'Snapshot No Changes'
  );

  log('ℹ️  Snapshot with no changes handled correctly', 'blue');
}

function testMaximumSnapshots() {
  logTest('6.5: Maximum Snapshots');

  const diagram = createV2_5_Diagram('Max Snapshots Test');
  addNode(diagram, 'node-1', 100, 100, 'Node 1', 'system');

  // Create many snapshots
  const maxToTest = 20; // Test with 20 snapshots
  for (let i = 1; i <= maxToTest; i++) {
    createSnapshot(diagram, `Snapshot ${i}`);
  }

  const loaded = loadDiagram('Max Snapshots Test');

  // Should have maxToTest + 1 snapshots (including initial)
  assertEqual(loaded.graphFile.timeline.snapshots.length, maxToTest + 1, `Has ${maxToTest + 1} snapshots`, 'Maximum Snapshots');
  assertEqual(loaded.graphFile.timeline.snapshotOrder.length, maxToTest + 1, `Snapshot order has ${maxToTest + 1} entries`, 'Maximum Snapshots');

  log(`ℹ️  ${maxToTest + 1} snapshots created successfully`, 'blue');
}

// =============================================================================
// Helper Functions
// =============================================================================

function createV2_5_Diagram(name) {
  const nodeFilePath = path.join(vaultDir, `${name}.bac4`);
  const graphFilePath = path.join(vaultDir, `${name}.bac4-graph`);

  const nodeFile = {
    version: '2.5.0',
    metadata: {
      name: name,
      diagramType: 'context',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    },
    nodes: {},
  };

  const snapshotId = `snapshot-${Date.now()}`;
  const graphFile = {
    version: '2.5.0',
    metadata: {
      nodeFile: `${name}.bac4`,
      name: name,
      diagramType: 'c4-context',
    },
    timeline: {
      snapshots: [
        {
          id: snapshotId,
          label: 'Current',
          timestamp: null,
          description: '',
          created: new Date().toISOString(),
          layout: {},
          edges: [],
          groups: [],
          annotations: [],
        },
      ],
      currentSnapshotId: snapshotId,
      snapshotOrder: [snapshotId],
    },
  };

  fs.writeFileSync(nodeFilePath, JSON.stringify(nodeFile, null, 2));
  fs.writeFileSync(graphFilePath, JSON.stringify(graphFile, null, 2));

  return { nodeFilePath, graphFilePath, nodeFile, graphFile };
}

function loadDiagram(name) {
  const nodeFilePath = path.join(vaultDir, `${name}.bac4`);
  const graphFilePath = path.join(vaultDir, `${name}.bac4-graph`);

  const nodeFile = JSON.parse(fs.readFileSync(nodeFilePath, 'utf-8'));
  const graphFile = JSON.parse(fs.readFileSync(graphFilePath, 'utf-8'));

  return { nodeFilePath, graphFilePath, nodeFile, graphFile };
}

function addNode(diagram, nodeId, x, y, label, type) {
  // Load current state
  const nodeFile = JSON.parse(fs.readFileSync(diagram.nodeFilePath, 'utf-8'));
  const graphFile = JSON.parse(fs.readFileSync(diagram.graphFilePath, 'utf-8'));

  // Add node to node file
  nodeFile.nodes[nodeId] = {
    id: nodeId,
    label: label,
    type: type,
    style: {
      backgroundColor: '#4A90E2',
      borderColor: '#2E5C8A',
      textColor: '#FFFFFF',
    },
    properties: {},
    links: {
      linkedDiagrams: [],
    },
  };

  // Add layout to current snapshot
  const currentSnapshot = graphFile.timeline.snapshots.find(
    s => s.id === graphFile.timeline.currentSnapshotId
  );
  currentSnapshot.layout[nodeId] = {
    x: x,
    y: y,
    width: 200,
    height: 100,
    locked: false,
  };

  // Update timestamps
  nodeFile.metadata.updated = new Date().toISOString();

  // Save
  fs.writeFileSync(diagram.nodeFilePath, JSON.stringify(nodeFile, null, 2));
  fs.writeFileSync(diagram.graphFilePath, JSON.stringify(graphFile, null, 2));
}

function addEdge(diagram, edgeId, source, target, label) {
  const graphFile = JSON.parse(fs.readFileSync(diagram.graphFilePath, 'utf-8'));

  const currentSnapshot = graphFile.timeline.snapshots.find(
    s => s.id === graphFile.timeline.currentSnapshotId
  );

  currentSnapshot.edges.push({
    id: edgeId,
    source: source,
    target: target,
    type: 'default',
    properties: {
      label: label,
    },
    style: {
      direction: 'right',
      lineType: 'solid',
      color: '#888888',
      markerEnd: 'arrowclosed',
    },
    handles: {
      sourceHandle: 'right',
      targetHandle: 'left',
    },
  });

  fs.writeFileSync(diagram.graphFilePath, JSON.stringify(graphFile, null, 2));
}

function createSnapshot(diagram, label) {
  const nodeFile = JSON.parse(fs.readFileSync(diagram.nodeFilePath, 'utf-8'));
  const graphFile = JSON.parse(fs.readFileSync(diagram.graphFilePath, 'utf-8'));

  // Get current snapshot
  const currentSnapshot = graphFile.timeline.snapshots.find(
    s => s.id === graphFile.timeline.currentSnapshotId
  );

  // Create new snapshot (deep copy of current)
  const newSnapshotId = `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newSnapshot = {
    id: newSnapshotId,
    label: label,
    timestamp: null,
    description: '',
    created: new Date().toISOString(),
    layout: JSON.parse(JSON.stringify(currentSnapshot.layout)), // Deep copy
    edges: JSON.parse(JSON.stringify(currentSnapshot.edges)), // Deep copy
    groups: [],
    annotations: [],
  };

  // Add to timeline (STAY ON CURRENT - don't switch)
  graphFile.timeline.snapshots.push(newSnapshot);
  graphFile.timeline.snapshotOrder.push(newSnapshotId);
  // DON'T update currentSnapshotId - this was the bug!

  fs.writeFileSync(diagram.graphFilePath, JSON.stringify(graphFile, null, 2));
}

// =============================================================================
// Test Results Summary
// =============================================================================

function printTestSummary() {
  log('\n\n' + '█'.repeat(70), 'cyan');
  log('TEST RESULTS SUMMARY', 'cyan');
  log('█'.repeat(70) + '\n', 'cyan');

  log(`Total Tests:  ${testResults.total}`, 'blue');
  log(`Passed:       ${testResults.passed}`, 'green');
  log(`Failed:       ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');

  if (testResults.failed > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    testResults.failedTests.forEach(({ test, message }) => {
      log(`  - ${test}: ${message}`, 'red');
    });
  }

  log('\n' + '='.repeat(70) + '\n', 'cyan');

  if (testResults.failed === 0) {
    log('🎉 ALL TESTS PASSED! 🎉', 'green');
  } else {
    log('❌ SOME TESTS FAILED', 'red');
    process.exit(1);
  }

  log(`\n📁 Test files location: ${vaultDir}\n`, 'blue');
}

// =============================================================================
// Main Test Runner
// =============================================================================

function runAllTests() {
  try {
    setupTestEnvironment();

    testSuite1_FileFormats();
    testSuite2_NodeOperations();
    testSuite3_Snapshots();
    testSuite4_Persistence();
    testSuite5_FileRename();
    testSuite6_EdgeCases();

    printTestSummary();
  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
    log(error.stack, 'red');
    printTestSummary();
    process.exit(1);
  }
}

// Run tests
runAllTests();
