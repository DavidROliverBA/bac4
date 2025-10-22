/**
 * Wardley Property Panel
 *
 * Specialized property panel for editing Wardley Map nodes:
 * - Visibility slider (0-1)
 * - Evolution slider (0-1)
 * - Auto-calculate evolution stage
 * - Toggle inertia
 * - Edit inertia reason
 *
 * This extends the standard PropertyPanel with Wardley-specific controls.
 *
 * @version 2.5.0
 */

import * as React from 'react';
import { Node } from 'reactflow';
import { FONT_SIZES, SPACING, UI_COLORS, BORDER_RADIUS } from '../../constants';
import { getEvolutionStage, getEvolutionStageColor, EvolutionStage } from '../../types/bac4-v2-types';
import { FormField } from './form/FormField';
import { FormSection } from './form/FormSection';

interface WardleyNodeData {
  label: string;
  description?: string;
  wardley?: {
    visibility: number; // 0-1
    evolution: number; // 0-1
    evolutionStage: EvolutionStage;
    inertia: boolean;
    inertiaReason?: string;
  };
}

interface WardleyPropertyPanelProps {
  /**
   * The selected Wardley node
   */
  node: Node<WardleyNodeData> | null;

  /**
   * Callback to update node properties
   */
  onUpdateProperties: (nodeId: string, updates: Record<string, unknown>) => void;

  /**
   * Whether to show the panel
   */
  visible?: boolean;
}

/**
 * WardleyPropertyPanel component
 *
 * Renders Wardley-specific property controls for Wardley component and inertia nodes.
 */
