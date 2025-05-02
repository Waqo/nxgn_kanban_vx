const { defineStore } = Pinia;
import ZohoAPIService from '../services/zohoCreatorAPI.js';
import { useModalStore } from './modalStore.js';
import { useUiStore } from './uiStore.js';
import { FORM_COMMUNICATION, FIELD_COMMUNICATION_EMAIL_TEMPLATE_LOOKUP } from '../config/constants.js';
import { formatDateTimeForAPI } from '../utils/helpers.js';
import { logActivity } from '../services/activityLogService.js';
import { logErrorToZoho } from '../services/errorLogService.js';

export const useCommunicationsStore = defineStore('communications', {
    state: () => ({
        isLoading: false,
        error: null,
    }),
    actions: {
        async sendSms({ projectId, contactId, userId, message }) {
            const uiStore = useUiStore();
            const modalStore = useModalStore();
            
            // Validation
            if (!projectId || !contactId || !userId || !message?.trim()) {
                console.error('Missing required fields for sending SMS', { projectId, contactId, userId, message });
                uiStore.addNotification({
                    type: 'error',
                    title: 'Missing Information',
                    message: 'Cannot send SMS: Missing required information.'
                });
                return false;
            }

            this.isLoading = true;
            const loadingToastId = `sms-loading-${Date.now()}`;
            uiStore.addNotification({
                id: loadingToastId,
                type: 'info',
                message: 'Sending SMS...',
                duration: 0 // Persistent
            });

            try {
                const payload = {
                    data: {
                        Project: projectId,
                        Communication_Type: "SMS",
                        User: userId, // User sending the SMS
                        Contact: contactId, // Contact receiving the SMS
                        SMS_Type: "OUTGOING",
                        SMS_Content: message.trim()
                    }
                };

                console.log('Sending SMS with payload:', payload);

                const response = await ZohoAPIService.addRecord(FORM_COMMUNICATION, payload);

                if (response.code === 3000) {
                    uiStore.addNotification({
                        type: 'success',
                        message: 'SMS sent successfully.'
                    });
                    
                    await logActivity(projectId, `Sent SMS to contact`, message.trim(), userId);

                    await modalStore.refreshModalData(); 
                    
                    return true; // Indicate success
                } else {
                    console.error('Failed to send SMS:', response);
                    uiStore.addNotification({
                        type: 'error',
                        title: 'Send Error',
                        message: 'Failed to send SMS. Please try again.'
                    });
                    return false;
                }
            } catch (error) {
                console.error('Error sending SMS:', error);
                logErrorToZoho(error, { 
                    operation: 'sendSms',
                    projectId: projectId,
                    contactId: contactId,
                    userId: userId,
                    messageLength: message?.length, // Avoid logging potentially sensitive message content
                    details: 'API call failed during SMS send attempt (addRecord).'
                });
                uiStore.addNotification({
                    type: 'error',
                    title: 'Error',
                    message: 'An error occurred while sending the SMS.'
                });
                return false;
            } finally {
                this.isLoading = false;
                uiStore.removeNotification(loadingToastId);
            }
        },

        async sendEmailTemplate({ projectId, contactId, userId, templateName, contactEmail, templateId }) {
            const uiStore = useUiStore(); // Keep for potential direct error logging if needed
            
             // Validation
            if (!projectId || !contactId || !userId || !templateName || !contactEmail || !templateId) {
                console.error('Missing required fields for sending email template', { projectId, contactId, userId, templateName, contactEmail, templateId });
                return false;
            }
            
            try {
                const payload = {
                    data: {
                        Project: projectId,
                        Contact: contactId,
                        User: userId,
                        Communication_Type: "Email",
                        Email_Type: "Template",
                        Email_Subject: templateName, // The actual template name/subject
                        Email_To: contactEmail, // The email address to send to
                        Email_Status: "Pending",
                        TRIG_Send_Template: "true", // Trigger the Zoho workflow
                        Email_Sent_Time: formatDateTimeForAPI(new Date()),
                        [FIELD_COMMUNICATION_EMAIL_TEMPLATE_LOOKUP]: templateId
                    }
                };

                console.log(`Sending Email Template '${templateName}' with payload:`, payload);

                const response = await ZohoAPIService.addRecord(FORM_COMMUNICATION, payload);

                if (response.code === 3000) {
                    console.log(`Successfully created communication record for template: ${templateName}`);
                    await logActivity(projectId, `Sent Email Template: ${templateName}`, `Triggered sending of template '${templateName}' to ${contactEmail}`, userId);
                    return true; 
                } else {
                    console.error(`Failed to create communication record for template '${templateName}':`, response);
                    return false;
                }
            } catch (error) {
                console.error(`Error sending email template '${templateName}':`, error);
                logErrorToZoho(error, { 
                    operation: 'sendEmailTemplate',
                    projectId: projectId,
                    contactId: contactId,
                    userId: userId,
                    templateId: templateId,
                    templateName: templateName, 
                    contactEmail: contactEmail, // Log target email 
                    details: 'API call failed during email template trigger (addRecord).'
                });
                uiStore.addNotification({ type: 'error', title: 'Error', message: `Failed to send email template ${templateName}.` });
                return false;
            }
        },
    },
}); 