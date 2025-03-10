import React, { useState, useEffect, useRef } from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { FiMove } from 'react-icons/fi';
import { DashboardItem, DashboardLayout as DashboardLayoutType } from '../types/types';

interface DashboardLayoutProps {
  layout: DashboardLayoutType;
  onLayoutChange: (newLayout: DashboardLayoutType) => void;
  children: React.ReactNode[];
  editMode?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  layout, 
  onLayoutChange, 
  children,
  editMode = false
}) => {
  const [items, setItems] = useState<DashboardItem[]>(layout.items);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Update local state when layout prop changes
  useEffect(() => {
    setItems(layout.items);
  }, [layout]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (!editMode) return;
    
    dragItem.current = index;
    setIsDragging(true);
    setDraggedItemIndex(index);
    
    // Set ghost image (optional)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
      
      // Create a custom drag image
      const dragImage = e.currentTarget.cloneNode(true) as HTMLDivElement;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.opacity = '0.5';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 20, 20);
      
      // Remove the element after drag ends
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (!editMode) return;
    
    e.preventDefault();
    dragOverItem.current = index;
    
    // Add visual indicator for drop target
    const gridItems = document.querySelectorAll('.dashboard-grid-item');
    gridItems.forEach((item, i) => {
      if (i === index) {
        (item as HTMLElement).style.borderTop = '2px dashed #1976d2';
      } else {
        (item as HTMLElement).style.borderTop = 'none';
      }
    });
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!editMode || dragItem.current === null || dragOverItem.current === null) return;
    
    e.preventDefault();
    
    // Remove visual indicators
    const gridItems = document.querySelectorAll('.dashboard-grid-item');
    gridItems.forEach((item) => {
      (item as HTMLElement).style.borderTop = 'none';
    });
    
    // Reorder items
    const newItems = [...items];
    const draggedItem = newItems[dragItem.current];
    
    // Remove item from original position
    newItems.splice(dragItem.current, 1);
    
    // Insert at new position
    newItems.splice(dragOverItem.current, 0, draggedItem);
    
    // Update order property for each item
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index
    }));
    
    // Update state
    setItems(reorderedItems);
    setIsDragging(false);
    setDraggedItemIndex(null);
    
    // Notify parent component
    onLayoutChange({
      ...layout,
      items: reorderedItems
    });
    
    // Reset refs
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItemIndex(null);
    
    // Remove visual indicators
    const gridItems = document.querySelectorAll('.dashboard-grid-item');
    gridItems.forEach((item) => {
      (item as HTMLElement).style.borderTop = 'none';
    });
  };

  // Filter visible items and sort by order
  const visibleItems = items
    .filter(item => item.visible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <Grid container spacing={3}>
      {visibleItems.map((item, index) => {
        // Find the corresponding child component
        const childComponent = children.find((child: any) => 
          child.props['data-id'] === item.id
        );

        if (!childComponent) return null;

        return (
          <Grid 
            item 
            xs={12} 
            sm={item.width === 1 ? 12 : item.width === 2 ? 6 : item.width === 3 ? 4 : 3}
            md={item.width === 1 ? 12 : item.width === 2 ? 6 : item.width === 3 ? 4 : 3}
            key={item.id}
            className="dashboard-grid-item"
            draggable={editMode}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            style={{
              opacity: isDragging && draggedItemIndex === index ? 0.5 : 1,
              cursor: editMode ? 'grab' : 'default'
            }}
          >
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                height: '100%',
                position: 'relative',
                border: isDragging && draggedItemIndex === index ? '2px dashed #1976d2' : 'none'
              }}
            >
              {editMode && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    cursor: 'grab',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: 1,
                    px: 1
                  }}
                >
                  <FiMove style={{ marginRight: 4 }} />
                  <Typography variant="caption">Drag</Typography>
                </Box>
              )}
              {childComponent}
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default DashboardLayout;
