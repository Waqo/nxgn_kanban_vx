const { ref, computed } = Vue; // Use global Vue
import { useModalStore } from '../../../../store/modalStore.js'; 
import { useUiStore } from '../../../../store/uiStore.js'; // Adjust path as needed
import { useCommunicationsStore } from '../../../../store/communicationsStore.js'; // Adjust path as needed
import { useProjectsStore } from '../../../../store/projectsStore.js';
import { formatDisplayPhoneNumber } from '../../../../utils/helpers.js'; // Import phone formatter

// Import Base Components used

import BaseButton from '../../../common/BaseButton.js';
import BaseTextArea from '../../../common/BaseTextArea.js';
import BaseEmptyStates from '../../../common/BaseEmptyStates.js';
import BaseButtonGroup from '../../../common/BaseButtonGroup.js'; // Import BaseButtonGroup
import BaseCard from '../../../common/BaseCard.js'; // Import BaseCard
import BaseListContainer from '../../../common/BaseListContainer.js'; // Import BaseListContainer
import BaseToggle from '../../../common/BaseToggle.js';
import BaseAlert from '../../../common/BaseAlert.js'; // --- ADD BaseAlert Import
// import BaseCard from '../../common/BaseCard.js';
// import BaseButtonGroup from '../../common/BaseButtonGroup.js';
// import BaseFeed from '../../common/BaseFeed.js';
// import BaseAvatar from '../../common/BaseAvatar.js';
import CommItem from './CommItem.js'; // Import CommItem
import EmailTemplatesSection from './EmailTemplatesSection.js'; // Import EmailTemplatesSection
// import EmailTemplatesSection from './EmailTemplatesSection.js'; // To be created in Phase 3

