// app/store/commissionsStore.js

// --- Import Dependencies ---
import ZohoAPIService from '../services/zohoCreatorAPI.js';
import { logActivity } from '../services/activityLogService.js';
import { logErrorToZoho } from '../services/errorLogService.js';
import { useUiStore } from './uiStore.js';
import { useModalStore } from './modalStore.js';
import { useLookupsStore } from './lookupsStore.js'; // Needed for refreshing sales reps
import {
    REPORT_SALES_REPS,
    REPORT_PROJECTS,
    FIELD_PROJECT_ACTIVE_COMMISSION_RATE,
    FIELD_PROJECT_M1_AMOUNT,
    FIELD_PROJECT_M1_STATUS,
    FIELD_PROJECT_M1_PAID_DATE,
    FIELD_PROJECT_M2_AMOUNT,
    FIELD_PROJECT_M2_STATUS,
    FIELD_PROJECT_M2_PAID_DATE,
    FIELD_PROJECT_M3_AMOUNT, // <-- Ensure M3 Amount is imported
    FIELD_PROJECT_M3_STATUS, 
    FIELD_PROJECT_M3_PAID_DATE,
    FIELD_PROJECT_ADVANCE_AMOUNT,
    FIELD_PROJECT_ADVANCE_STATUS,
    FIELD_PROJECT_ADVANCE_PAID_DATE
    // Add FIELD_SALES_REP_NAME, FIELD_SALES_REP_EMAIL etc. if needed, or assume they are part of the nested Name object
} from '../config/constants.js';
import { formatDateTimeForZohoAPI, formatCurrency } from '../utils/helpers.js'; // For formatting paid dates & currency

// --- Pinia Definition ---
const { defineStore } = Pinia;

