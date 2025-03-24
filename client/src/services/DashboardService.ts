import { DashboardLayout, DashboardItem, loadDashboardLayout, saveDashboardLayout, DEFAULT_DASHBOARD_LAYOUT } from '../models/Dashboard';

export class DashboardService {
  private layout: DashboardLayout;
  private layoutListeners: Set<(layout: DashboardLayout) => void> = new Set();
  private editModeListeners: Set<(editMode: boolean) => void> = new Set();
  private editMode: boolean = false;
  
  constructor() {
    // Load saved layout or use default
    this.layout = loadDashboardLayout();
  }
  
  /**
   * Get the current dashboard layout
   */
  getLayout(): DashboardLayout {
    return { ...this.layout };
  }
  
  /**
   * Update the dashboard layout
   */
  updateLayout(layout: DashboardLayout): void {
    this.layout = { ...layout };
    
    // Save to localStorage
    saveDashboardLayout(this.layout);
    
    // Notify listeners
    this.notifyLayoutListeners();
  }
  
  /**
   * Update a specific dashboard item
   */
  updateItem(itemId: string, updates: Partial<DashboardItem>): void {
    const itemIndex = this.layout.items.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      // Create a new items array with the updated item
      const updatedItems = [...this.layout.items];
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updates };
      
      // Update the layout
      this.layout = {
        ...this.layout,
        items: updatedItems
      };
      
      // Save to localStorage
      saveDashboardLayout(this.layout);
      
      // Notify listeners
      this.notifyLayoutListeners();
    }
  }
  
  /**
   * Toggle visibility of a dashboard item
   */
  toggleItemVisibility(itemId: string): void {
    const item = this.layout.items.find(item => item.id === itemId);
    
    if (item) {
      this.updateItem(itemId, { visible: !item.visible });
    }
  }
  
  /**
   * Reorder dashboard items
   */
  reorderItems(itemIds: string[]): void {
    // Create a map of current items by ID for quick lookup
    const itemsMap = new Map(this.layout.items.map(item => [item.id, item]));
    
    // Create a new items array with the updated order
    const updatedItems = itemIds
      .map(id => itemsMap.get(id))
      .filter((item): item is DashboardItem => !!item)
      .map((item, index) => ({ ...item, order: index }));
    
    // Update the layout
    this.layout = {
      ...this.layout,
      items: updatedItems
    };
    
    // Save to localStorage
    saveDashboardLayout(this.layout);
    
    // Notify listeners
    this.notifyLayoutListeners();
  }
  
  /**
   * Reset the dashboard layout to default
   */
  resetLayout(): void {
    this.layout = { ...DEFAULT_DASHBOARD_LAYOUT };
    
    // Save to localStorage
    saveDashboardLayout(this.layout);
    
    // Notify listeners
    this.notifyLayoutListeners();
  }
  
  /**
   * Get the edit mode state
   */
  isEditMode(): boolean {
    return this.editMode;
  }
  
  /**
   * Toggle edit mode
   */
  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.notifyEditModeListeners();
  }
  
  /**
   * Set edit mode
   */
  setEditMode(editMode: boolean): void {
    if (this.editMode !== editMode) {
      this.editMode = editMode;
      this.notifyEditModeListeners();
    }
  }
  
  /**
   * Subscribe to layout changes
   */
  subscribeToLayout(callback: (layout: DashboardLayout) => void): () => void {
    this.layoutListeners.add(callback);
    
    // Immediately notify with current layout
    callback({ ...this.layout });
    
    // Return unsubscribe function
    return () => {
      this.layoutListeners.delete(callback);
    };
  }
  
  /**
   * Subscribe to edit mode changes
   */
  subscribeToEditMode(callback: (editMode: boolean) => void): () => void {
    this.editModeListeners.add(callback);
    
    // Immediately notify with current edit mode
    callback(this.editMode);
    
    // Return unsubscribe function
    return () => {
      this.editModeListeners.delete(callback);
    };
  }
  
  private notifyLayoutListeners(): void {
    this.layoutListeners.forEach(listener => {
      listener({ ...this.layout });
    });
  }
  
  private notifyEditModeListeners(): void {
    this.editModeListeners.forEach(listener => {
      listener(this.editMode);
    });
  }
}

// Export a singleton instance for use throughout the application
export const dashboardService = new DashboardService();
