/**
 * AnnotationOverlay - Renders annotations on the canvas
 *
 * Displays different annotation types:
 * - Sticky notes (yellow notes with text)
 * - Text boxes (white boxes with text)
 *
 * @version 1.0.0
 */

import * as React from 'react';
import type { Annotation } from '../../types/timeline';
import { SPACING, FONT_SIZES, UI_COLORS, BORDER_RADIUS } from '../../constants/ui-constants';

interface AnnotationOverlayProps {
  /** All annotations to render */
  annotations: Annotation[];
  /** Selected annotation ID */
  selectedAnnotationId: string | null;
  /** Callback when annotation is clicked */
  onAnnotationClick: (id: string) => void;
  /** Callback when annotation is dragged */
  onAnnotationDrag: (id: string, x: number, y: number) => void;
  /** Callback when annotation drag ends */
  onAnnotationDragEnd: (id: string) => void;
  /** Callback when annotation text is updated */
  onAnnotationTextUpdate: (
    id: string,
    text: string,
    formatting?: { fontSize?: number; bold?: boolean; underline?: boolean }
  ) => void;
  /** Callback when annotation is resized */
  onAnnotationResize: (id: string, width: number, height: number) => void;
}

/**
 * StickyNote Annotation Component
 */
const StickyNoteAnnotation: React.FC<{
  annotation: Annotation;
  isSelected: boolean;
  onClick: () => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: () => void;
  onTextUpdate: (
    text: string,
    formatting?: { fontSize?: number; bold?: boolean; underline?: boolean }
  ) => void;
}> = ({ annotation, isSelected, onClick, onDrag, onDragEnd, onTextUpdate }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(annotation.data.text || '');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if (isEditing) return; // Don't drag while editing
    e.stopPropagation();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - annotation.position.x,
      y: e.clientY - annotation.position.y,
    });
    onClick();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(annotation.data.text || '');
  };

  const handleSave = () => {
    onTextUpdate(editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(annotation.data.text || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      // Cmd+Enter to save
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      // Escape to cancel
      e.preventDefault();
      handleCancel();
    }
  };

  // Focus textarea when entering edit mode
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      onDrag(newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onDrag, onDragEnd]);

  const color = annotation.data.color || '#FFD700'; // Yellow default

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        left: `${annotation.position.x}px`,
        top: `${annotation.position.y}px`,
        width: `${annotation.data.width || 200}px`,
        height: `${annotation.data.height || 150}px`,
        backgroundColor: color,
        border: isSelected
          ? `2px solid ${UI_COLORS.interactiveAccent}`
          : isEditing
            ? `2px solid ${UI_COLORS.interactiveAccent}`
            : '1px solid rgba(0,0,0,0.1)',
        borderRadius: BORDER_RADIUS.small,
        padding: SPACING.padding.card,
        boxShadow: isEditing ? '0 4px 16px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.15)',
        cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
        userSelect: isEditing ? 'text' : 'none',
        zIndex: isSelected || isEditing ? 100 : 50,
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          style={{
            width: '100%',
            height: '100%',
            fontSize: FONT_SIZES.small,
            color: '#333',
            fontFamily: 'var(--font-text)',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            resize: 'none',
          }}
        />
      ) : (
        <div
          style={{
            fontSize: FONT_SIZES.small,
            color: '#333',
            fontFamily: 'var(--font-text)',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            height: '100%',
          }}
        >
          {annotation.data.text || 'Double-click to edit...'}
        </div>
      )}
    </div>
  );
};

/**
 * Simple markdown parser for basic markdown syntax
 * Supports: **bold**, *italic*, # headers, - lists
 */
const parseMarkdown = (text: string): React.ReactNode[] => {
  console.log('BAC4: parseMarkdown called with text:', text);
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    // Handle headers (# Header)
    if (line.startsWith('# ')) {
      const headerText = line.substring(2);
      elements.push(
        <div
          key={lineIndex}
          style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '8px', marginBottom: '4px' }}
        >
          {parseInlineMarkdown(headerText)}
        </div>
      );
    }
    // Handle headers (## Header)
    else if (line.startsWith('## ')) {
      const headerText = line.substring(3);
      elements.push(
        <div
          key={lineIndex}
          style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '6px', marginBottom: '3px' }}
        >
          {parseInlineMarkdown(headerText)}
        </div>
      );
    }
    // Handle bullet lists (- Item)
    else if (line.trim().startsWith('- ')) {
      const listText = line.trim().substring(2);
      elements.push(
        <div key={lineIndex} style={{ marginLeft: '16px' }}>
          • {parseInlineMarkdown(listText)}
        </div>
      );
    }
    // Regular text
    else {
      elements.push(<div key={lineIndex}>{parseInlineMarkdown(line) || '\u00A0'}</div>);
    }
  });

  return elements;
};