export const WardleyPropertyPanel: React.FC<WardleyPropertyPanelProps> = ({
  node,
  onUpdateProperties,
  visible = true,
}) => {
  if (!visible || !node || !node.data.wardley) return null;

  const wardley = node.data.wardley;
  const isInertiaNode = node.type === 'wardley-inertia';
  const isComponentNode = node.type === 'wardley-component';

  /**
   * Update visibility and recalculate evolution stage
   */
  const handleVisibilityChange = (value: number) => {
    onUpdateProperties(node.id, {
      wardley: {
        ...wardley,
        visibility: value,
      },
    });
  };

  /**
   * Update evolution and recalculate evolution stage
   */
  const handleEvolutionChange = (value: number) => {
    const newStage = getEvolutionStage(value);
    onUpdateProperties(node.id, {
      wardley: {
        ...wardley,
        evolution: value,
        evolutionStage: newStage,
      },
    });
  };

  /**
   * Toggle inertia
   */
  const handleInertiaToggle = (checked: boolean) => {
    onUpdateProperties(node.id, {
      wardley: {
        ...wardley,
        inertia: checked,
        inertiaReason: checked ? (wardley.inertiaReason || '') : undefined,
      },
    });
  };

  /**
   * Update inertia reason
   */
  const handleInertiaReasonChange = (value: string) => {
    onUpdateProperties(node.id, {
      wardley: {
        ...wardley,
        inertiaReason: value,
      },
    });
  };

  // Get evolution stage color
  const stageColor = getEvolutionStageColor(wardley.evolutionStage);

  // Evolution stage labels
  const stageLabels: Record<EvolutionStage, string> = {
    genesis: 'Genesis',
    custom: 'Custom-Built',
    product: 'Product/Rental',
    commodity: 'Commodity/Utility',
  };

  return (
    <div
      style={{
        marginTop: SPACING.container,
        paddingTop: SPACING.container,
        borderTop: `2px solid ${stageColor}`,
      }}
    >
      {/* Wardley Mapping Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.small,
          marginBottom: SPACING.container,
        }}
      >
        <div
          style={{
            fontSize: FONT_SIZES.small,
            fontWeight: 700,
            color: stageColor,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Wardley Map Properties
        </div>
      </div>

      {/* Component Node Properties */}
      {isComponentNode && (
        <>
          {/* Visibility Slider */}
          <FormSection label="Visibility (User Need)">
            <div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={wardley.visibility}
                onChange={(e) => handleVisibilityChange(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  marginBottom: SPACING.small,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: FONT_SIZES.tiny,
                  color: UI_COLORS.textMuted,
                }}
              >
                <span>Invisible (0.0)</span>
                <span style={{ fontWeight: 700, color: UI_COLORS.textNormal }}>
                  {wardley.visibility.toFixed(2)}
                </span>
                <span>Visible (1.0)</span>
              </div>
              <div
                style={{
                  marginTop: SPACING.tiny,
                  fontSize: FONT_SIZES.extraSmall,
                  color: UI_COLORS.textFaint,
                  fontStyle: 'italic',
                }}
              >
                How visible/important is this to users?
              </div>
            </div>
          </FormSection>

          {/* Evolution Slider */}
          <FormSection label="Evolution (Maturity)">
            <div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={wardley.evolution}
                onChange={(e) => handleEvolutionChange(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  marginBottom: SPACING.small,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: FONT_SIZES.tiny,
                  color: UI_COLORS.textMuted,
                }}
              >
                <span>Genesis (0.0)</span>
                <span style={{ fontWeight: 700, color: UI_COLORS.textNormal }}>
                  {wardley.evolution.toFixed(2)}
                </span>
                <span>Commodity (1.0)</span>
              </div>
              <div
                style={{
                  marginTop: SPACING.tiny,
                  fontSize: FONT_SIZES.extraSmall,
                  color: UI_COLORS.textFaint,
                  fontStyle: 'italic',
                }}
              >
                How evolved/commoditized is this component?
              </div>
            </div>
          </FormSection>

          {/* Evolution Stage Badge */}
          <div
            style={{
              padding: SPACING.padding.input,
              background: `${stageColor}15`,
              border: `2px solid ${stageColor}`,
              borderRadius: BORDER_RADIUS.normal,
              marginBottom: SPACING.container,
            }}
          >
            <div
              style={{
                fontSize: FONT_SIZES.tiny,
                color: UI_COLORS.textMuted,
                marginBottom: SPACING.tiny,
              }}
            >
              Evolution Stage:
            </div>
            <div
              style={{
                fontSize: FONT_SIZES.normal,
                fontWeight: 700,
                color: stageColor,
              }}
            >
              {stageLabels[wardley.evolutionStage]}
            </div>
            <div
              style={{
                fontSize: FONT_SIZES.extraSmall,
                color: UI_COLORS.textMuted,
                marginTop: SPACING.tiny,
              }}
            >
              {wardley.evolutionStage === 'genesis' &&
                'Novel/experimental - High uncertainty, rapidly changing'}
              {wardley.evolutionStage === 'custom' &&
                'Custom-built solutions - Still evolving, some uncertainty'}
              {wardley.evolutionStage === 'product' &&
                'Product/rental market - Well understood, good/better/best'}
              {wardley.evolutionStage === 'commodity' &&
                'Commodity/utility - Standardized, volume operations, stable'}
            </div>
          </div>

          {/* Inertia Toggle */}
          <FormSection label="Resistance to Change">
            <div style={{ marginBottom: SPACING.large }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.large,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={wardley.inertia}
                  onChange={(e) => handleInertiaToggle(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: FONT_SIZES.normal, color: UI_COLORS.textNormal }}>
                  This component has inertia
                </span>
              </label>
              <div
                style={{
                  marginTop: SPACING.small,
                  fontSize: FONT_SIZES.extraSmall,
                  color: UI_COLORS.textFaint,
                  fontStyle: 'italic',
                  marginLeft: '28px', // Align with checkbox label
                }}
              >
                Components with inertia resist evolution (e.g., legacy systems, regulatory constraints)
              </div>
            </div>

            {/* Inertia Reason (shown when inertia is enabled) */}
            {wardley.inertia && (
              <FormField
                label="Reason for Inertia"
                value={wardley.inertiaReason || ''}
                onChange={handleInertiaReasonChange}
                type="textarea"
                placeholder="e.g., Legacy dependencies, Regulatory requirements, Vendor lock-in"
                rows={2}
              />
            )}
          </FormSection>
        </>
      )}

      {/* Inertia Node Properties */}
      {isInertiaNode && (
        <FormField
          label="Barrier Description"
          value={wardley.inertiaReason || node.data.label}
          onChange={handleInertiaReasonChange}
          type="textarea"
          placeholder="Describe the resistance to change (e.g., Regulatory barriers, Cultural resistance)"
          rows={3}
        />
      )}

      {/* Quick Reference */}
      <div
        style={{
          marginTop: SPACING.container,
          padding: SPACING.padding.input,
          background: UI_COLORS.backgroundSecondary,
          borderRadius: BORDER_RADIUS.normal,
          fontSize: FONT_SIZES.tiny,
          color: UI_COLORS.textMuted,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: SPACING.tiny }}>Wardley Mapping Guide:</div>
        <div>• Visibility: How visible is this to the user (high = top)</div>
        <div>• Evolution: How commoditized (0=new, 1=commodity)</div>
        <div>• Dependencies flow upward (components depend on those below)</div>
        <div>• Movement: Components evolve left-to-right over time</div>
      </div>
    </div>
  );
};
