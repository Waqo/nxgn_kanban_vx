import ZohoAPIService from '../services/zohoCreatorAPI.js';
import { logActivity } from '../services/activityLogService.js';
import { useUserStore } from './userStore.js';
import { useModalStore } from './modalStore.js';
import { useUiStore } from './uiStore.js';
import { logErrorToZoho } from '../services/errorLogService.js';
import { 
    FORM_DOCUMENTS, 
    REPORT_DOCUMENTS, 
    // --- Define specific field names used in this store --- 
    // It's better to define them here or import if they become constants
    // Using string literals for now until confirmed in constants.js
    // FIELD_DOC_NAME: 'Document_Name',
    // FIELD_DOC_TYPE_LOOKUP: 'Doc_Type',
    // FIELD_DOC_IS_REVISION: 'Is_Revision',
    // FIELD_DOC_REVISION_NUMBER: 'Revision_Number', // Need to confirm this API name
    // FIELD_DOC_FILE_UPLOAD: 'File_Upload',
    // FIELD_DOC_FILE_UPLOADED_FLAG: 'File_Uploaded',
    // FIELD_DOC_PROJECT_LOOKUP: 'Project',
    // FIELD_DOC_USER_LOOKUP: 'User_Lookup'
} from '../config/constants.js';
const { defineStore } = Pinia;
// Define field names locally until added to constants.js
const FIELD_DOC_NAME = 'Document_Name';
const FIELD_DOC_TYPE_LOOKUP = 'Doc_Type';
const FIELD_DOC_IS_REVISION = 'Is_Revision';
const FIELD_DOC_REVISION_NUMBER = 'Revision_Number'; // Assumed API Name
const FIELD_DOC_FILE_UPLOAD = 'File_Upload';
const FIELD_DOC_FILE_UPLOADED_FLAG = 'File_Uploaded'; // Assumed API Name
const FIELD_DOC_PROJECT_LOOKUP = 'Project';
const FIELD_DOC_USER_LOOKUP = 'User_Lookup'; // Assumed API Name
const FIELD_TRIG_UPLOAD_WD = 'TRIG_Upload_to_WorkDrive'; // Assumed API Name
const FIELD_TRIG_SEND_INV = 'Trigger_Send_to_Inv'; // Assumed API Name