/**
 * Parse inline markdown (bold, italic)
 */
const parseInlineMarkdown = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let key = 0;

  while (currentText.length > 0) {
    // Match **bold**
    const boldMatch = currentText.match(/^(.*?)\*\*(.*?)\*\*/);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(<strong key={key++}>{boldMatch[2]}</strong>);
      currentText = currentText.substring(boldMatch[0].length);
      continue;
    }

    // Match *italic*
    const italicMatch = currentText.match(/^(.*?)\*(.*?)\*/);
    if (italicMatch) {
      if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
      parts.push(<em key={key++}>{italicMatch[2]}</em>);
      currentText = currentText.substring(italicMatch[0].length);
      continue;
    }

    // No more markdown, add rest as plain text
    parts.push(<span key={key++}>{currentText}</span>);
    break;
  }

  return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
};

/**
 * TextBox Annotation Component
 */
const TextBoxAnnotation: React.FC<{
  annotation: Annotation;
  isSelected: boolean;
  onClick: () => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: () => void;
  onTextUpdate: (
    text: string,
    formatting?: { fontSize?: number; bold?: boolean; underline?: boolean }
  ) => void;
  onResize: (width: number, height: number) => void;
}> = ({ annotation, isSelected, onClick, onDrag, onDragEnd, onTextUpdate, onResize }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(annotation.data.text || '');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Resize state
  const [isResizing, setIsResizing] = React.useState(false);
  const [resizeHandle, setResizeHandle] = React.useState<string | null>(null);
  const [resizeStart, setResizeStart] = React.useState({
    width: 0,
    height: 0,
    mouseX: 0,
    mouseY: 0,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (isEditing) return; // Don't drag while editing
    e.stopPropagation();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - annotation.position.x,
      y: e.clientY - annotation.position.y,
    });
    onClick();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(annotation.data.text || '');
  };

  const handleSave = () => {
    onTextUpdate(editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(annotation.data.text || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      // Cmd+Enter to save
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      // Escape to cancel
      e.preventDefault();
      handleCancel();
    }
  };

  // Focus textarea when entering edit mode
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      onDrag(newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onDrag, onDragEnd]);

  // Resize effect
  React.useEffect(() => {
    if (!isResizing || !resizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.mouseX;
      const deltaY = e.clientY - resizeStart.mouseY;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      // Calculate new dimensions based on which handle is being dragged
      if (resizeHandle.includes('right')) {
        newWidth = Math.max(100, resizeStart.width + deltaX);
      }
      if (resizeHandle.includes('left')) {
        newWidth = Math.max(100, resizeStart.width - deltaX);
      }
      if (resizeHandle.includes('bottom')) {
        newHeight = Math.max(50, resizeStart.height + deltaY);
      }
      if (resizeHandle.includes('top')) {
        newHeight = Math.max(50, resizeStart.height - deltaY);
      }

      onResize(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, resizeStart, onResize]);

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      width: annotation.data.width || 250,
      height: annotation.data.height || 100,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  };

  const color = annotation.data.color || '#FFFFFF';

  return (
    <>
      {/* Text Box */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          position: 'absolute',
          left: `${annotation.position.x}px`,
          top: `${annotation.position.y}px`,
          width: `${annotation.data.width || 250}px`,
          height: `${annotation.data.height || 100}px`,
          backgroundColor: color,
          border: isSelected
            ? `2px solid ${UI_COLORS.interactiveAccent}`
            : isEditing
              ? `2px solid ${UI_COLORS.interactiveAccent}`
              : `2px solid ${UI_COLORS.border}`,
          borderRadius: BORDER_RADIUS.normal,
          padding: SPACING.padding.card,
          boxShadow: isEditing ? '0 4px 16px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.1)',
          cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
          userSelect: isEditing ? 'text' : 'none',
          zIndex: isSelected || isEditing ? 100 : 50,
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            style={{
              width: '100%',
              height: '100%',
              fontSize: FONT_SIZES.small,
              color: UI_COLORS.textNormal,
              fontFamily: 'var(--font-text)',
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              resize: 'none',
            }}
          />
        ) : (
          <div
            style={{
              fontSize: FONT_SIZES.small,
              color: UI_COLORS.textNormal,
              fontFamily: 'var(--font-text)',
              overflow: 'auto',
              height: '100%',
            }}
          >
            {annotation.data.text ? parseMarkdown(annotation.data.text) : 'Double-click to edit...'}
          </div>
        )}
      </div>

      {/* Resize Handles - Only shown when selected and not editing */}
      {isSelected && !isEditing && (
        <>
          {/* Corner Handles */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}
            style={{
              position: 'absolute',
              left: `${annotation.position.x - 4}px`,
              top: `${annotation.position.y - 4}px`,
              width: '8px',
              height: '8px',
              backgroundColor: UI_COLORS.interactiveAccent,
              border: `1px solid #fff`,
              borderRadius: '50%',
              cursor: 'nwse-resize',
              zIndex: 101,
            }}
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')}
            style={{
              position: 'absolute',
              left: `${annotation.position.x + (annotation.data.width || 250) - 4}px`,
              top: `${annotation.position.y - 4}px`,
              width: '8px',
              height: '8px',
              backgroundColor: UI_COLORS.interactiveAccent,
              border: `1px solid #fff`,
              borderRadius: '50%',
              cursor: 'nesw-resize',
              zIndex: 101,
            }}
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')}
            style={{
              position: 'absolute',
              left: `${annotation.position.x - 4}px`,
              top: `${annotation.position.y + (annotation.data.height || 100) - 4}px`,
              width: '8px',
              height: '8px',
              backgroundColor: UI_COLORS.interactiveAccent,
              border: `1px solid #fff`,
              borderRadius: '50%',
              cursor: 'nesw-resize',
              zIndex: 101,
            }}
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}
            style={{
              position: 'absolute',
              left: `${annotation.position.x + (annotation.data.width || 250) - 4}px`,
              top: `${annotation.position.y + (annotation.data.height || 100) - 4}px`,
              width: '8px',
              height: '8px',
              backgroundColor: UI_COLORS.interactiveAccent,
              border: `1px solid #fff`,
              borderRadius: '50%',
              cursor: 'nwse-resize',
              zIndex: 101,
            }}
          />

          {/* Edge Handles */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
            style={{
              position: 'absolute',
              left: `${annotation.position.x + (annotation.data.width || 250) / 2 - 4}px`,
              top: `${annotation.position.y - 4}px`,
              width: '8px',
              height: '8px',
              backgroundColor: UI_COLORS.interactiveAccent,
              border: `1px solid #fff`,
              borderRadius: '50%',
              cursor: 'ns-resize',
              zIndex: 101,
            }}
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
            style={{
              position: 'absolute',
              left: `${annotation.position.x + (annotation.data.width || 250) - 4}px`,
              top: `${annotation.position.y + (annotation.data.height || 100) / 2 - 4}px`,
              width: '8px',
              height: '8px',
              backgroundColor: UI_COLORS.interactiveAccent,
              border: `1px solid #fff`,
              borderRadius: '50%',
              cursor: 'ew-resize',
              zIndex: 101,
            }}
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
            style={{
              position: 'absolute',
              left: `${annotation.position.x + (annotation.data.width || 250) / 2 - 4}px`,
              top: `${annotation.position.y + (annotation.data.height || 100) - 4}px`,
              width: '8px',
              height: '8px',
              backgroundColor: UI_COLORS.interactiveAccent,
              border: `1px solid #fff`,
              borderRadius: '50%',
              cursor: 'ns-resize',
              zIndex: 101,
            }}
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
            style={{
              position: 'absolute',
              left: `${annotation.position.x - 4}px`,
              top: `${annotation.position.y + (annotation.data.height || 100) / 2 - 4}px`,
              width: '8px',
              height: '8px',
              backgroundColor: UI_COLORS.interactiveAccent,
              border: `1px solid #fff`,
              borderRadius: '50%',
              cursor: 'ew-resize',
              zIndex: 101,
            }}
          />
        </>
      )}
    </>
  );
};

