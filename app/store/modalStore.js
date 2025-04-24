import DataProcessors from '../utils/processors.js';
import { LS_KEYS, saveSetting, loadSetting } from '../utils/localStorage.js';
import { useProjectsStore } from './projectsStore.js'; // Import projects store

// Access Pinia global
const { defineStore } = Pinia;

export const useModalStore = defineStore('modal', {
  state: () => ({
    isVisible: false,
    currentProjectId: null,
    isLoading: false,
    error: null,
    projectData: null, 
    activeTab: 'overview' 
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
      this.projectData = data;
    },
    _setActiveTab(tabId) {
      this.activeTab = tabId;
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
      this._setActiveTab('overview'); // Reset to default tab

      // Save state to localStorage
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const expiresAt = now + oneHour;
      const modalState = { projectId, expiresAt };
      saveSetting(LS_KEYS.ACTIVE_MODAL, modalState);
      // console.log(`Modal Store (Pinia): Saved modal state to localStorage`, modalState);

      // Fetch detailed project data using projectsStore action
      try {
        const data = await projectsStore.fetchProjectDetails(projectId);
        // Process data (assuming processor is available)
        const processedData = DataProcessors.processProjectDetailsData(data, data.Contacts);
        this._setProjectData(processedData);
        this._setError(null);
      } catch (error) {
        console.error("Modal Store (Pinia): Error fetching project details:", error);
        this._setError(error.message || 'Failed to load project details.');
        this._setProjectData(null);
      } finally {
        this._setLoading(false);
      }
    },

    closeModal() {
      // console.log("Modal Store (Pinia): Closing modal.");
      this._setVisibility(false);
      this._setProjectId(null);
      this._setProjectData(null);
      this._setLoading(false);
      this._setError(null);
      // Clear state from localStorage
      localStorage.removeItem(LS_KEYS.ACTIVE_MODAL);
      // console.log("Modal Store (Pinia): Cleared modal state from localStorage");
    },

    setActiveTab(tabId) {
      this._setActiveTab(tabId);
    }
  }
}); 