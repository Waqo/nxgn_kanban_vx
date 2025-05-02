const { ref, computed } = Vue; // Use global Vue
const { useDateFormat } = VueUse; // Use global VueUse instead of importing formatDateTime
import { useCommunicationsStore } from '../../../../store/communicationsStore.js';
import { useModalStore } from '../../../../store/modalStore.js'; // For triggering refresh
import { useUiStore } from '../../../../store/uiStore.js';
import BaseGridList from '../../../common/BaseGridList.js'; // Import BaseGridList
import { useLookupsStore } from '../../../../store/lookupsStore.js';
import { FIELD_COMMUNICATION_EMAIL_TEMPLATE_LOOKUP } from '../../../../config/constants.js';

// Assume BaseButton is globally registered or import it

// --- DEFINE Logo URL --- (Store appropriately if used elsewhere)
const LOGO_URL = 'https://contacts.zoho.com/file?t=appaccount&ID=859244706&nocache=1745965521297';

export default {
    name: 'EmailTemplatesSection',
    components: { BaseGridList }, // Register BaseGridList
    props: {
        project: { 
            type: Object, 
            required: true 
        },
        currentUser: { 
            type: Object, 
            required: true 
        }
    },
    setup(props) {
        const communicationsStore = useCommunicationsStore();
        const modalStore = useModalStore();
        const uiStore = useUiStore();
        const lookupsStore = useLookupsStore();

        const selectedTemplates = ref(new Set());
        const isSendingTemplates = ref(false);
        
        const dynamicTemplates = computed(() => lookupsStore.getManualEmailTemplates);

        // Compute last sent time for each template type
        const lastSentTimes = computed(() => {
            const times = {};
            const projectComms = props.project?.Communications || [];
            dynamicTemplates.value.forEach(template => {
                const matchingEmails = projectComms
                    .filter(comm => {
                        return comm.Communication_Type === 'Email' && 
                               comm[FIELD_COMMUNICATION_EMAIL_TEMPLATE_LOOKUP]?.ID === template.id;
                    })
                    .sort((a, b) => { // Sort descending to get the latest
                        const timeA = new Date(a.Email_Sent_Time || a.Added_Time || 0).getTime();
                        const timeB = new Date(b.Email_Sent_Time || b.Added_Time || 0).getTime();
                        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
                    });
                if (matchingEmails.length > 0) {
                    times[template.id] = matchingEmails[0].Email_Sent_Time || matchingEmails[0].Added_Time;
                }
            });
            return times;
        });

        // --- Add Log for lastSentTimes ---
        Vue.watchEffect(() => {
            console.log('EmailTemplatesSection - calculated lastSentTimes:', lastSentTimes.value);
        });
        // --- End Log ---

        const templatesWithStatus = computed(() => {
            return dynamicTemplates.value.map(template => ({
                ...template,
                lastSentTime: lastSentTimes.value[template.id] || null,
                isSelected: selectedTemplates.value.has(template.id)
            }));
        });

        // Format a date string using VueUse's useDateFormat
        const formatDate = (dateString) => {
            if (!dateString) return '';
            return useDateFormat(dateString, 'MM/DD/YY h:mm A').value;
        };

        const toggleTemplate = (templateId) => {
            const newSet = new Set(selectedTemplates.value);
            if (newSet.has(templateId)) {
                newSet.delete(templateId);
            } else {
                newSet.add(templateId);
            }
            selectedTemplates.value = newSet;
        };

        // --- ADD Preview Handler ---
        const handlePreviewClick = (template) => {
            if (!template || !template.body) {
                console.error('Cannot preview: Template data or body is missing.');
                uiStore.addNotification({ type: 'error', message: 'Cannot preview, template body missing.' });
                return;
            }
            
            const contactName = props.project?.Owner_Name?.zc_display_value || '[Contact Name]';
            const addressLine1 = props.project?.Site_Address?.address_line_1 || '';
            const city = props.project?.Site_Address?.district_city || '';
            const state = props.project?.Site_Address?.state_province || '';
            const zip = props.project?.Site_Address?.postal_Code || '';
            const siteAddress = [addressLine1, city, state, zip].filter(Boolean).join(', ') || '[Site Address]';

            let previewBody = template.body;
            previewBody = previewBody.replace(/\{\{contactName\}\}/g, contactName);
            previewBody = previewBody.replace(/\{\{siteAddress\}\}/g, siteAddress);
            
            // Construct the full HTML using the provided wrapper structure
            const fullHtml = `
                <div style="border: solid 1px #E5E5E5; border-radius: 5px; margin: 0px auto; max-width: 600px; width: 600px; background: #fff; font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif;">
                <table cellspacing='0' cellpadding='0' style='width: 100%; font-size: 14px;'>
                <tbody>
                <tr>
                <td style='padding: 32px;'>
                <div style='text-align: center;'><img src='${LOGO_URL}' width='68' height='68' alt='Company Logo'><br><br></div>
                <div><h1 style='margin: 0 0 32px; font-size: 20px; text-align: center;'>${template.title || 'Email Preview'}<br></h1></div>
                <div style='background: #fff; border-radius: 10px; overflow: hidden; border: solid 1px #E5E5E5;'>
                <table cellspacing='0' cellpadding='0' style='width: 100%; font-size: 14px;'>
                <tbody><tr><td><div style='padding: 32px 24px;'>
                <div style='margin-bottom: 20px; line-height: 1.6;'>
                ${previewBody}
                </div>
                <div style='margin-top: 32px; line-height: 1.6; text-align: left;'><p style='margin: 0px;'><span class='size' style='font-size:13px'>Best regards,</span><br></p>
                <h3 style='font-size: 15px; margin: 4px 0 0;'>NexGen Roofing and Solar<br></h3></div>
                </div></td></tr></tbody></table></div>
                <div style='border-top: solid 1px #E5E5E5; padding: 16px 0px; font-size: 12px; color: #A9A9A9; text-align: center;'>
                <p><span class='colour' style='color:rgb(169, 169, 169)'><span class='size' style='font-size: 12px; line-height: 1.5;'>For any issues, please contact <a style='color: #1d72b8;' href='mailto:contact@dcnexgen.com' target='_blank'>contact@dcnexgen.com</a> or call us at +1 2029835396.<br> This email and its contents are confidential and intended solely for the recipient. By continuing, you agree to our <a style='color: #1d72b8;' href='https://nexgenroofingandsolar.com/privacy-policy/' target='_blank'>Privacy Policy</a> and <a style='color: #1d72b8;' href='https://nexgenroofingandsolar.com/terms-of-service/' target='_blank'>Terms and Conditions</a>.</span></span></p>
                </div>
                </td>
                </tr>
                </tbody>
                </table>
                </div>
            `;

            const blob = new Blob([fullHtml], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            
            // Open preview modal with context
            modalStore.openPreview(blobUrl, template.name, false, null, 'emailTemplate');
        };

        const handleSendTemplates = async () => {
            if (selectedTemplates.value.size === 0 || isSendingTemplates.value) return;

            const projectId = props.project?.ID;
            const contactId = props.project?.Owner_Name?.ID;
            const userId = props.currentUser?.id;
            const contactEmail = props.project?.['Owner_Name.Email'];

            // --- Add Debugging Logs ---
            console.log('handleSendTemplates check:');
            console.log('  props.project:', props.project);
            console.log('  props.currentUser:', props.currentUser);
            console.log(`  projectId: ${projectId}`);
            console.log(`  contactId (from Owner_Name.ID): ${contactId}`);
            console.log(`  userId: ${userId}`);
            console.log(`  contactEmail (from Owner_Name.Email): ${contactEmail}`);
            // --- End Debugging Logs ---

            if (!projectId || !contactId || !userId || !contactEmail) {
                uiStore.addNotification({ 
                    type: 'error', 
                    title: 'Missing Information', 
                    message: 'Cannot send email: Missing project, contact, user, or email information.'
                });
                return;
            }

            isSendingTemplates.value = true;
            const loadingToastId = `email-batch-${Date.now()}`;
            uiStore.addNotification({
                id: loadingToastId,
                type: 'info',
                message: `Sending ${selectedTemplates.value.size} email(s)...`,
                duration: 0 // Persistent
            });
            let successes = 0;
            let failures = 0;

            try {
                const sendPromises = [];
                selectedTemplates.value.forEach(templateId => {
                    const template = dynamicTemplates.value.find(t => t.id === templateId);
                    if (template) {
                        sendPromises.push(
                            communicationsStore.sendEmailTemplate({
                                projectId,
                                contactId,
                                userId,
                                templateName: template.subject,
                                templateId: template.id,
                                contactEmail
                            })
                        );
                    }
                });

                const results = await Promise.allSettled(sendPromises);
                
                results.forEach(result => {
                    if (result.status === 'fulfilled' && result.value === true) {
                        successes++;
                    } else {
                        failures++;
                        console.error('Failed to send template:', result.reason || 'Action returned false');
                    }
                });

                uiStore.removeNotification(loadingToastId);

                if (successes > 0) {
                    uiStore.addNotification({ 
                        type: 'success', 
                        message: `${successes} email(s) sent successfully.` 
                    });
                    selectedTemplates.value = new Set(); // Clear selection on success
                    // Refresh modal data only if at least one succeeded
                    await modalStore.refreshModalData();
                } 
                if (failures > 0) {
                    uiStore.addNotification({ 
                        type: 'error', 
                        title: 'Send Error',
                        message: `${failures} email(s) failed to send. Check console for details.`
                    });
                } 
                if (successes === 0 && failures === 0) {
                    uiStore.addNotification({ 
                        type: 'warning', 
                        message: 'No templates were selected or sent.'
                    });
                }

            } catch (error) {
                console.error('Error in handleSendTemplates:', error);
                uiStore.removeNotification(loadingToastId);
                uiStore.addNotification({ 
                    type: 'error', 
                    title: 'Unexpected Error', 
                    message: 'An unexpected error occurred while sending emails.'
                });
            } finally {
                isSendingTemplates.value = false;
            }
        };

        return {
            selectedTemplates,
            isSendingTemplates,
            templatesWithStatus,
            toggleTemplate,
            handleSendTemplates,
            handlePreviewClick,
            formatDate
        };
    },
    template: `
        <div class="email-templates-section">
             <div class="text-right mb-4">
                 <BaseButton 
                     @click="handleSendTemplates"
                     :disabled="selectedTemplates.size === 0 || isSendingTemplates || templatesWithStatus.length === 0"
                     :loading="isSendingTemplates"
                     size="sm"
                     variant="solid"
                     color="blue"
                     class="flex items-center gap-2 inline-flex">
                     <i class="fas fa-paper-plane"></i>
                     <span>Send Selected</span>
                 </BaseButton>
            </div>

             <div v-if="templatesWithStatus.length === 0" class="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-md">
                 No manual email templates available.
             </div>
             
             <BaseGridList 
                 v-else
                 tag="div"
                 cols="1"
                 mdCols="2"
                 gap="3"
             >
                 <div 
                     v-for="template in templatesWithStatus" 
                     :key="template.id"
                     @click="toggleTemplate(template.id)"
                     :class="[
                        'group p-3 border rounded-lg cursor-pointer transition-colors duration-150 relative',
                        template.isSelected ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-200'
                     ]"
                 >
                     <div class="flex items-start justify-between">
                        <div class="flex-1 pr-8">
                            <p class="font-medium text-sm text-gray-800">{{ template.name }}</p>
                             <p class="text-xs text-gray-600 mt-1">{{ template.description }}</p>
                            <p v-if="template.lastSentTime" class="text-xs text-gray-500 mt-1.5">
                                <i class="far fa-clock fa-fw mr-1"></i>Last sent: {{ formatDate(template.lastSentTime) }}
                            </p>
                        </div>
                         <div class="flex-shrink-0 pt-0.5 flex items-center space-x-2">
                            <div :class="[
                                'w-5 h-5 rounded border flex items-center justify-center',
                                template.isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                                ]">
                                 <i v-if="template.isSelected" class="fas fa-check text-white text-xs"></i>
                             </div>
                             <button 
                                 type="button" 
                                 @click.stop="handlePreviewClick(template)"
                                 class="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded p-1 -m-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                 title="Preview Email">
                                 <span class="sr-only">Preview {{ template.name }}</span>
                                 <i class="fas fa-eye w-4 h-4"></i>
                             </button>
                         </div>
                    </div>
                 </div>
            </BaseGridList>
        </div>
    `
}; 