/**
 * AnnotationOverlay Component
 *
 * Renders all annotations as positioned overlays on the canvas.
 */
export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  annotations,
  selectedAnnotationId,
  onAnnotationClick,
  onAnnotationDrag,
  onAnnotationDragEnd,
  onAnnotationTextUpdate,
  onAnnotationResize,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Let clicks pass through to canvas
        zIndex: 5,
      }}
    >
      {annotations.map((annotation) => {
        const isSelected = annotation.id === selectedAnnotationId;
        const commonProps = {
          annotation,
          isSelected,
          onClick: () => onAnnotationClick(annotation.id),
          onDrag: (x: number, y: number) => onAnnotationDrag(annotation.id, x, y),
          onDragEnd: () => onAnnotationDragEnd(annotation.id),
          onTextUpdate: (
            text: string,
            formatting?: { fontSize?: number; bold?: boolean; underline?: boolean }
          ) => onAnnotationTextUpdate(annotation.id, text, formatting),
        };

        // Re-enable pointer events for annotations themselves
        const wrapperStyle = { pointerEvents: 'auto' as const };

        switch (annotation.type) {
          case 'sticky-note':
            return (
              <div key={annotation.id} style={wrapperStyle}>
                <StickyNoteAnnotation {...commonProps} />
              </div>
            );
          case 'text-box':
            return (
              <div key={annotation.id} style={wrapperStyle}>
                <TextBoxAnnotation
                  {...commonProps}
                  onResize={(width: number, height: number) =>
                    onAnnotationResize(annotation.id, width, height)
                  }
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
