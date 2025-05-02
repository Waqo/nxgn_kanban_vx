import ZohoAPIService from '../services/zohoCreatorAPI.js';
import { logActivity } from '../services/activityLogService.js';
import { useUiStore } from './uiStore.js';
import { useModalStore } from './modalStore.js';
import { logErrorToZoho } from '../services/errorLogService.js';
// Import constants needed for contacts
import {
    REPORT_CONTACTS,
    FORM_CONTACTS,
    FIELD_PROJECT_CONTACT_NAME_LOOKUP, // From Project Form
    REPORT_PROJECTS // Needed for setProjectMainOwner
} from '../config/constants.js';

// Access Pinia global
const { defineStore } = Pinia;

// Define Project lookup field name within Contact form
const FIELD_CONTACT_PROJECT_LOOKUP = 'Project'; 

export const useContactsStore = defineStore('contacts', {
  // No state needed specifically for contacts list *in this store*
  // as the list is part of the projectData in modalStore.
  state: () => ({}), 
  
  actions: {
    async addProjectContact({ projectId, contactData }) {
        const modalStore = useModalStore(); 
        const uiStore = useUiStore();
        const contactsStore = useContactsStore(); // Need this for internal call

        if (!projectId || !contactData) {
            throw new Error('Project ID and contact data are required to add contact.');
        }

        // --- Check if this should be the main owner BEFORE adding ---
        let shouldSetAsMainOwner = false;
        const currentProjectData = modalStore.projectData;
        if (!currentProjectData?.Owner_Name?.ID) {
             shouldSetAsMainOwner = true;
             console.log('Contacts Store (Pinia): No existing main owner. New contact will be set as Owner 1.')
        }
        
        // Construct payload (Default type to Other Project Contact)
        const payload = {
            data: {
                Name: {
                    first_name: contactData.First_Name,
                    last_name: contactData.Last_Name
                },
                Primary_Contact_Type1: 'Other Project Contact',
                Email: contactData.Email || null,
                Phone_Number: contactData.Phone_Number || null,
                Mobile_Phone_Number: contactData.Mobile_Phone_Number || null,
                Business_POC: contactData.Business_POC ? "true" : "false", 
                Job_Title: contactData.Job_Title || null,
                Business_Name: contactData.Business_Name || null,
                [FIELD_CONTACT_PROJECT_LOOKUP]: [projectId] 
            }
        };
        
        // Add Billing Address conditionally
        const hasBillingData = contactData.Billing_Address_1 || contactData.Billing_City || contactData.Billing_State || contactData.Billing_Zip;
        if (contactData.showBillingAddress && hasBillingData) {
             payload.data.Billing_Address = {
                address_line_1: contactData.Billing_Address_1 || '',
                address_line_2: contactData.Billing_Address_2 || '',
                district_city: contactData.Billing_City || '',
                state_province: contactData.Billing_State || '',
                postal_Code: contactData.Billing_Zip || '',
                country: 'USA' 
            };
        }
        
        console.log('Contacts Store (Pinia): Adding Contact Payload (Default Type):', payload);
        let newContactId = null;
        
        try {
            const response = await ZohoAPIService.addRecord(FORM_CONTACTS, payload);
            newContactId = response.data?.ID;

            if (!newContactId) {
                throw new Error("Failed to create contact record or retrieve its ID.");
            }

            uiStore.addNotification({ type: 'success', message: 'Contact added successfully!' });
            
            const formattedName = `${contactData.First_Name || ''} ${contactData.Last_Name || ''}`.trim() || 'Unnamed Contact';
            logActivity(projectId, `Contact created: ${formattedName}`);

            // --- Set as Main Owner if it was the first --- 
            if (shouldSetAsMainOwner) {
                 console.log(`Contacts Store (Pinia): Setting newly created contact ${newContactId} as main owner for project ${projectId}.`);
                 try {
                     // Use internal call, skip refresh as modalStore will refresh after
                     await contactsStore.setProjectMainOwner({ projectId: projectId, contactId: newContactId, skipRefresh: true }); 
                 } catch (ownerError) {
                      console.error('Failed to automatically set new contact as main project owner:', ownerError);
                      // Notify user, but don't block the overall success
                      uiStore.addNotification({ type: 'warning', title: 'Warning', message: `Contact added, but failed to automatically set as Project Owner: ${ownerError.message}` });
                 }
            }

            await modalStore.refreshModalData(); // Refresh to show the new contact (and potentially updated type)
            return response.data; 
        } catch (error) {
            console.error('Contacts Store (Pinia): Error adding contact:', error);
            logErrorToZoho(error, { 
              operation: 'addProjectContact',
              projectId: projectId,
              contactData: contactData, // Log the attempted contact data
              details: 'API call failed during contact creation.'
            });
            uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to add contact: ${error.message}` });
            throw error; 
        }
    },

    async updateProjectContact({ contactId, contactData, skipRefresh = false }) { 
        const modalStore = useModalStore();
        const uiStore = useUiStore();
        // const contactsStore = useContactsStore(); // No longer needed for internal calls here
        const currentProjectId = modalStore.currentProjectId; 
        // const mainOwnerId = modalStore.projectData?.Owner_Name?.ID; // No longer needed here
        
        if (!contactId || !contactData) {
            throw new Error('Contact ID and contact data are required to update contact.');
        }

        const payloadData = {};

        // Handle Name 
        if (contactData.hasOwnProperty('First_Name') || contactData.hasOwnProperty('Last_Name')) {
             const currentContact = modalStore.projectData?.Contacts?.find(c => c.ID === contactId);
             payloadData.Name = {
                first_name: contactData.hasOwnProperty('First_Name') ? contactData.First_Name : currentContact?.Name?.first_name || '',
                last_name: contactData.hasOwnProperty('Last_Name') ? contactData.Last_Name : currentContact?.Name?.last_name || ''
             };
             if (!payloadData.Name.first_name && !payloadData.Name.last_name) {
                 delete payloadData.Name;
             }
        }
        
        // Handle simple fields 
        const simpleFields = ['Email', 'Phone_Number', 'Mobile_Phone_Number', 'Job_Title', 'Business_Name'];
        simpleFields.forEach(field => {
            if (contactData.hasOwnProperty(field) && contactData[field] !== undefined && contactData[field] !== '') {
                payloadData[field] = contactData[field];
            }
        });

        // Handle Business POC
         if (contactData.hasOwnProperty('Business_POC')) {
            payloadData.Business_POC = contactData.Business_POC ? "true" : "false";
        }

        // Handle Billing Address
        if (contactData.hasOwnProperty('showBillingAddress')) {
             const hasBillingData = contactData.Billing_Address_1 || contactData.Billing_City || contactData.Billing_State || contactData.Billing_Zip;
             if (contactData.showBillingAddress && hasBillingData) {
                payloadData.Billing_Address = {
                    address_line_1: contactData.Billing_Address_1 || '',
                    address_line_2: contactData.Billing_Address_2 || '',
                    district_city: contactData.Billing_City || '',
                    state_province: contactData.Billing_State || '',
                    postal_Code: contactData.Billing_Zip || '',
                    country: 'USA'
                };
             }
        }
        
        const payload = { data: payloadData };

        // Prevent sending empty updates
        if (Object.keys(payload.data).length === 0) {
             console.warn(`Contacts Store (Pinia): Skipping update for contact ${contactId} - no changes detected.`);
             return modalStore.projectData?.Contacts?.find(c => c.ID === contactId); 
        }

        console.log(`Contacts Store (Pinia): Updating Contact ${contactId} Payload (Dynamic - No Type):`, payload);

        try {
            const response = await ZohoAPIService.updateRecordById(REPORT_CONTACTS, contactId, payload);
            uiStore.addNotification({ type: 'success', message: 'Contact updated successfully!' });

            // Activity Log 
            if (currentProjectId) {
                 // Use the name from the potentially modified payloadData if available
                 const logFirstName = payloadData.Name?.first_name || contactData.First_Name || '';
                 const logLastName = payloadData.Name?.last_name || contactData.Last_Name || '';
                 const formattedName = `${logFirstName} ${logLastName}`.trim() || 'Unnamed Contact';
                 logActivity(currentProjectId, `Contact updated: ${formattedName}`);
             } else {
                 console.warn('Contacts Store (Pinia): Could not log contact update activity, missing currentProjectId from modalStore.');
             }
            
            if (!skipRefresh) {
                await modalStore.refreshModalData(); 
            }

            return response.data; 
        } catch (error) {
             console.error(`Contacts Store (Pinia): Error updating contact ${contactId}:`, error);
             logErrorToZoho(error, { 
               operation: 'updateProjectContact',
               contactId: contactId,
               updateData: contactData, // Log the attempted update data
               details: 'API call failed during contact update.'
             });
             uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to update contact: ${error.message}` });
             throw error;
        }
    },

    async deleteProjectContact({ contactId }) {
        const modalStore = useModalStore();
        const uiStore = useUiStore();
        const currentProjectId = modalStore.currentProjectId; 

        if (!contactId) {
            throw new Error('Contact ID is required to delete contact.');
        }

        console.log(`Contacts Store (Pinia): Deleting Contact ${contactId}`);

        // Log Activity BEFORE deleting
        if (currentProjectId) {
            logActivity(currentProjectId, `Contact deleted.`); 
        } else {
            console.warn('Contacts Store (Pinia): Could not log contact delete activity, missing currentProjectId from modalStore.');
        }

        try {
            await ZohoAPIService.deleteRecordById(REPORT_CONTACTS, contactId);
            uiStore.addNotification({ type: 'success', message: 'Contact deleted successfully!' });

            // Refresh if main owner deleted
            if (currentProjectId) {
                console.log('Contacts Store (Pinia): Main owner deleted, refreshing modal data...');
                await modalStore.refreshModalData();
            } else {
                 console.log('Contacts Store (Pinia): Non-main owner deleted, skipping full refresh.');
                 // Consider optimistically removing from modalStore.projectData.Contacts?
            }
            
            return true;
        } catch (error) {
            console.error(`Contacts Store (Pinia): Error deleting contact ${contactId}:`, error);
            logErrorToZoho(error, { 
              operation: 'deleteProjectContact',
              contactId: contactId,
              projectId: currentProjectId, // Include project ID if available
              details: 'API call failed during contact deletion.'
            });
            uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to delete contact: ${error.message}` });
            throw error;
        }
    },

    async setProjectMainOwner({ projectId, contactId, skipRefresh = false }) { 
        const modalStore = useModalStore();
        const uiStore = useUiStore();
        const contactsStore = useContactsStore(); // Use self for internal calls
        const oldOwnerId = modalStore.projectData?.Owner_Name?.ID;
        const notificationId = `set-owner-${Date.now()}`;

        if (!projectId || !contactId) {
            throw new Error('Project ID and Contact ID are required to set main owner.');
        }
        
        const payload = { data: { [FIELD_PROJECT_CONTACT_NAME_LOOKUP]: contactId } };

        console.log(`Contacts Store (Pinia): Setting Main Owner for Project ${projectId} to Contact ${contactId}`);
        uiStore.addNotification({ id: notificationId, type: 'info', message: 'Setting main owner...', duration: 0 });

        try {
            // 1. Update Project Record
            await ZohoAPIService.updateRecordById(REPORT_PROJECTS, projectId, payload);
            
            logActivity(projectId, `Main owner set.`); 

             // 2. Update Contact Types 
             try {
                 // 2a. Update New Owner to Owner 1
                 console.log(`Updating new owner (${contactId}) type to Owner 1...`);
                 await contactsStore.updateProjectContact({ 
                     contactId: contactId, 
                     // Explicitly set the type
                     contactData: { Primary_Contact_Type1: 'Owner 1' }, 
                     skipRefresh: true 
                 }); 

                 // 2b. Update Old Owner (if applicable) back to Other Project Contact
                 if (oldOwnerId && oldOwnerId !== contactId) {
                     console.log(`Updating old owner (${oldOwnerId}) type...`);
                     await contactsStore.updateProjectContact({ 
                         contactId: oldOwnerId, 
                         // Explicitly set the type back
                         contactData: { Primary_Contact_Type1: 'Other Project Contact' },
                         skipRefresh: true 
                     }); 
                 }
             } catch (typeError) {
                 console.error('Error syncing contact types after setting main owner:', typeError);
                 uiStore.addNotification({ type: 'warning', title: 'Warning', message: `Main owner updated, but failed to sync contact types: ${typeError.message}` });
             }

            // 3. Final Refresh (if not skipped)
            if (!skipRefresh) {
                await modalStore.refreshModalData();
            }
            uiStore.addNotification({ type: 'success', message: 'Main project owner updated successfully!' });
            return true;
        } catch (error) {
             console.error(`Contacts Store (Pinia): Error setting main owner for project ${projectId}:`, error);
             logErrorToZoho(error, { 
               operation: 'setProjectMainOwner',
               projectId: projectId,
               contactId: contactId,
               details: 'API call failed during setting main project owner.'
               // Consider logging typeError separately if needed
             });
             uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to set main owner: ${error.message}` });
             throw error;
        } finally {
             uiStore.removeNotification(notificationId);
        }
    }
    
  }
}); 