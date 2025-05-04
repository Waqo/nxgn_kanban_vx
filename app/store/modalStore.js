import DataProcessors from '../utils/processors.js';
import { LS_KEYS, saveSetting, loadSetting } from '../utils/localStorage.js';
import { useProjectsStore } from './projectsStore.js'; // Import projects store
import { logActivity } from '../services/activityLogService.js';
import { useUiStore } from './uiStore.js';
import { logErrorToZoho } from '../services/errorLogService.js';

// Access Pinia global
const { defineStore } = Pinia;

export const useModalStore = defineStore('modal', {
  state: () => ({
    isVisible: false,
    currentProjectId: null,
    isLoading: false,
    error: null,
    projectData: null, 
    activeTab: 'overview', // Default tab
    isPreviewVisible: false,
    previewUrl: null,
    previewTitle: null,
    previewIsDirectImage: false,
    previewDownloadUrl: null,
    previewContext: null,
    isComparisonVisible: false,
    comparisonDocIds: [], // Array to hold up to two document IDs
  }),

  getters: {
    // Simple getters can often be accessed directly from state
  },

  actions: {
    // Internal actions (optional, replacement for mutations)
    _setVisibility(isVisible) {
      this.isVisible = isVisible;
    },
    _setProjectId(projectId) {
      this.currentProjectId = projectId;
    },
    _setLoading(isLoading) {
      this.isLoading = isLoading;
    },
    _setError(error) {
      this.error = error;
    },
    _setProjectData(data) {
      console.log('[modalStore._setProjectData] Called. New data is null?', data === null);
      if (data === null) {
        console.trace('[modalStore._setProjectData] Setting projectData to null');
      }
      this.projectData = data;
    },
    _setPreviewDownloadUrl(url) {
        this.previewDownloadUrl = url;
    },
    _setPreviewContext(context) {
        this.previewContext = context;
    },
    _setPreviewVisibility(isVisible) {
     //// console.log(`Modal Store: Setting preview visibility to ${isVisible}`);
      this.isPreviewVisible = isVisible;
    },
    _setPreviewUrl(url) {
     //// console.log(`Modal Store: Setting preview URL to ${url}`);
      this.previewUrl = url;
    },
    _setPreviewTitle(title) {
       //// console.log(`Modal Store: Setting preview title to ${title}`);
        this.previewTitle = title;
    },
    _setPreviewIsDirectImage(isImage) {
       //// console.log(`Modal Store: Setting preview isDirectImage to ${isImage}`);
        this.previewIsDirectImage = isImage;
    },
    _setComparisonVisibility(isVisible) {
       //// console.log(`Modal Store: Setting comparison visibility to ${isVisible}`);
        this.isComparisonVisible = isVisible;
    },
    _setComparisonDocIds(docIds) {
        // Ensure it's always an array, max 2 items
        const validIds = Array.isArray(docIds) ? docIds.slice(0, 2) : [];
       // console.log(`Modal Store: Setting comparison doc IDs to`, validIds);
        this.comparisonDocIds = validIds;
    },

    // Public actions
    async openModal(projectId) {
      const projectsStore = useProjectsStore(); // Get projects store instance

      // console.log(`Modal Store (Pinia): Opening modal for Project ID: ${projectId}`);
      this._setProjectId(projectId);
      this._setProjectData(null); // Clear previous data
      this._setLoading(true);
      this._setError(null);
      this._setVisibility(true);
      this.activeTab = 'overview'; // Reset to default tab **before** saving state
      this.closePreview(); // Ensure preview is closed when main modal opens
      this.closeComparison(); // Close comparison when opening main modal

      // Save state to localStorage, including the active tab
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const expiresAt = now + oneHour;
      const modalState = { projectId, expiresAt, activeTab: this.activeTab }; // Save current tab
      saveSetting(LS_KEYS.ACTIVE_MODAL, modalState);
      //// console.log(`Modal Store (Pinia): Saved modal state to localStorage`, modalState);

      // Fetch detailed project data using projectsStore action
      try {
        const data = await projectsStore.fetchProjectDetails(projectId);
        // Process data (assuming processor is available)
        const processedData = DataProcessors.processProjectDetailsData(data, data.Contacts);
       // console.log('Modal Store (Pinia): Processed projectData for modal:', processedData);
        this._setProjectData(processedData);
        this._setError(null);
      } catch (error) {
        console.error("Modal Store (Pinia): Error fetching project details:", error);
        logErrorToZoho(error, { 
          operation: 'openModal/fetchProjectDetails',
          projectId: projectId,
          details: 'Failed to fetch project details when opening modal.'
        });
        this._setError(error.message || 'Failed to load project details.');
        this._setProjectData(null);
      } finally {
        this._setLoading(false);
      }
    },

    async refreshModalData() {
        if (!this.currentProjectId) {
            console.warn('Modal Store (Pinia): refreshModalData called without currentProjectId.');
            return;
        }

        //// console.log(`Modal Store (Pinia): Refreshing data for Project ID: ${this.currentProjectId}`);
        const projectsStore = useProjectsStore(); 
        const uiStore = useUiStore(); // Get uiStore instance
        const notificationId = `refresh-modal-${Date.now()}`; // Unique ID for notification
        
        uiStore.addNotification({ 
            id: notificationId, 
            type: 'info', 
            message: 'Refreshing project data...', 
            duration: 0 // Persistent
        });

        try {
            const rawData = await projectsStore.fetchProjectDetails(this.currentProjectId);
            const processedData = DataProcessors.processProjectDetailsData(rawData, rawData.Contacts);
            this._setProjectData(processedData); 
            this._setError(null);
            //// console.log(`Modal Store (Pinia): Data refreshed successfully.`);
        } catch (error) {
            console.error("Modal Store (Pinia): Error refreshing project details:", error);
            logErrorToZoho(error, { 
              operation: 'refreshModalData',
              projectId: this.currentProjectId, // Use state for current ID
              details: 'Failed to refresh project details in modal.'
            });
            this._setError(error.message || 'Failed to refresh project details.');
            // Optionally add error notification *here* instead of just setting state?
            // uiStore.addNotification({ type: 'error', message: `Refresh failed: ${error.message}` });
        } finally {
            uiStore.removeNotification(notificationId);
      }
    },

    closeModal() {
      //// console.log("Modal Store (Pinia): Closing modal.");
      this._setVisibility(false);
      this._setProjectId(null);
      this._setProjectData(null);
      this._setLoading(false);
      this._setError(null);
      this.closePreview(); // Close preview when main modal closes
      this.closeComparison(); // Close comparison when closing main modal
      // Clear state from localStorage
      localStorage.removeItem(LS_KEYS.ACTIVE_MODAL);
      //// console.log("Modal Store (Pinia): Cleared modal state from localStorage");
    },

    setActiveTab(tabId) {
      // Update the state
      this.activeTab = tabId;

      // Update the saved state in localStorage if modal is currently open and valid
      if (this.isVisible && this.currentProjectId) {
          const savedModalState = loadSetting(LS_KEYS.ACTIVE_MODAL, null);
          if (savedModalState && savedModalState.projectId === this.currentProjectId && savedModalState.expiresAt > Date.now()) {
              savedModalState.activeTab = tabId; // Update the tab
              saveSetting(LS_KEYS.ACTIVE_MODAL, savedModalState); // Save back
              //// console.log(`Modal Store (Pinia): Updated active tab in localStorage to ${tabId}`);
          }
      }
    },

    openPreview(previewUrl, title = 'Document Preview', isDirectImage = false, downloadUrl = null, context = 'default') {
        if (!previewUrl) {
            console.error('Cannot open preview: Preview URL is missing.');
            return;
        }
        const finalDownloadUrl = downloadUrl || previewUrl;
       // console.log(`Modal Store: openPreview action started. PreviewURL: ${previewUrl}, Title: ${title}, IsImage: ${isDirectImage}, DownloadURL: ${finalDownloadUrl}, Context: ${context}`);
        if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
           // console.log('Modal Store: Revoking previous blob URL:', this.previewUrl);
            URL.revokeObjectURL(this.previewUrl);
        }
        this._setPreviewUrl(previewUrl);
        this._setPreviewTitle(title);
        this._setPreviewIsDirectImage(isDirectImage);
        this._setPreviewDownloadUrl(finalDownloadUrl);
        this._setPreviewContext(context);
        this._setPreviewVisibility(true);
    },

    closePreview() {
       // console.log('Modal Store: closePreview action started.');
        if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
           // console.log('Modal Store: Revoking blob URL on close:', this.previewUrl);
            URL.revokeObjectURL(this.previewUrl);
        }
        this._setPreviewVisibility(false);
        this._setPreviewUrl(null);
        this._setPreviewTitle(null);
        this._setPreviewIsDirectImage(false);
        this._setPreviewDownloadUrl(null);
        this._setPreviewContext(null);
    },

    openComparison() {
        if (this.comparisonDocIds.length === 2) {
           // console.log('Modal Store: Opening comparison view.');
            this._setComparisonVisibility(true);
        } else {
            console.warn('Modal Store: Cannot open comparison view, less than 2 documents selected.');
        }
    },

    closeComparison() {
       // console.log('Modal Store: Closing comparison view.');
        this._setComparisonVisibility(false);
        this.clearComparisonDocs(); // *** ADDED: Clear selection on close ***
    },

    setComparisonDocs(docIds) {
        // Allow setting directly (used by DocumentsTab)
         this._setComparisonDocIds(docIds);
    },

    clearComparisonDocs() {
       // console.log('Modal Store: Clearing comparison document selection.');
        this._setComparisonDocIds([]);
    }
  }
}); 