export const useDocumentsStore = defineStore('documents', {
    state: () => ({
        isUploading: false,
        isUpdating: false, // Add state for tracking updates
        isFetchingBlob: false, // *** ADDED State for blob fetch ***
        // Consider a more detailed progress state if needed per file
        // uploadProgress: {}, 
    }),

    actions: {
        /**
         * Uploads a document file and creates the corresponding record in Zoho Creator.
         * @param {object} payload - The upload details.
         * @param {string} payload.projectId - ID of the project to link the document.
         * @param {File} payload.file - The File object to upload.
         * @param {string} payload.documentName - The name for the document record.
         * @param {string} [payload.documentTypeId=''] - The ID of the Doc_Type lookup.
         * @param {boolean} [payload.isRevision=false] - Whether the document is a revision.
         */
        async uploadDocument({ projectId, file, documentName, documentTypeId = '', isRevision = false }) {
            const userStore = useUserStore();
            const modalStore = useModalStore();
            const uiStore = useUiStore();

            if (!projectId || !file || !documentName) {
                uiStore.addNotification({ type: 'error', message: 'Project ID, file, and document name are required for upload.' });
                console.error('Upload Error: Missing required parameters.');
                return { success: false, error: 'Missing required parameters' };
            }

            const currentUser = userStore.currentUser;
            if (!currentUser || !currentUser.id) {
                 uiStore.addNotification({ type: 'error', message: 'Cannot upload document: User not found.' });
                 console.error('Upload Error: Current user not found.');
                 return { success: false, error: 'User not found' };
            }

            this.isUploading = true;
            const loadingNotificationId = `upload-${file.name}-${Date.now()}`;
            uiStore.addNotification({ 
                id: loadingNotificationId, 
                type: 'info', 
                message: `Uploading ${file.name}...`, 
                duration: 0 // Persistent
            });

            let newRecordId = null;

            try {
                // Step 1: Create the document record
                const recordPayload = {
                    data: {
                        [FIELD_DOC_NAME]: documentName,
                        [FIELD_DOC_TYPE_LOOKUP]: documentTypeId || null, // Send null if empty
                        [FIELD_DOC_IS_REVISION]: isRevision ? "true" : "false",
                        [FIELD_DOC_PROJECT_LOOKUP]: projectId,
                        [FIELD_DOC_FILE_UPLOADED_FLAG]: "false", // Mark as not uploaded yet
                        [FIELD_DOC_USER_LOOKUP]: currentUser.id // Link to current user
                    }
                };
                console.log('Creating document record with payload:', recordPayload);
                const recordResponse = await ZohoAPIService.addRecord(FORM_DOCUMENTS, recordPayload);
                
                if (recordResponse.code !== 3000 || !recordResponse.data?.ID) {
                    console.error('Zoho API Error (addRecord):', recordResponse);
                    throw new Error(recordResponse.message || 'Failed to create document record.');
                }
                newRecordId = recordResponse.data.ID;
                console.log(`Document record created successfully: ID ${newRecordId}`);

                // Step 2: Upload the file
                console.log(`Uploading file to record ${newRecordId}, field ${FIELD_DOC_FILE_UPLOAD}`);
                const uploadResponse = await ZohoAPIService.uploadFile(REPORT_DOCUMENTS, newRecordId, FIELD_DOC_FILE_UPLOAD, file); 
                console.log('File uploaded successfully:', uploadResponse); 

                // Step 3: Update the record to mark file as uploaded (Optional but good practice)
                console.log(`Updating record ${newRecordId} to set ${FIELD_DOC_FILE_UPLOADED_FLAG} = true`);
                const updatePayload = { data: { [FIELD_DOC_FILE_UPLOADED_FLAG]: "true" } };
                const updateResponse = await ZohoAPIService.updateRecordById(REPORT_DOCUMENTS, newRecordId, updatePayload);
                
                if (updateResponse.code !== 3000) {
                    console.warn(`Failed to update File_Uploaded status for record ${newRecordId}:`, updateResponse);
                } else {
                     console.log(`Record ${newRecordId} updated successfully.`);
                }

                // Success
                uiStore.removeNotification(loadingNotificationId);
                uiStore.addNotification({ type: 'success', message: `${file.name} uploaded successfully.` });
                logActivity(projectId, `Uploaded document: ${documentName}`);
                await modalStore.refreshModalData(); 
                this.isUploading = false;
                return { success: true, recordId: newRecordId };

            } catch (error) {
                console.error(`Error uploading document ${file.name}:`, error);
                logErrorToZoho(error, { 
                    operation: 'uploadDocument',
                    projectId: projectId,
                    fileName: file?.name,
                    documentName: documentName,
                    documentTypeId: documentTypeId,
                    isRevision: isRevision,
                    details: `Error during document upload process (step depends on stack trace - ID: ${newRecordId || 'N/A'}).`
                });
                uiStore.removeNotification(loadingNotificationId);
                uiStore.addNotification({ type: 'error', title: 'Upload Failed', message: `${file.name}: ${error.message || 'Unknown error'}` });
                this.isUploading = false;
                return { success: false, error: error.message || 'Unknown error' };
            }
        },

        /**
         * Updates an existing document record's metadata.
         * @param {object} payload - The update details.
         * @param {string} payload.documentId - ID of the document record to update.
         * @param {object} payload.updateData - Object containing fields to update (e.g., { Document_Name: 'New Name', Doc_Type: 'type_id', Is_Revision: true }).
         * @param {string} [payload.projectId] - Project ID for activity logging (optional but recommended).
         */
        async updateDocument({ documentId, updateData, projectId }) {
            const uiStore = useUiStore();
            const modalStore = useModalStore();

            if (!documentId || !updateData) {
                 uiStore.addNotification({ type: 'error', message: 'Document ID and update data are required.' });
                 console.error('Update Error: Missing required parameters.');
                 return { success: false, error: 'Missing required parameters' };
            }
            
            // Validate Document Name
            if (updateData.hasOwnProperty(FIELD_DOC_NAME) && !updateData[FIELD_DOC_NAME]?.trim()) {
                 uiStore.addNotification({ type: 'error', message: 'Document name cannot be empty.' });
                 return { success: false, error: 'Document name cannot be empty' };
            }

            this.isUpdating = true;
            const loadingNotificationId = `update-doc-${documentId}-${Date.now()}`;
            uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: 'Saving changes...', duration: 0 });

            try {
                const payload = { data: { ...updateData } };

                // Convert boolean Is_Revision to string for Zoho API
                if (payload.data.hasOwnProperty(FIELD_DOC_IS_REVISION)) {
                    payload.data[FIELD_DOC_IS_REVISION] = payload.data[FIELD_DOC_IS_REVISION] ? "true" : "false";
                    // Clear Revision_Number if Is_Revision is set to false
                    if (payload.data[FIELD_DOC_IS_REVISION] === "false") {
                        payload.data[FIELD_DOC_REVISION_NUMBER] = null; 
                    }
                }
                // Ensure Doc_Type sends null if empty string
                if (payload.data.hasOwnProperty(FIELD_DOC_TYPE_LOOKUP) && payload.data[FIELD_DOC_TYPE_LOOKUP] === '') {
                    payload.data[FIELD_DOC_TYPE_LOOKUP] = null;
                }

                console.log(`Updating document ${documentId} with payload:`, payload);
                const response = await ZohoAPIService.updateRecordById(REPORT_DOCUMENTS, documentId, payload);

                if (response.code !== 3000) {
                    console.error('Zoho API Error (updateRecordById):', response);
                    throw new Error(response.message || 'Failed to update document.');
                }

                uiStore.removeNotification(loadingNotificationId);
                uiStore.addNotification({ type: 'success', message: 'Document updated successfully.' });
                
                // Log activity (use updated name if available)
                const docNameForLog = updateData[FIELD_DOC_NAME] || 'document';
                if (projectId) {
                    logActivity(projectId, `Updated ${docNameForLog}`);
                }

                await modalStore.refreshModalData(); // Refresh modal data
                this.isUpdating = false;
                return { success: true, data: response.data };

            } catch (error) {
                 console.error(`Error updating document ${documentId}:`, error);
                 logErrorToZoho(error, { 
                    operation: 'updateDocument',
                    projectId: projectId,
                    documentId: documentId,
                    updateData: updateData,
                    details: 'API call failed during document metadata update.'
                 });
                 uiStore.removeNotification(loadingNotificationId);
                 uiStore.addNotification({ type: 'error', title: 'Update Failed', message: error.message || 'Unknown error' });
                 this.isUpdating = false;
                 return { success: false, error: error.message || 'Unknown error' };
            }
        },

        async triggerWorkDriveUpload({ documentId, projectId }) { 
             const uiStore = useUiStore();
             const modalStore = useModalStore();
             
             if (!documentId || !projectId) {
                 uiStore.addNotification({ type: 'error', message: 'Document ID and Project ID are required.'});
                 return { success: false, error: 'Missing required IDs' };
             }

             console.log(`Triggering WorkDrive upload for document ${documentId}`);
             const loadingNotificationId = `trigger-wd-${documentId}-${Date.now()}`;
             uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: 'Initiating WorkDrive upload...', duration: 0 });

             try {
                 const payload = { data: { [FIELD_TRIG_UPLOAD_WD]: "true" } };
                 const response = await ZohoAPIService.updateRecordById(REPORT_DOCUMENTS, documentId, payload);

                 if (response.code !== 3000) {
                     console.error('Zoho API Error (triggerWorkDriveUpload):', response);
                     throw new Error(response.message || 'Failed to trigger WorkDrive upload.');
                 }

                 uiStore.removeNotification(loadingNotificationId);
                 uiStore.addNotification({ type: 'success', message: 'WorkDrive upload initiated. Refreshing data...' });
                 logActivity(projectId, `Triggered WorkDrive upload for document ID ${documentId}`);
                 await modalStore.refreshModalData(); // Refresh data
                 return { success: true };

             } catch (error) {
                 console.error(`Error triggering WorkDrive upload for document ${documentId}:`, error);
                 logErrorToZoho(error, { 
                    operation: 'triggerWorkDriveUpload',
                    projectId: projectId,
                    documentId: documentId,
                    details: 'API call failed when triggering WorkDrive upload.'
                 });
                 uiStore.removeNotification(loadingNotificationId);
                 uiStore.addNotification({ type: 'error', title: 'Action Failed', message: error.message || 'Unknown error' });
                 return { success: false, error: error.message || 'Unknown error' };
             }
        },

        async triggerSendToInvestor({ documentId, projectId }) { 
             const uiStore = useUiStore();
             const modalStore = useModalStore();
             
             if (!documentId || !projectId) {
                 uiStore.addNotification({ type: 'error', message: 'Document ID and Project ID are required.'});
                 return { success: false, error: 'Missing required IDs' };
             }

             console.log(`Triggering Send to Investor for document ${documentId}`);
             const loadingNotificationId = `trigger-inv-${documentId}-${Date.now()}`;
             uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: 'Initiating Send to Investor...', duration: 0 });

             try {
                 const payload = { data: { [FIELD_TRIG_SEND_INV]: "true" } };
                 const response = await ZohoAPIService.updateRecordById(REPORT_DOCUMENTS, documentId, payload);

                 if (response.code !== 3000) {
                     console.error('Zoho API Error (triggerSendToInvestor):', response);
                     throw new Error(response.message || 'Failed to trigger Send to Investor.');
                 }

                 uiStore.removeNotification(loadingNotificationId);
                 uiStore.addNotification({ type: 'success', message: 'Send to Investor initiated. Refreshing data...' });
                 logActivity(projectId, `Triggered Send to Investor for document ID ${documentId}`);
                 await modalStore.refreshModalData(); // Refresh data
                 return { success: true };

             } catch (error) {
                 console.error(`Error triggering Send to Investor for document ${documentId}:`, error);
                 logErrorToZoho(error, { 
                    operation: 'triggerSendToInvestor',
                    projectId: projectId,
                    documentId: documentId,
                    details: 'API call failed when triggering Send to Investor.'
                 });
                 uiStore.removeNotification(loadingNotificationId);
                 uiStore.addNotification({ type: 'error', title: 'Action Failed', message: error.message || 'Unknown error' });
                 return { success: false, error: error.message || 'Unknown error' };
             }
        },

        async deleteDocument({ documentId, projectId, documentName }) {
             const uiStore = useUiStore();
             const modalStore = useModalStore();
             
             if (!documentId || !projectId || !documentName) {
                 uiStore.addNotification({ type: 'error', message: 'Document ID, Project ID, and Name are required for deletion.'});
                 return { success: false, error: 'Missing required parameters for deletion' };
             }

             console.warn(`Attempting to delete document ${documentId}`);
             const loadingNotificationId = `delete-doc-${documentId}-${Date.now()}`;
             uiStore.addNotification({ id: loadingNotificationId, type: 'info', message: `Deleting ${documentName}...`, duration: 0 });

             try {
                const response = await ZohoAPIService.deleteRecordById(REPORT_DOCUMENTS, documentId);
                // deleteRecordById returns a different structure, check nested result
                if (response.code !== 3000 || response.result?.[0]?.code !== 3000) {
                    const nestedError = response.result?.[0];
                    console.error('Zoho API Error (deleteRecordById):', response);
                    throw new Error(nestedError?.message || response.message || 'Failed to delete document.');
                }

                uiStore.removeNotification(loadingNotificationId);
                uiStore.addNotification({ type: 'success', message: `Document '${documentName}' deleted.` });
                logActivity(projectId, `Deleted document: ${documentName}`);
                await modalStore.refreshModalData();
                return { success: true };

             } catch (error) {
                 console.error(`Error deleting document ${documentId}:`, error);
                 logErrorToZoho(error, { 
                    operation: 'deleteDocument',
                    projectId: projectId,
                    documentId: documentId,
                    documentName: documentName,
                    details: 'API call failed during document deletion.'
                 });
                 uiStore.removeNotification(loadingNotificationId);
                 uiStore.addNotification({ type: 'error', title: 'Deletion Failed', message: error.message || 'Unknown error' });
                 return { success: false, error: error.message || 'Unknown error' };
             }
        },

        // *** UPDATED: Fetch Document Blob Action ***
        /**
         * Fetches the raw file content for a document and returns it as a Blob.
         * @param {object} payload
         * @param {string} payload.documentId - The ID of the document record.
         * @param {string} [payload.expectedType='application/pdf'] - The expected MIME type (used if creating Blob).
         * @returns {Promise<Blob>} - A promise that resolves with the file Blob.
         */
        async fetchDocumentBlob({ documentId, expectedType = 'application/pdf' }) {
            const uiStore = useUiStore();
            if (!documentId) {
                throw new Error('Document ID is required to fetch file blob.');
            }
            console.log(`Documents Store: Fetching content for document ${documentId}`);
            this.isFetchingBlob = true;
            try {
                // Assuming FIELD_DOC_FILE_UPLOAD is the correct field API name
                const fileData = await ZohoAPIService.readFile(REPORT_DOCUMENTS, documentId, FIELD_DOC_FILE_UPLOAD);
                
                // Check if the response looks like raw data rather than a Zoho error object
                if (fileData && typeof fileData !== 'object' || fileData instanceof Blob) { 
                    // If it's already a Blob (future-proofing), use it directly
                    if (fileData instanceof Blob) {
                         console.log(`Documents Store: Successfully fetched blob directly for document ${documentId}`);
                         return fileData;
                    }
                    
                    // Otherwise, assume it's raw data and create a Blob
                    console.log(`Documents Store: Received raw data for ${documentId}. Creating Blob...`);
                    try {
                        // Create a blob with the inferred/provided type
                        const blob = new Blob([fileData], { type: expectedType });
                        console.log(`Documents Store: Successfully created blob for document ${documentId}`, blob);
                        return blob;
                    } catch (blobError) {
                         console.error(`Documents Store: Error creating Blob for ${documentId}:`, blobError);
                         throw new Error('Failed to process downloaded file content.');
                    }
                } else {
                     // Handle cases where fileData might be an unexpected object (like a Zoho error response)
                     console.error('Zoho API Error (readFile): Unexpected response format.', fileData);
                     let errorMsg = 'Failed to read file content.';
                     if (typeof fileData === 'object' && fileData?.message) {
                         errorMsg = fileData.message;
                     }
                     throw new Error(errorMsg);
                }

            } catch (error) {
                console.error(`Error fetching document content for ${documentId}:`, error);
                logErrorToZoho(error, { 
                    operation: 'fetchDocumentBlob',
                    documentId: documentId,
                    expectedType: expectedType,
                    details: 'Error fetching or processing document blob content.'
                });
                // Avoid double-notifying if the error came from the API call itself
                if (!error.message?.includes('Failed to read file content')) {
                    uiStore.addNotification({ type: 'error', title: 'File Read Error', message: `Could not read file content: ${error.message || 'Unknown error'}` });
                }
                throw error; // Re-throw for the caller to handle
            } finally {
                this.isFetchingBlob = false;
            }
        },
        // --- End Fetch Blob ---
    }
}); 