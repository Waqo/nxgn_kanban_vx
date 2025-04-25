// app/services/initService.js

// Import Pinia Stores
import { useUiStore } from '../store/uiStore.js';
import { useLookupsStore } from '../store/lookupsStore.js';
import { useUserStore } from '../store/userStore.js';
import { useProjectsStore } from '../store/projectsStore.js';
import { useModalStore } from '../store/modalStore.js';

// Import Local Storage Utilities
import { LS_KEYS, loadSetting } from '../utils/localStorage.js';
// Import Constants for Init Record
import {
  REPORT_KANBAN_INIT,
  KANBAN_INIT_RECORD_ID
} from '../config/constants.js';

// --- CORRECT Import ZohoAPIService ---
import ZohoAPIService from './zohoCreatorAPI.js';

/**
 * Initializes the application by fetching essential data for initial display
 * and then fetching secondary data in the background.
 * Manages global loading and error states via the UI store.
 */
export async function initializeApp() {
  // Get instances of all necessary stores *inside* the function
  const uiStore = useUiStore();
  const lookupsStore = useLookupsStore();
  const userStore = useUserStore();
  const projectsStore = useProjectsStore();
  const modalStore = useModalStore();

  let queryParamsFromUrl = null; // Variable to hold the params

  // --- Fetch Query Params (Fire and Forget, but store result) ---
  ZohoAPIService.getQueryParams()
    .then(queryParams => {
        console.log("App Init Service: Parent Query Params:", queryParams);
        queryParamsFromUrl = queryParams; // Store the result
    })
    .catch(error => {
        // Error is already logged in the service, but we could log context here
        console.error("App Init Service: Failed to get query params during init.");
    });

  // --- Fetch and Log Kanban Init Record (Fire and Forget) ---
  // Pass null for appName (3rd arg) and 'quick_view' for fieldConfig (4th arg)
  // ZohoAPIService.getRecordById(REPORT_KANBAN_INIT, KANBAN_INIT_RECORD_ID, null, 'quick_view')
  //     .then(initRecordData => {
  //         console.log("App Init Service: Kanban Init Record Data (Quick View):", initRecordData);
  //         // You can process or store initRecordData here if needed later
  //     })
  //     .catch(error => {
  //         console.error(`App Init Service: Failed to get Kanban Init Record (ID: ${KANBAN_INIT_RECORD_ID}) during init.`);
  //         // Error is already logged in ZohoAPIService.getRecordById
  //     });

  console.log("App Init Service: Starting initialization...");
  uiStore.setGlobalLoading(true);
  uiStore.setGlobalError(null);

  try {
    // --- Fetch Kanban Init Record First (Await) ---
    console.log("App Init Service: Fetching Kanban Init Record...");
    const initRecordData = await ZohoAPIService.getRecordById(REPORT_KANBAN_INIT, KANBAN_INIT_RECORD_ID, null, 'quick_view');
    console.log("App Init Service: Kanban Init Record Data (Quick View):", initRecordData);

    // --- Phase 1: Fetch Remaining Core Data (Awaited) ---
    // Pass initRecordData to lookupsStore
    console.log("App Init Service: Fetching Core Lookups (using init data) and Initial Projects...");
    
    // Fetch Core Lookups (will use init data) and Projects concurrently
    await Promise.all([
        projectsStore.fetchInitialProjects()
    ]);
    
    // Now process lookups using the fetched data
    await lookupsStore.fetchCoreLookups(initRecordData); // Pass init data
    
    console.log("App Init Service: Core Lookups (Stages/Tranches from init data) and Projects fetched.");

    // --- Fetch Current User (Depends on Core Lookups existing, but fetch is independent) --- 
    console.log("App Init Service: Fetching Current User...");
    // User fetch is now independent of lookups store
    await userStore.fetchCurrentUser();
    console.log("App Init Service: User fetched.");

    // --- Check for projectId in URL *BEFORE* checking localStorage ---
    let openedModalFromUrl = false;
    if (queryParamsFromUrl && queryParamsFromUrl.projectId) {
        const urlProjectId = queryParamsFromUrl.projectId;
        console.log(`App Init Service: Found projectId=${urlProjectId} in URL. Opening modal...`);
        modalStore.openModal(urlProjectId); // Open modal using ID from URL
        openedModalFromUrl = true;
        // Clear any potentially conflicting saved modal state from previous sessions
        localStorage.removeItem(LS_KEYS.ACTIVE_MODAL);
        console.log("App Init Service: Removed potentially conflicting saved modal state.");
    }

    // --- Restore Modal State from localStorage (only if not opened from URL) ---
    if (!openedModalFromUrl) {
        const savedModalState = loadSetting(LS_KEYS.ACTIVE_MODAL, null);
        if (savedModalState && savedModalState.expiresAt && savedModalState.expiresAt > Date.now()) {
          console.log("App Init Service: Found valid saved modal state, restoring...");
          modalStore.openModal(savedModalState.projectId);
        } else if (savedModalState) {
          console.log("App Init Service: Found expired modal state. Clearing...");
          localStorage.removeItem(LS_KEYS.ACTIVE_MODAL);
        }
    }

    // --- Phase 1 Complete: Initial render can happen now ---
    console.log("App Init Service: Phase 1 (Core data) completed. Setting global loading false.");
    uiStore.setGlobalLoading(false); // <<<=== SET LOADING FALSE HERE

    // --- Phase 2: Fetch Filter Lookups (Tags, Reps, Orgs) - Fire and Forget ---
    // These are not awaited, they run in the background after initial render.
    // No need to explicitly call them here, they will be fetched on demand by the toolbar.
    console.log("App Init Service: Filter lookups (Tags, Reps, Orgs) will be fetched on demand.");
    
    console.log("App Init Service: Initialization sequence finished.");

  } catch (error) {
    // Catch errors from Promise.all or fetchCurrentUser if they re-throw
    console.error("App Init Service: CRITICAL ERROR during initialization sequence:", error);
    // Use the error already set in the specific store action if possible,
    // or set a generic one.
    if (!uiStore.globalError) { // Don't overwrite specific errors if stores set them
         uiStore.setGlobalError(`Initialization failed: ${error.message || 'Unknown error'}`);
    }
    // Ensure loading is false even if phase 1 errors out
    uiStore.setGlobalLoading(false); 
  }
  // REMOVE finally block as loading is set earlier
  // finally {
  //   uiStore.setGlobalLoading(false);
  //   console.log("App Init Service: Global loading state set to false.");
  // }
} 