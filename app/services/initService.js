// app/services/initService.js

// Import Pinia Stores
import { useUiStore } from '../store/uiStore.js';
import { useLookupsStore } from '../store/lookupsStore.js';
import { useUserStore } from '../store/userStore.js';
import { useProjectsStore } from '../store/projectsStore.js';
import { useModalStore } from '../store/modalStore.js';

// Import Local Storage Utilities
import { LS_KEYS, loadSetting } from '../utils/localStorage.js';

/**
 * Initializes the application by fetching all essential data.
 * Manages global loading and error states via the UI store.
 */
export async function initializeApp() {
  // Get instances of all necessary stores *inside* the function
  const uiStore = useUiStore();
  const lookupsStore = useLookupsStore();
  const userStore = useUserStore();
  const projectsStore = useProjectsStore();
  const modalStore = useModalStore();

  // Basic check to prevent re-initialization if needed (optional)
  // Could add a flag in uiStore if more complex logic is required
  // if (uiStore.appInitialized) { // Assuming an appInitialized flag exists
  //    console.log("App Init Service: Already initialized.");
  //    return;
  // }

  // console.log("App Init Service: Starting initialization...");
  uiStore.setGlobalLoading(true);
  uiStore.setGlobalError(null);
  // uiStore.setAppInitialized(false); // Set initialized state if using flag

  try {
    // --- Step 1: Fetch Lookups (Pinia) ---
    // console.log("App Init Service: Fetching Lookups...");
    await lookupsStore.fetchRequiredLookups();
    // console.log("App Init Service: Lookups fetched.");

    // --- Step 2a: Fetch User (Pinia) ---
    // console.log("App Init Service: Fetching Current User...");
    await userStore.fetchCurrentUser();
    // console.log("App Init Service: User fetched.");

    // --- Step 2b: Fetch Projects (Pinia) ---
    // console.log("App Init Service: Fetching Initial Projects...");
    await projectsStore.fetchInitialProjects();
    // console.log("App Init Service: Projects fetched.");

    // uiStore.setAppInitialized(true); // Set initialized state
    // console.log("App Init Service: Core data fetching completed.");

    // --- Restore Modal State (Pinia) ---
    const savedModalState = loadSetting(LS_KEYS.ACTIVE_MODAL, null);
    if (savedModalState && savedModalState.expiresAt && savedModalState.expiresAt > Date.now()) {
      // console.log("App Init Service: Found valid saved modal state...");
      // Use await here if openModal becomes async and needs completion before app mount
      modalStore.openModal(savedModalState.projectId);
    } else if (savedModalState) {
      // console.log("App Init Service: Found expired modal state. Clearing...");
      localStorage.removeItem(LS_KEYS.ACTIVE_MODAL);
    }

    // console.log("App Init Service: Initialization sequence finished successfully.");

  } catch (error) {
    console.error("App Init Service: CRITICAL ERROR during initialization sequence:", error);
    uiStore.setGlobalError(`Initialization failed: ${error.message || 'Unknown error'}`);
    // uiStore.setAppInitialized(false); // Ensure initialized is false on error
    // Optionally re-throw if you want App.js to catch it
    // throw error; 
  } finally {
    uiStore.setGlobalLoading(false);
    // console.log("App Init Service: Global loading state set to false.");
  }
} 