export default {
    name: 'CommunicationsTab',
    components: { // Register CommItem
        CommItem,
        BaseButton, // Register BaseButton
        BaseTextArea, // Register BaseTextArea
        EmailTemplatesSection, // Register EmailTemplatesSection
        BaseEmptyStates,
        BaseButtonGroup, // Register BaseButtonGroup
        BaseCard, // Register BaseCard
        BaseListContainer, // Register BaseListContainer
        BaseToggle, // --- ADD BaseToggle Registration
        BaseAlert // --- ADD BaseAlert Registration
        // BaseCard, BaseButton, BaseButtonGroup, BaseTextArea, BaseFeed, CommItem, EmailTemplatesSection
    },
    props: {
        project: { 
            type: Object, 
            required: true 
        },
        currentUser: { // Assuming currentUser is passed down or available globally
            type: Object, 
            required: true 
        }
    },
    setup(props) {
        const { ref, computed } = Vue; // Use global Vue destructured
        
        // --- Remove Console Log for Raw Props --- 
        // console.log('CommunicationsTab Props Project:', props.project);
        // console.log('Raw Communications Data:', props.project?.Communications);
        // console.log('Raw Communications Count:', props.project?.Communications?.length);
        // --- End Log Removal ---

        const modalStore = useModalStore();
        const uiStore = useUiStore();
        const communicationsStore = useCommunicationsStore();
        const projectsStore = useProjectsStore();

        const activeFilters = ref(new Set(['SMS', 'Call', 'Email']));
        // --- RE-ADD Pagination State ---
        const showAllItems = ref(false);
        const itemsToShow = 5; // Show last 5 initially
        
        // --- SMS Sending State ---
        const newMessage = ref('');
        const isSendingSms = ref(false);

        // Communications are pre-sorted (oldest first) by the data processor
        const communications = computed(() => props.project?.Communications || []);

        const filteredCommunications = computed(() => {
             // --- Remove Console Log for Filtering --- 
            // console.log('Filtering Communications. Active Filters:', Array.from(activeFilters.value));
            const filtered = communications.value.filter(comm => 
                activeFilters.value.has(comm.Communication_Type)
            );
            // console.log('Filtered Communications Count:', filtered.length);
             // --- End Log Removal --- 
            return filtered;
        });

        // --- RE-ADD Pagination Computeds ---
        const visibleCommunications = computed(() => {
            // filteredCommunications is already sorted oldest first by the processor
            const sorted = filteredCommunications.value; 
            // If not showing all, slice the *last* itemsToShow (newest)
            // Otherwise, return the full sorted list (oldest first, newest last)
            return showAllItems.value ? sorted : sorted.slice(-itemsToShow); 
        });
        const totalFilteredCount = computed(() => filteredCommunications.value.length);

        // --- ADD Computed for Button Visibility ---
        const shouldShowViewOlderButton = computed(() => {
            // Render the button container if there are more items than the initial display count
            return totalFilteredCount.value > itemsToShow;
        });

        // --- ADD Computed for Opt-In Status ---
        const isWeeklyEmailOptedIn = computed(() => {
            return props.project?.Weekly_Email_Opt_In === 'true';
        });

        // --- ADD Computed for Hard Bounce Check ---
        const ownerEmailHasHardBounce = computed(() => {
            const ownerEmail = props.project?.['Owner_Name.Email']?.toLowerCase().trim();
            if (!ownerEmail) return false; // No owner email to check

            // Use the specific hard bounce status provided
            const hardBounceStatuses = ['hard bounce']; 
            const communications = props.project?.Communications || [];

            return communications.some(comm => 
                comm.Communication_Type === 'Email' &&
                comm.Email_To?.toLowerCase().trim() === ownerEmail &&
                hardBounceStatuses.includes(comm.Email_Status?.toLowerCase().trim())
            );
        });

        // --- Reinstate toggleFilter function --- 
        const toggleFilter = (type) => {
            const newFilters = new Set(activeFilters.value);
            if (newFilters.has(type)) {
                newFilters.delete(type);
            } else {
                newFilters.add(type);
            }
            activeFilters.value = newFilters;
            // Reset pagination when filters change
            showAllItems.value = false; // RE-ADD reset
        };

        // --- ADD Diagnostic Log ---
        Vue.watchEffect(() => {
            // Include the new computed property in the log
            console.log(`CommunicationsTab Check: totalFilteredCount=${totalFilteredCount.value}, itemsToShow=${itemsToShow}, showAllItems=${showAllItems.value}, shouldShow=${shouldShowViewOlderButton.value}`);
        });
        // --- END Diagnostic Log ---

        // --- ADD Format Date Helper (Consider moving to global helpers later) ---
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            // Simple MM/DD/YY format
            try {
                 const date = new Date(dateString);
                 if (isNaN(date.getTime())) return 'Invalid Date';
                 return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
            } catch (e) {
                 return 'Invalid Date';
            }
        };

        // Options for the filter button group - REMOVE ICONS
        const filterOptions = computed(() => [
            { value: 'SMS', label: 'SMS' },
            { value: 'Call', label: 'Calls' },
            { value: 'Email', label: 'Email' }
        ]);

        // --- Dynamic Empty State Text ---
        const emptyStateTitle = computed(() => {
            if (activeFilters.value.size === 0) {
                return 'No Filters Selected';
            }
            return communications.value.length === 0
                ? 'No Communications Found'
                : 'No Matching Communications';
        });
        const emptyStateDescription = computed(() => {
           if (activeFilters.value.size === 0) {
                return 'Please select at least one communication type (SMS, Call, Email) to view items.';
           }
           return communications.value.length === 0
                ? 'No communications have been logged for this project yet.'
                : 'No calls, SMS, or emails match the current filters.';
        });

        // --- SMS Sending Method ---
        const handleSendSms = async () => {
            if (!newMessage.value.trim() || isSendingSms.value) return;

            const projectId = props.project?.ID;
            // Assuming primary contact is stored like this, adjust if needed
            const contactId = props.project?.Owner_Name?.ID; 
            const userId = props.currentUser?.id;

            // --- Add Debugging Logs ---
            console.log('handleSendSms check:');
            console.log('  props.project:', props.project);
            console.log('  props.currentUser:', props.currentUser);
            console.log(`  projectId: ${projectId}`);
            console.log(`  contactId (from Owner_Name.ID): ${contactId}`);
            console.log(`  userId: ${userId}`);
            // --- End Debugging Logs ---

            // More specific validation check
            let missingInfo = [];
            if (!projectId) missingInfo.push('Project ID');
            if (!contactId) missingInfo.push('Contact ID (from Owner_Name)');
            if (!userId) missingInfo.push('User ID');

            if (missingInfo.length > 0) {
                uiStore.addNotification({
                    type: 'error', 
                    title: 'Missing Information',
                    message: `Cannot send SMS: Missing ${missingInfo.join(', ')}.`
                });
                return;
            }

            isSendingSms.value = true;
            try {
                const success = await communicationsStore.sendSms({
                    projectId,
                    contactId,
                    userId,
                    message: newMessage.value
                });

                if (success) {
                    newMessage.value = ''; // Clear input on success
                }
                // Notifications are handled within the store action
            } catch (error) {
                // Error should be caught and notified by the store action
                console.error('Error occurred during handleSendSms:', error); 
            } finally {
                isSendingSms.value = false;
            }
        };
        
        // --- ADD Opt-In Change Handler ---
        const handleOptInChange = async (newValue) => {
            const projectId = props.project?.ID;
            if (!projectId) {
                uiStore.addNotification({ type: 'error', title: 'Error', message: 'Project ID not found.'});
                return;
            }
            try {
                 // Call the store action
                 await projectsStore.updateWeeklyEmailOptIn({ projectId, optInStatus: newValue });
                 // Success notification is handled by the store action
            } catch (error) {
                 // Error notification is handled by the store action
                 // Optional: Add component-specific error handling if needed
                 console.error('Error updating opt-in status from component:', error);
                 // Manually revert toggle if needed? Store refresh should handle it.
            }
        };
        
        return {
            // State
            activeFilters,
            showAllItems, // RE-ADD
            newMessage, // Expose SMS state
            isSendingSms, // Expose SMS state
            // Computed
            communications, // Raw, sorted oldest first
            filteredCommunications,
            visibleCommunications, // RE-ADD (replaces paginated)
            totalFilteredCount, // RE-ADD
            filterOptions, // Keep exposed
            emptyStateTitle, // Expose new computed
            emptyStateDescription, // Expose existing computed
            shouldShowViewOlderButton, // Expose new computed
            isWeeklyEmailOptedIn, // --- ADD ---
            ownerEmailHasHardBounce, // --- ADD ---
            // Methods
            toggleFilter,
            handleSendSms,
            formatDisplayPhoneNumber, // Expose helper
            formatDate, // --- ADD ---
            handleOptInChange, // --- ADD ---
            modalStore // --- ADD ---
            // -- Base Components placeholders --
            // BaseCard, BaseButton, BaseButtonGroup, BaseTextArea, BaseFeed, CommItem, EmailTemplatesSection
        };
    },
    template: `
        <div class="communications-tab-content flex flex-col h-full p-6 space-y-6">
            
            <!-- Weekly Email Status Section -->
            <div class="flex justify-between items-center p-3 border rounded-md bg-gray-50 text-sm">
                <div class="text-gray-700">
                    Weekly Email Last Sent: 
                    <span class="font-medium">{{ formatDate(project?.Weekly_Email_Last_Sent) }}</span>
                </div>
                <div class="flex items-center">
                    <label for="weekly-opt-in" class="mr-2 font-medium text-gray-700">Weekly Email Opt-In:</label>
                    <BaseToggle 
                        id="weekly-opt-in"
                        :modelValue="isWeeklyEmailOptedIn"
                        @update:modelValue="handleOptInChange"
                    />
                </div>
            </div>

            <!-- Hard Bounce Warning -->
            <BaseAlert 
                v-if="ownerEmailHasHardBounce" 
                variant="warning" 
                title="Email Delivery Issue Detected"
                :dismissible="false"
                class="mb-4" 
            >
                <p>Our records show that emails sent to the primary contact (<code class="text-sm bg-yellow-100 px-1 rounded">{{ project['Owner_Name.Email'] }}</code>) have previously failed to deliver (e.g., bounced).</p>
                <p class="mt-1">This may automatically disable the Weekly Email Opt-In. Please verify the email address in the <button @click="() => modalStore.setActiveTab('contacts')" class="font-medium underline hover:text-yellow-800">Contacts Tab</button> and update if necessary.</p>
            </BaseAlert>

            <!-- Feed Card -->
             <BaseCard :noBodyPadding="true" class="flex-1 min-h-0" :bodyFlex="true">
                <template #header>
                     <!-- Container for Header Content -->
                     <div class="space-y-3"> 
                         <!-- Row 1: Filters & Contact Info -->
                    <div class="flex justify-between items-center">
                        <!-- Filter Group -->
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium text-gray-600">Filters:</span>
                             <BaseButtonGroup 
                                :modelValue="Array.from(activeFilters)" 
                                @update:modelValue="newVal => activeFilters = new Set(newVal)"
                                :options="filterOptions" 
                                :multiple="true" 
                                button-size="sm" 
                                optionValueKey="value"
                                optionLabelKey="label"
                                rounded="md" 
                                shadow="none" 
                             />
            </div>

                        <!-- Contact Info -->
                         <div v-if="project?.Owner_Name" class="text-xs text-gray-600 flex items-center gap-2">
                             <span class="font-medium truncate" :title="project.Owner_Name.zc_display_value">
                                 {{ project.Owner_Name.zc_display_value }}
                             </span>
                             <span v-if="project['Owner_Name.Phone_Number']" class="text-gray-300">|</span>
                             <a v-if="project['Owner_Name.Phone_Number']" 
                                :href="'tel:' + project['Owner_Name.Phone_Number']" 
                                class="hover:text-blue-600 inline-flex items-center gap-1"
                                :title="'Call ' + project['Owner_Name.Phone_Number']">
                                 <i class="fas fa-phone fa-fw text-gray-400"></i>
                                 {{ formatDisplayPhoneNumber(project['Owner_Name.Phone_Number']) }}
                             </a>
                             <span v-if="project['Owner_Name.Email'] && project['Owner_Name.Phone_Number']" class="text-gray-300">|</span>
                             <a v-if="project['Owner_Name.Email']" 
                                :href="'mailto:' + project['Owner_Name.Email']" 
                                class="hover:text-blue-600 inline-flex items-center gap-1"
                                :title="'Email ' + project['Owner_Name.Email']">
                                 <i class="far fa-envelope fa-fw text-gray-400"></i>
                                 {{ project['Owner_Name.Email'] }}
                             </a>
                            </div>
                        <div v-else class="text-xs text-gray-500 italic">
                             No Primary Contact Assigned
                                </div>

                                    </div>
                         <!-- Removed Row 2: View More Button and Count (Moved to default slot) -->
                                </div>
                </template>
                <template #default>
                     <!-- View More/Less Button (Sticky inside scrollable body) -->
                     <div v-if="shouldShowViewOlderButton" 
                          class="sticky top-0 z-10 bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                         <span class="text-sm text-gray-500">Showing {{ visibleCommunications.length }} of {{ totalFilteredCount }} items</span>
                         <button @click="showAllItems = !showAllItems" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
                             {{ showAllItems ? 'Show Less' : ('View Older (' + (totalFilteredCount - visibleCommunications.length) + ')') }}
                         </button>
                     </div>
                        
                     <!-- Communications Feed Area (Wrapper div removed) -->
                         <!-- BaseListContainer / Empty State -->
                         <BaseListContainer
                            v-if="filteredCommunications.length > 0" 
                        :items="visibleCommunications" 
                            itemKey="ID"
                            :dividers="false" 
                            variant="simple-mobile" 
                        class="p-4 bg-gray-50" 
                         >
                            <template #item="{ item }">
                                <CommItem :communication="item" />
                            </template>
                         </BaseListContainer>
                         
                         <BaseEmptyStates 
                             v-else 
                            icon="fas fa-comments"
                            :title="emptyStateTitle" 
                            :description="emptyStateDescription" 
                        class="py-8 h-full p-4 bg-gray-50" 
                         />
                 </template>
                 <template #footer>
                     <!-- SMS Input Section -->
                     <div class="flex gap-3">
                         <BaseTextArea 
                             v-model="newMessage"
                             placeholder="Type your message..." 
                             class="flex-1" 
                             :rows="2"/> 
                         <BaseButton 
                             @click="handleSendSms" 
                             :disabled="!newMessage.trim() || isSendingSms"
                             :loading="isSendingSms"
                             variant="primary" 
                             color="blue" 
                             class="self-end flex items-center justify-center gap-2 px-4 py-2">
                             <i class="fas fa-paper-plane"></i>
                             <span>Send</span>
                         </BaseButton>
            </div>
                     <p class="mt-1 text-xs text-gray-500 text-right">Messages are logged automatically.</p>
                 </template>
            </BaseCard>

            <!-- Only Email Templates Panel remains here -->
             <div class="mt-6">
                 <BaseCard>
                      <template #header>
                          <h3 class="text-base font-semibold leading-6 text-gray-900">Email Templates</h3>
                      </template>
                      <template #default>
                         <EmailTemplatesSection :project="project" :currentUser="currentUser" />
                     </template>
                 </BaseCard>
            </div>

        </div>
    `
};