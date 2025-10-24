#!/usr/bin/env node

/**
 * Position and Color Persistence Test
 *
 * Tests that node positions and colors persist correctly across close/reopen
 * Reproduces user-reported bug: "nodes lose positions and colours"
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
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const testDir = '/tmp/bac4-persistence-test';
const vaultDir = path.join(testDir, 'TestVault');

// Setup
function setupTestEnvironment() {
  log('\n🧪 Position & Color Persistence Test\n', 'cyan');

  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  fs.mkdirSync(vaultDir, { recursive: true });
  log('✅ Created test environment', 'green');
}

// Create v2.5.0 diagram
function createDiagram(name) {
  const nodeFilePath = path.join(vaultDir, `${name}.bac4`);
  const graphFilePath = path.join(vaultDir, `${name}.bac4-graph`);

  const snapshotId = `snapshot-${Date.now()}`;

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

  return { nodeFilePath, graphFilePath };
}

// Add node with specific position and color
function addNode(diagram, nodeId, x, y, label, color) {
  const nodeFile = JSON.parse(fs.readFileSync(diagram.nodeFilePath, 'utf-8'));
  const graphFile = JSON.parse(fs.readFileSync(diagram.graphFilePath, 'utf-8'));

  // Add node to .bac4 file
  nodeFile.nodes[nodeId] = {
    id: nodeId,
    type: 'system',
    properties: {
      label: label,
      description: `Test node at (${x}, ${y}) with color ${color}`,
      technology: '',
      team: '',
    },
    knowledge: {
      notes: [],
      urls: [],
      attachments: [],
    },
    metrics: {},
    wardley: undefined,
    links: {
      parent: null,
      children: [],
      linkedDiagrams: [],
      externalSystems: [],
      dependencies: [],
    },
    style: {
      color: color, // CRITICAL: Save color in v2.5.0 format
      icon: undefined,
      shape: undefined,
    },
  };

  // Add layout to current snapshot in .bac4-graph file
  const currentSnapshot = graphFile.timeline.snapshots.find(
    s => s.id === graphFile.timeline.currentSnapshotId
  );

  currentSnapshot.layout[nodeId] = {
    x: x, // CRITICAL: Save x position
    y: y, // CRITICAL: Save y position
    width: 200,
    height: 100,
    locked: false,
  };

  nodeFile.metadata.updated = new Date().toISOString();

  fs.writeFileSync(diagram.nodeFilePath, JSON.stringify(nodeFile, null, 2));
  fs.writeFileSync(diagram.graphFilePath, JSON.stringify(graphFile, null, 2));

  return { nodeId, x, y, color };
}

// Create snapshot
function createSnapshot(diagram, label) {
  const nodeFile = JSON.parse(fs.readFileSync(diagram.nodeFilePath, 'utf-8'));
  const graphFile = JSON.parse(fs.readFileSync(diagram.graphFilePath, 'utf-8'));

  const currentSnapshot = graphFile.timeline.snapshots.find(
    s => s.id === graphFile.timeline.currentSnapshotId
  );

  const newSnapshotId = `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newSnapshot = {
    id: newSnapshotId,
    label: label,
    timestamp: null,
    description: '',
    created: new Date().toISOString(),
    layout: JSON.parse(JSON.stringify(currentSnapshot.layout)), // Deep copy layout
    edges: JSON.parse(JSON.stringify(currentSnapshot.edges)),
    groups: [],
    annotations: [],
  };

  graphFile.timeline.snapshots.push(newSnapshot);
  graphFile.timeline.snapshotOrder.push(newSnapshotId);
  // DON'T update currentSnapshotId - stay on current

  fs.writeFileSync(diagram.graphFilePath, JSON.stringify(graphFile, null, 2));

  return newSnapshotId;
}

// Load diagram (simulates close/reopen)
function loadDiagram(name) {
  const nodeFilePath = path.join(vaultDir, `${name}.bac4`);
  const graphFilePath = path.join(vaultDir, `${name}.bac4-graph`);

  const nodeFile = JSON.parse(fs.readFileSync(nodeFilePath, 'utf-8'));
  const graphFile = JSON.parse(fs.readFileSync(graphFilePath, 'utf-8'));

  return { nodeFilePath, graphFilePath, nodeFile, graphFile };
}

// Verify node data matches expected
function verifyNode(loaded, nodeId, expectedX, expectedY, expectedColor, testName) {
  const node = loaded.nodeFile.nodes[nodeId];
  const currentSnapshot = loaded.graphFile.timeline.snapshots.find(
    s => s.id === loaded.graphFile.timeline.currentSnapshotId
  );
  const layout = currentSnapshot.layout[nodeId];

  let passed = true;
  const errors = [];

  // Check node exists
  if (!node) {
    log(`  ❌ Node ${nodeId} not found in .bac4 file`, 'red');
    errors.push(`Node ${nodeId} not found`);
    passed = false;
  }

  // Check layout exists
  if (!layout) {
    log(`  ❌ Layout for ${nodeId} not found in current snapshot`, 'red');
    errors.push(`Layout for ${nodeId} not found`);
    passed = false;
  } else {
    // Check position X
    if (layout.x !== expectedX) {
      log(`  ❌ ${nodeId} x position: expected ${expectedX}, got ${layout.x}`, 'red');
      errors.push(`${nodeId} x: ${layout.x} != ${expectedX}`);
      passed = false;
    } else {
      log(`  ✅ ${nodeId} x position: ${layout.x}`, 'green');
    }

    // Check position Y
    if (layout.y !== expectedY) {
      log(`  ❌ ${nodeId} y position: expected ${expectedY}, got ${layout.y}`, 'red');
      errors.push(`${nodeId} y: ${layout.y} != ${expectedY}`);
      passed = false;
    } else {
      log(`  ✅ ${nodeId} y position: ${layout.y}`, 'green');
    }
  }

  if (node) {
    // Check color
    if (node.style.color !== expectedColor) {
      log(`  ❌ ${nodeId} color: expected ${expectedColor}, got ${node.style.color}`, 'red');
      errors.push(`${nodeId} color: ${node.style.color} != ${expectedColor}`);
      passed = false;
    } else {
      log(`  ✅ ${nodeId} color: ${node.style.color}`, 'green');
    }
  }

  return { passed, errors };
}

// Verify snapshot data
function verifySnapshot(loaded, snapshotId, expectedNodes, testName) {
  const snapshot = loaded.graphFile.timeline.snapshots.find(s => s.id === snapshotId);

  if (!snapshot) {
    log(`  ❌ Snapshot ${snapshotId} not found`, 'red');
    return { passed: false, errors: [`Snapshot not found`] };
  }

  let passed = true;
  const errors = [];

  // Check each expected node
  for (const expected of expectedNodes) {
    const layout = snapshot.layout[expected.nodeId];
    const node = loaded.nodeFile.nodes[expected.nodeId];

    if (!layout) {
      log(`  ❌ Snapshot "${snapshot.label}": ${expected.nodeId} layout missing`, 'red');
      errors.push(`${expected.nodeId} layout missing`);
      passed = false;
      continue;
    }

    if (!node) {
      log(`  ❌ Snapshot "${snapshot.label}": ${expected.nodeId} node missing`, 'red');
      errors.push(`${expected.nodeId} node missing`);
      passed = false;
      continue;
    }

    // Verify position
    if (layout.x !== expected.x || layout.y !== expected.y) {
      log(`  ❌ Snapshot "${snapshot.label}": ${expected.nodeId} position (${layout.x}, ${layout.y}) != (${expected.x}, ${expected.y})`, 'red');
      errors.push(`${expected.nodeId} position mismatch`);
      passed = false;
    } else {
      log(`  ✅ Snapshot "${snapshot.label}": ${expected.nodeId} position (${layout.x}, ${layout.y})`, 'green');
    }

    // Verify color
    if (node.style.color !== expected.color) {
      log(`  ❌ Snapshot "${snapshot.label}": ${expected.nodeId} color ${node.style.color} != ${expected.color}`, 'red');
      errors.push(`${expected.nodeId} color mismatch`);
      passed = false;
    } else {
      log(`  ✅ Snapshot "${snapshot.label}": ${expected.nodeId} color ${node.style.color}`, 'green');
    }
  }

  return { passed, errors };
}

// Main test
function runTest() {
  setupTestEnvironment();

  log('\n' + '='.repeat(70), 'cyan');
  log('TEST 1: Current View Persistence', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  // Create diagram
  const diagram = createDiagram('Persistence Test');
  log('ℹ️  Created diagram: Persistence Test', 'blue');

  // Add nodes with specific positions and colors
  const testNodes = [
    { id: 'node-1', x: 100, y: 150, label: 'Frontend', color: '#FF5733' },
    { id: 'node-2', x: 400, y: 150, label: 'Backend', color: '#33FF57' },
    { id: 'node-3', x: 700, y: 150, label: 'Database', color: '#3357FF' },
  ];

  log('\nℹ️  Adding 3 nodes with specific positions and colors...', 'blue');
  testNodes.forEach(node => {
    addNode(diagram, node.id, node.x, node.y, node.label, node.color);
    log(`   - ${node.label} at (${node.x}, ${node.y}) with color ${node.color}`, 'blue');
  });

  log('\n📁 Simulating close/reopen...', 'yellow');

  // Reload (simulates close/reopen)
  const loaded = loadDiagram('Persistence Test');

  log('\n📊 Verifying loaded data:\n', 'yellow');

  // Verify each node
  let allPassed = true;
  const allErrors = [];

  for (const node of testNodes) {
    const result = verifyNode(loaded, node.id, node.x, node.y, node.color, 'Current View');
    if (!result.passed) {
      allPassed = false;
      allErrors.push(...result.errors);
    }
  }

  log('\n' + '='.repeat(70), 'cyan');
  log('TEST 2: Snapshot Persistence', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  // Create snapshot
  log('ℹ️  Creating snapshot "Phase 1"...', 'blue');
  const snapshotId = createSnapshot(diagram, 'Phase 1');

  // Add more nodes after snapshot
  log('\nℹ️  Adding 2 more nodes after snapshot...', 'blue');
  const additionalNodes = [
    { id: 'node-4', x: 100, y: 350, label: 'Cache', color: '#FF33F5' },
    { id: 'node-5', x: 400, y: 350, label: 'Queue', color: '#F5FF33' },
  ];

  additionalNodes.forEach(node => {
    addNode(diagram, node.id, node.x, node.y, node.label, node.color);
    log(`   - ${node.label} at (${node.x}, ${node.y}) with color ${node.color}`, 'blue');
  });

  log('\n📁 Simulating close/reopen...', 'yellow');

  // Reload again
  const loaded2 = loadDiagram('Persistence Test');

  log('\n📊 Verifying snapshot "Phase 1":\n', 'yellow');

  // Verify snapshot has original 3 nodes (not the 2 added after)
  const snapshotNodesData = testNodes.map(n => ({ nodeId: n.id, x: n.x, y: n.y, color: n.color }));
  const snapshotResult = verifySnapshot(loaded2, snapshotId, snapshotNodesData, 'Snapshot Phase 1');
  if (!snapshotResult.passed) {
    allPassed = false;
    allErrors.push(...snapshotResult.errors);
  }

  log('\n📊 Verifying current view has all 5 nodes:\n', 'yellow');

  // Verify current view has all 5 nodes
  const allNodes = [...testNodes, ...additionalNodes];
  for (const node of allNodes) {
    const result = verifyNode(loaded2, node.id, node.x, node.y, node.color, 'Current View After Snapshot');
    if (!result.passed) {
      allPassed = false;
      allErrors.push(...result.errors);
    }
  }

  // Summary
  log('\n' + '='.repeat(70), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  if (allPassed) {
    log('🎉 ALL TESTS PASSED!', 'green');
    log('\n✅ Current view positions preserved', 'green');
    log('✅ Current view colors preserved', 'green');
    log('✅ Snapshot positions preserved', 'green');
    log('✅ Snapshot colors preserved', 'green');
    log('✅ Node count accurate\n', 'green');
  } else {
    log('❌ TESTS FAILED', 'red');
    log('\n❌ Issues found:', 'red');
    allErrors.forEach(err => log(`   - ${err}`, 'red'));
    log('', 'reset');
    process.exit(1);
  }
}

// Run test
runTest();
