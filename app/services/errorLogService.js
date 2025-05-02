import ZohoAPIService from './zohoCreatorAPI.js';
import { useUserStore } from '../store/userStore.js';
import { useModalStore } from '../store/modalStore.js'; // May be needed for context
import { FORM_LOGS } from '../config/constants.js'; // We will add this constant later

/**
 * Logs an error to the Zoho Creator "Add_Logs" form.
 * This function runs in the background and swallows errors during the logging process itself.
 *
 * @param {Error} error - The error object caught.
 * @param {object} [contextInfo={}] - Optional additional context (e.g., { componentName, vueInfo, operation, parameters }).
 */
export async function logErrorToZoho(error, contextInfo = {}) {
    console.log('logErrorToZoho called:', error, contextInfo); // Initial log for verification

    if (!error) {
        console.warn("errorLogService: Skipping log, no error object provided.");
        return;
    }

    try {
        const userStore = useUserStore();
        const modalStore = useModalStore(); // Instantiate if needed for context

        const currentUser = userStore.currentUser;
        const userId = currentUser?.id || null;
        const projectId = contextInfo?.projectId || modalStore?.currentProjectId || null; // Get project ID if available

        // --- Construct the payload ---
        const payload = {
            data: {
                Log_Source: "Widget",
                Severity: "Error",
                Status: "New",
                User: userId, // Send user ID (null if unavailable)
                Related_Record_ID: projectId, // Send project ID (null if unavailable)
                Log_Info: error.message || 'No error message provided',
                Stack_Trace: typeof error.stack === 'string' ? error.stack : JSON.stringify(error.stack), // Ensure stack is a string
                Context_Details: JSON.stringify(contextInfo, null, 2), // Pretty print JSON context
                Source_Location: contextInfo?.componentName || contextInfo?.operation || 'Unknown Location'
                // Log_Time is set automatically by Zoho initial value
            }
        };

        console.log('Sending error log payload:', payload);

        // --- Send to Zoho (Fire and Forget - note the lack of await here) ---
        ZohoAPIService.addRecord(FORM_LOGS, payload)
            .then(response => {
                if (response.code !== 3000) {
                     console.error(`errorLogService: Failed to add log record via API. Response:`, response);
                 } else {
                    // Optional: Log success to console only if needed for debugging
                    // console.log(`errorLogService: Successfully logged error for user ${userId}, project ${projectId}`);
                 }
            })
            .catch(apiError => {
                // Log errors *during the logging process* to the console ONLY
                console.error("errorLogService: CRITICAL - Error submitting log to Zoho:", apiError, "Original error:", error);
            });

    } catch (outerError) {
        // Catch errors in getting user/context *before* the API call
        console.error("errorLogService: CRITICAL - Error preparing error log payload:", outerError, "Original error:", error);
    }
}

// Example Usage (will be integrated into global handler and specific catches later):
// try {
//   throw new Error("Something went wrong!");
// } catch (e) {
//   logErrorToZoho(e, { componentName: 'MyComponent', details: 'During fetch data' });
// } 