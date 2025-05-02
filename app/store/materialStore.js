import ZohoAPIService from '../services/zohoCreatorAPI.js';
import { logActivity } from '../services/activityLogService.js';
import { useUiStore } from './uiStore.js';
import { useModalStore } from './modalStore.js';
import {
    FORM_BILL_OF_MATERIALS,
    REPORT_BILL_OF_MATERIALS
} from '../config/constants.js';
import { logErrorToZoho } from '../services/errorLogService.js';

const { defineStore } = Pinia;

export const useMaterialStore = defineStore('materials', {
  state: () => ({}), // No specific state needed for now
  actions: {
    async addMaterial({ projectId, materialData }) {
        const uiStore = useUiStore();
        const modalStore = useModalStore();

        if (!projectId || !materialData) {
            throw new Error('Project ID and material data are required.');
        }

        // Validate required fields from materialData (Use camelCase)
        if (!materialData.category || !materialData.manufacturer || !materialData.model || materialData.quantity == null || materialData.quantity <= 0) {
             uiStore.addNotification({ type: 'error', message: 'Category, Manufacturer, Model, and Quantity are required.', duration: 4000 });
             throw new Error('Missing required material fields.');
        }

        // Construct payload using camelCase from materialData
        const payload = {
            data: {
                Project: projectId,
                Category: materialData.category,
                Manufacturer: materialData.manufacturer,
                Model: materialData.model,
                Quantity: materialData.quantity,
                Unit_Price: materialData.unitPrice || 0, // Use camelCase here too
                Total_Price: materialData.totalPrice || 0 // Use camelCase here too
            }
        };

        console.log('Material Store: Adding Material Payload:', payload);
        uiStore.addNotification({ type: 'info', message: 'Adding material...', duration: 0, id: 'add-material-loading' });

        try {
            const response = await ZohoAPIService.addRecord(FORM_BILL_OF_MATERIALS, payload);
            
            // Check if response indicates success (adjust based on actual Zoho response)
            if (response.code !== 3000) {
                 throw new Error(response.message || 'Failed to add material record.');
            }

            uiStore.removeNotification('add-material-loading');
            uiStore.addNotification({ type: 'success', message: 'Material added successfully!' });

            const logText = `Added Material: ${materialData.quantity}x ${materialData.manufacturer} ${materialData.model}`;
            logActivity(projectId, logText);

            await modalStore.refreshModalData(); // Refresh modal to show new material
            return response.data; 
        } catch (error) {
            uiStore.removeNotification('add-material-loading');
            console.error('Material Store: Error adding material:', error);
            logErrorToZoho(error, { 
                operation: 'addMaterial',
                projectId: projectId,
                materialData: materialData,
                details: 'API call failed during material record creation.'
            });
            uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to add material: ${error.message}` });
            throw error; 
        }
    },
    // --- Add updateMaterial Action --- 
    async updateMaterial({ materialId, materialData }) {
        const uiStore = useUiStore();
        const modalStore = useModalStore();
        const projectId = modalStore.projectData?.ID; // Get project ID for logging

        if (!materialId || !materialData || !projectId) {
            throw new Error('Material ID, data, and Project ID are required for update.');
        }
        
        // Construct only the fields that are typically editable
        // Read from materialData using camelCase, send PascalCase to API
        const payload = {
            data: {
                Manufacturer: materialData.manufacturer,
                Model: materialData.model,
                Quantity: materialData.quantity,
                Unit_Price: materialData.unitPrice,
                Total_Price: materialData.totalPrice
                // Category is usually not editable after creation
            }
        };
        
        console.log('Material Store: Updating Material Payload:', materialId, payload);
        uiStore.addNotification({ type: 'info', message: 'Updating material...', duration: 0, id: `update-material-${materialId}` });

         try {
            const response = await ZohoAPIService.updateRecordById(REPORT_BILL_OF_MATERIALS, materialId, payload);
            
            if (response.code !== 3000) {
                 throw new Error(response.message || 'Failed to update material record.');
            }

            uiStore.removeNotification(`update-material-${materialId}`);
            uiStore.addNotification({ type: 'success', message: 'Material updated successfully!' });

            // Fix log text to use camelCase
            const logText = `Updated Material: ${materialData.quantity}x ${materialData.manufacturer} ${materialData.model}`;
            logActivity(projectId, logText);

            await modalStore.refreshModalData(); // Refresh modal to show updated material
            return response.data; 
        } catch (error) {
            uiStore.removeNotification(`update-material-${materialId}`);
            console.error('Material Store: Error updating material:', error);
            logErrorToZoho(error, { 
                operation: 'updateMaterial',
                projectId: projectId,
                materialId: materialId,
                materialData: materialData,
                details: 'API call failed during material record update.'
            });
            uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to update material: ${error.message}` });
            throw error; 
        }
    },
    // --- Add deleteMaterial Action ---
    async deleteMaterial({ materialId }) {
        const uiStore = useUiStore();
        const modalStore = useModalStore();
        const projectId = modalStore.projectData?.ID; // Get project ID for logging

        if (!materialId || !projectId) {
             throw new Error('Material ID and Project ID are required for deletion.');
        }
        
        console.log('Material Store: Deleting Material:', materialId);
        uiStore.addNotification({ type: 'info', message: 'Deleting material...', duration: 0, id: `delete-material-${materialId}` });

        try {
            // Optional: Fetch material details first for better logging?
            // const materialDetails = await ZohoAPIService.getRecordById(REPORT_BILL_OF_MATERIALS, materialId);
            // const logText = `Deleted Material: ${materialDetails?.Quantity}x ${materialDetails?.Manufacturer} ${materialDetails?.Model}`;

            const response = await ZohoAPIService.deleteRecordById(REPORT_BILL_OF_MATERIALS, materialId);
            
            // Check ONLY the top-level response code for non-success
            if (response.code !== 3000) {
                 // Throw error using the message from the response if available
                 throw new Error(response.message || `API Error Code ${response.code} during delete`);
            }
            
            // If code is 3000, proceed as success
            uiStore.removeNotification(`delete-material-${materialId}`);
            uiStore.addNotification({ type: 'success', message: 'Material deleted successfully!' });

            // Log generic activity after successful deletion
            logActivity(projectId, `Deleted Material ID: ${materialId}`);

            await modalStore.refreshModalData(); // Refresh modal 
            return true; 
        } catch (error) {
            uiStore.removeNotification(`delete-material-${materialId}`);
            console.error('Material Store: Error deleting material:', error);
            logErrorToZoho(error, { 
                operation: 'deleteMaterial',
                projectId: projectId,
                materialId: materialId,
                details: 'API call failed during material record deletion.'
            });
            uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to delete material: ${error.message}` });
            throw error; 
        }
    }
  }
}); 