export const useCommissionsStore = defineStore('commissions', {
    // --- State --- 
    // This store primarily handles actions, but might need state for loading/errors related to its specific operations
    state: () => ({
        isUpdatingSalesRep: false,
        isUpdatingMilestones: false,
        isUpdatingRate: false,
        error: null, // General error for commission operations
    }),

    // --- Getters --- (If needed later)
    getters: {},

    // --- Actions ---
    actions: {
        // Internal helper to set loading state
        _setLoading(operation, isLoading) {
            if (operation === 'salesRep') this.isUpdatingSalesRep = isLoading;
            else if (operation === 'milestones') this.isUpdatingMilestones = isLoading;
            else if (operation === 'rate') this.isUpdatingRate = isLoading;
        },
        // Internal helper to set error
        _setError(error) {
            this.error = error?.message || error || 'An unknown error occurred.';
        },
        // Internal helper to clear error
        _clearError() {
            this.error = null;
        },

        /**
         * Action to update master Sales Rep record.
         * Called from EditSalesRepModal.
         */
        async updateSalesRepDetails({ salesRepId, updatedData, originalRepName }) {
            this._setLoading('salesRep', true);
            this._clearError();
            const uiStore = useUiStore();
            const lookupsStore = useLookupsStore();
            const modalStore = useModalStore();

            if (!salesRepId) {
                this._setError('Sales Rep ID is missing.');
                uiStore.addNotification({ type: 'error', message: 'Cannot update Sales Rep: ID is missing.'});
                this._setLoading('salesRep', false);
                throw new Error('Sales Rep ID is missing.');
            }

            // Construct the payload explicitly field-by-field
            const payload = {
                data: {
                    Commercial_Commission_Rate: updatedData.Commercial_Commission_Rate,
                    Regular_Commission_Rate: updatedData.Regular_Commission_Rate,
                    Email: updatedData.Email,
                    Name: { // Ensure nested object is also explicitly created
                        first_name: updatedData.Name?.first_name || '',
                        last_name: updatedData.Name?.last_name || ''
                    },
                    Phone: updatedData.Phone,
                    Shared_Commission_Rate: updatedData.Shared_Commission_Rate
                }
             }; // END Explicit Payload Construction

            const loadingNotificationId = `update-salesrep-${salesRepId}-${Date.now()}`;
            uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: `Updating Sales Rep ${originalRepName || salesRepId}...`, duration: 0 });

            try {
                const response = await ZohoAPIService.updateRecordById(REPORT_SALES_REPS, salesRepId, payload);
                // --- ADDED Log Full Response ---
                console.log("CommissionsStore DEBUG: Full response from updateSalesRepDetails API call:", response);
                
                if (response.code !== 3000) {
                    console.error('Zoho API Error (updateSalesRepDetails):', response);
                    throw new Error(response.message || 'Failed to update sales rep details.');
                }

                uiStore.removeNotification(loadingNotificationId);
                uiStore.addNotification({ type: 'success', message: `Sales Rep ${updatedData?.Name?.first_name || originalRepName} updated successfully!` });
                
                // Log Activity
                logActivity(null, `Updated Sales Rep details for '${updatedData?.Name?.first_name || originalRepName}' (ID: ${salesRepId})`); // Log without project ID if it's a general update

                // Refresh relevant data
                await Promise.all([
                    lookupsStore.fetchSalesReps(), // Refresh the list in lookups
                    modalStore.refreshModalData() // Refresh modal in case the updated rep is displayed
                ]);
                // --- ADDED Log after refresh calls ---
                console.log("CommissionsStore DEBUG: Refreshes (fetchSalesReps, refreshModalData) completed after updateSalesRepDetails.");

                return response.data; // Return response.data on success

            } catch (error) {
                console.error(`Error updating sales rep ${salesRepId}:`, error);
                this._setError(error);
                logErrorToZoho(error, {
                  operation: 'updateSalesRepDetails',
                  salesRepId: salesRepId,
                  updatedDataAttempted: updatedData,
                  details: 'API call failed during sales rep update.'
                });
                uiStore.removeNotification(loadingNotificationId);
                uiStore.addNotification({ type: 'error', title: 'Update Failed', message: `Failed to update Sales Rep: ${error.message}` });
                throw error; // Re-throw
            } finally {
                this._setLoading('salesRep', false);
            }
        },

        /**
         * Action to update project-specific commission milestones.
         * Called from CommissionsTab.
         */
        async updateProjectMilestones({ projectId, updatedMilestonesData, originalMilestonesData }) {
            this._setLoading('milestones', true);
            this._clearError();
            const uiStore = useUiStore();
            const modalStore = useModalStore();

            if (!projectId || !updatedMilestonesData || !originalMilestonesData) {
                this._setError('Project ID and milestone data (updated & original) are required.');
                uiStore.addNotification({ type: 'error', message: 'Cannot update milestones: Missing required data.'});
                this._setLoading('milestones', false);
                throw new Error('Project ID and milestone data (updated & original) are required.');
            }

            // --- Construct Payload and Activity Log Details ---
            const payload = { data: {} };
            let activityLogDetails = [];
            
            // --- Updated Fields Map (including M3 Amount) ---
            const fieldsMap = {
                advance: {
                    amount: FIELD_PROJECT_ADVANCE_AMOUNT,
                    status: FIELD_PROJECT_ADVANCE_STATUS,
                    paidDate: FIELD_PROJECT_ADVANCE_PAID_DATE,
                    label: 'Advance'
                },
                M1: {
                    amount: FIELD_PROJECT_M1_AMOUNT,
                    status: FIELD_PROJECT_M1_STATUS,
                    paidDate: FIELD_PROJECT_M1_PAID_DATE,
                    label: 'M1'
                },
                M2: {
                    amount: FIELD_PROJECT_M2_AMOUNT,
                    status: FIELD_PROJECT_M2_STATUS,
                    paidDate: FIELD_PROJECT_M2_PAID_DATE,
                    label: 'M2'
                },
                M3: {
                    amount: FIELD_PROJECT_M3_AMOUNT, // Include M3 Amount field
                    status: FIELD_PROJECT_M3_STATUS,
                    paidDate: FIELD_PROJECT_M3_PAID_DATE,
                    label: 'M3'
                },
            };

            for (const milestoneId of Object.keys(fieldsMap)) {
                const updated = updatedMilestonesData.find(m => m.id === milestoneId);
                const original = originalMilestonesData.find(m => m.id === milestoneId);
                const config = fieldsMap[milestoneId];
                
                if (!updated || !original) {
                    console.warn(`Missing original or updated data for milestone ${milestoneId}, skipping comparison.`);
                    continue; 
                }

                let statusChanged = false; // Flag to track if status changed in this iteration
                let dateChangedManually = false; // Flag to track if date was changed independently
                
                // --- Compare Status --- 
                if (config.status) {
                    const updatedStatus = updated.status || 'Pending';
                    const originalStatus = original.status || 'Pending';
                    if (updatedStatus !== originalStatus) {
                         payload.data[config.status] = updatedStatus;
                         activityLogDetails.push(`${config.label} Status to ${updatedStatus}`);
                         statusChanged = true; // Set flag
                         
                         // Update Paid Date based *only* on status change IF status changed
                         const paidDateForStatusChange = updatedStatus === 'Paid' && updated.paidDate ? formatDateTimeForZohoAPI(updated.paidDate) : "";
                         payload.data[config.paidDate] = paidDateForStatusChange;
                         // Log date change implicitly via status
                    }
                }
                
                // --- Compare Amount (Applies to Advance, M1, M2, M3) --- 
                if (config.amount) { 
                    const updatedAmount = parseFloat(updated.amount) || 0;
                    const originalAmount = parseFloat(original.amount) || 0;
                    if (Math.abs(updatedAmount - originalAmount) > 0.001) { // Compare floats carefully
                        payload.data[config.amount] = updatedAmount;
                        activityLogDetails.push(`${config.label} Amount to ${formatCurrency(updatedAmount)}`);
                    }
                }
                
                // --- Compare Paid Date (Only if Status didn't change OR if it changed TO 'Paid') ---
                // We need to check if the date was manually changed while status was 'Paid', 
                // or if the status changed TO 'Paid' and the date provided differs from the original.
                 if (config.paidDate && !statusChanged) { // Only check date if status didn't change
                     const updatedDate = updated.paidDate ? new Date(updated.paidDate).getTime() : null;
                     const originalDate = original.paidDate ? new Date(original.paidDate).getTime() : null;
                     
                     // Check if dates are different (handle nulls)
                     if (updatedDate !== originalDate) {
                        payload.data[config.paidDate] = updatedDate ? formatDateTimeForZohoAPI(updated.paidDate) : ""; // Format for API
                        const dateStr = updatedDate ? new Date(updated.paidDate).toLocaleDateString() : 'None';
                        activityLogDetails.push(`${config.label} Paid Date to ${dateStr}`);
                     }
                 } else if (config.paidDate && statusChanged && payload.data[config.status] === 'Paid') {
                    // If status *did* change to 'Paid', check if the date differs from original date anyway (user might have set status and date)
                    // The payload already contains the date from the status change block, but we might need to log it differently
                    const updatedDate = updated.paidDate ? new Date(updated.paidDate).getTime() : null;
                    const originalDate = original.paidDate ? new Date(original.paidDate).getTime() : null;
                    if (updatedDate !== originalDate) {
                       // Log the specific date change *in addition* to the status change if desired
                       // The payload is already correct from the status block
                       // Example: activityLogDetails.push(`${config.label} Paid Date explicitly set to ${new Date(updated.paidDate).toLocaleDateString()}`); 
                    } 
                 }
            }
            
            // --- Final Check for Payload --- 
            if (Object.keys(payload.data).length === 0) {
                 uiStore.addNotification({ type: 'info', message: 'No milestone changes detected to save.' });
                 this._setLoading('milestones', false);
                 return; // Exit if no payload data
            }

            if (activityLogDetails.length === 0) activityLogDetails.push("changes saved"); 

            const loadingNotificationId = `update-milestones-${projectId}-${Date.now()}`;
            uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: 'Saving milestone changes...', duration: 0 });

            try {
                console.log(`CommissionsStore: Updating project ${projectId} milestones with payload:`, payload.data);
                const response = await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, payload);
                console.log(`CommissionsStore: API Response for project ${projectId} milestone update:`, response);

                if (response.code !== 3000) {
                    console.error('Zoho API Error (updateProjectMilestones):', response);
                    throw new Error(response.message || `Failed to update project milestones (Code: ${response.code})`);
                }

                uiStore.removeNotification(loadingNotificationId);
                uiStore.addNotification({ type: 'success', message: 'Milestones updated successfully!' });

                // Log Granular Activity
                logActivity(projectId, `Updated Commission Milestones: ${activityLogDetails.join(', ')}`);

                // Refresh modal data
                await modalStore.refreshModalData();

                return response.data;

            } catch (error) {
                console.error(`Error updating milestones for project ${projectId}:`, error);
                this._setError(error);
                logErrorToZoho(error, {
                  operation: 'updateProjectMilestones',
                  projectId: projectId,
                  payloadAttempted: payload,
                  details: 'API call failed during milestone update.'
                });
                uiStore.removeNotification(loadingNotificationId);
                uiStore.addNotification({ type: 'error', title: 'Update Failed', message: `Failed to update milestones: ${error.message}` });
                throw error; // Re-throw
            } finally {
                this._setLoading('milestones', false);
            }
        },

        /**
         * Action to update the project's active commission rate type.
         * Called from CommissionsTab.
         */
        async updateProjectActiveRate({ projectId, newRateType, oldRateType }) {
            this._setLoading('rate', true);
            this._clearError();
            const uiStore = useUiStore();
            const modalStore = useModalStore();

            if (!projectId) {
                this._setError('Project ID is required.');
                uiStore.addNotification({ type: 'error', message: 'Cannot update rate: Project ID missing.'});
                this._setLoading('rate', false);
                throw new Error('Project ID is required.');
            }
            
            const payload = { data: { [FIELD_PROJECT_ACTIVE_COMMISSION_RATE]: newRateType || "" } }; // Send empty string if null/undefined

            const loadingNotificationId = `update-rate-${projectId}-${Date.now()}`;
            uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: `Setting active rate to ${newRateType || 'None'}...`, duration: 0 });

            try {
                const response = await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, payload);

                if (response.code !== 3000) {
                    console.error('Zoho API Error (updateProjectActiveRate):', response);
                    throw new Error(response.message || 'Failed to update active commission rate.');
                }

                uiStore.removeNotification(loadingNotificationId);
                uiStore.addNotification({ type: 'success', message: `Active commission rate set to ${newRateType || 'None'}!` });

                // Log Granular Activity
                const logMsg = oldRateType
                    ? `Changed Active Commission Rate from '${oldRateType}' to '${newRateType || 'None'}'`
                    : `Set Active Commission Rate to '${newRateType || 'None'}'`;
                logActivity(projectId, logMsg);

                // Refresh modal data
                await modalStore.refreshModalData();

                return response.data;

            } catch (error) {
                console.error(`Error updating active rate for project ${projectId}:`, error);
                this._setError(error);
                 logErrorToZoho(error, {
                  operation: 'updateProjectActiveRate',
                  projectId: projectId,
                  newRateType: newRateType,
                  details: 'API call failed during active rate update.'
                });
                uiStore.removeNotification(loadingNotificationId);
                uiStore.addNotification({ type: 'error', title: 'Update Failed', message: `Failed to update active rate: ${error.message}` });
                throw error; // Re-throw
            } finally {
                this._setLoading('rate', false);
            }
        },
    }
}); 