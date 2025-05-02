import ZohoAPIService from '../services/zohoCreatorAPI.js';
import { logActivity } from '../services/activityLogService.js';
import { useUiStore } from './uiStore.js';
import { useModalStore } from './modalStore.js';
import { logErrorToZoho } from '../services/errorLogService.js';
import {
    REPORT_PERMITTING,
    FORM_PERMITTING
} from '../config/constants.js';
// --- Import Date Formatter ---
import { formatDateTimeForAPI } from '../utils/helpers.js'; 

const { defineStore } = Pinia;

export const usePermittingStore = defineStore('permitting', {
    state: () => ({
        // Specific state not likely needed, relying on modal refresh
    }),
    actions: {
        /**
         * Adds a new Permitting record for a project.
         */
        async addPermitRecord({ projectId, permitData }) {
            const uiStore = useUiStore();
            const modalStore = useModalStore();

            if (!projectId || !permitData) {
                throw new Error('Project ID and permit data are required.');
            }

            // Construct payload - Format dates using helper
            const payload = {
                data: {
                    Project: projectId, 
                    Permit_Status: permitData.Permit_Status,
                    Permit_Number: permitData.Permit_Number || null, 
                    Permit_Submission_Date: formatDateTimeForAPI(permitData.Permit_Submission_Date),
                    Permit_Approval_Date: formatDateTimeForAPI(permitData.Permit_Approval_Date),
                    Interconnection_Status: permitData.Interconnection_Status,
                    Interconnection_Number: permitData.Interconnection_Number || null,
                    Interconnection_Submission_Date: formatDateTimeForAPI(permitData.Interconnection_Submission_Date),
                    Interconnection_Approval_Date: formatDateTimeForAPI(permitData.Interconnection_Approval_Date),
                    Tags: Array.isArray(permitData.Tags) ? Array.from(permitData.Tags) : [],
                    Problem: permitData.Problem
                }
            };
            
            console.log('Permitting Store: Adding Permit Payload:', payload);
            const notificationId = `add-permit-${Date.now()}`;
            uiStore.addNotification({ id: notificationId, type: 'info', message: 'Adding permit record...', duration: 0 });

            try {
                const response = await ZohoAPIService.addRecord(FORM_PERMITTING, payload);
                
                if (response.code !== 3000) {
                     throw new Error(response.message || 'Failed to add permit record.');
                }

                uiStore.removeNotification(notificationId);
                uiStore.addNotification({ type: 'success', message: 'Permit record added successfully!' });

                logActivity(projectId, 'Permitting record created.');

                await modalStore.refreshModalData(); // Refresh modal 
                return response.data; 
            } catch (error) {
                uiStore.removeNotification(notificationId);
                console.error('Permitting Store: Error adding permit:', error);
                logErrorToZoho(error, { 
                    operation: 'addPermitRecord',
                    projectId: projectId,
                    permitData: permitData,
                    details: 'API call failed during permit record creation.'
                });
                uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to add permit record: ${error.message}` });
                throw error; 
            }
        },

        /**
         * Updates an existing Permitting record.
         */
        async updatePermitRecord({ permitId, permitData }) {
            const uiStore = useUiStore();
            const modalStore = useModalStore();
            const projectId = modalStore.currentProjectId; // Get project ID for logging

            if (!permitId || !permitData) {
                throw new Error('Permit ID and permit data are required for update.');
            }

            // Construct payload - Format dates using helper
             const payload = {
                data: {
                    Permit_Status: permitData.Permit_Status,
                    Permit_Number: permitData.Permit_Number || null, 
                    Permit_Submission_Date: formatDateTimeForAPI(permitData.Permit_Submission_Date),
                    Permit_Approval_Date: formatDateTimeForAPI(permitData.Permit_Approval_Date),
                    Interconnection_Status: permitData.Interconnection_Status,
                    Interconnection_Number: permitData.Interconnection_Number || null,
                    Interconnection_Submission_Date: formatDateTimeForAPI(permitData.Interconnection_Submission_Date),
                    Interconnection_Approval_Date: formatDateTimeForAPI(permitData.Interconnection_Approval_Date),
                    Tags: Array.isArray(permitData.Tags) ? Array.from(permitData.Tags) : [],
                    Problem: permitData.Problem
                }
            };
            
             // Don't send ID in the payload data
            // delete payload.data.ID; // formData doesn't have ID anyway

            console.log('Permitting Store: Updating Permit Payload:', permitId, payload);
             const notificationId = `update-permit-${permitId}-${Date.now()}`;
            uiStore.addNotification({ id: notificationId, type: 'info', message: 'Updating permit record...', duration: 0 });

            try {
                const response = await ZohoAPIService.updateRecordById(REPORT_PERMITTING, permitId, payload);
                
                if (response.code !== 3000) {
                     throw new Error(response.message || 'Failed to update permit record.');
                }

                uiStore.removeNotification(notificationId);
                uiStore.addNotification({ type: 'success', message: 'Permit record updated successfully!' });

                 if (projectId) {
                     logActivity(projectId, 'Permitting record updated.');
                 }

                await modalStore.refreshModalData(); // Refresh modal
                return response.data; 
            } catch (error) {
                uiStore.removeNotification(notificationId);
                console.error('Permitting Store: Error updating permit:', error);
                logErrorToZoho(error, { 
                    operation: 'updatePermitRecord',
                    permitId: permitId,
                    projectId: projectId,
                    permitData: permitData,
                    details: 'API call failed during permit record update.'
                });
                uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to update permit record: ${error.message}` });
                throw error; 
            }
        }
    }
}); 