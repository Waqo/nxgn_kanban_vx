// app/components/modal/ModalHeader.js

// Import Constants
import {
    FIELD_PROJECT_CONTACT_NAME_LOOKUP,
    FIELD_PROJECT_CONTACT_EMAIL,
    FIELD_PROJECT_CONTACT_PHONE,
    FIELD_PROJECT_ADDRESS,
    FIELD_PROJECT_OS_ID,
    FIELD_PROJECT_KW_STC,
    FIELD_PROJECT_PAYMENT_OPTION,
    FIELD_PROJECT_DATE_SOLD,
    FIELD_PROJECT_INSTALL_DATE_TIME,
    FIELD_PROJECT_COMMERCIAL,
    FIELD_PROJECT_FUNDED_REDBALL,
    FIELD_PROJECT_ADUU_ID,
    FIELD_PROJECT_FOLDER_LINK,
    FIELD_PROJECT_INVESTOR_FOLDER_LINK,
    FIELD_PROJECT_NEED_HELP,
} from '../../config/constants.js';

// Import Helpers
import { formatDateMMDDYY, formatDateWithOptions, calculateApproxInstallDate } from '../../utils/helpers.js';

// Import Pinia stores and helpers
import { useLookupsStore } from '../../store/lookupsStore.js';
import { useProjectsStore } from '../../store/projectsStore.js';
const { mapState, mapActions } = Pinia;

// Import common components used in the header
import BaseSelectMenu from '../common/BaseSelectMenu.js';
import BaseButton from '../common/BaseButton.js';
import BaseBadge from '../common/BaseBadge.js';

const ModalHeader = {
    name: 'ModalHeader',
    components: {
        BaseSelectMenu,
        BaseButton,
        BaseBadge
    },
    props: {
        projectData: {
            type: Object,
            default: null
        },
        isLoading: Boolean,
        error: [String, Object, null],
        // Assuming these are passed down or managed globally
        tabs: {
            type: Array,
            default: () => [] // Example: [{ id: 'details', name: 'Details' }, { id: 'tasks', name: 'Tasks' }]
        },
        activeTab: {
            type: String,
            default: '' // Example: 'details'
        }
    },
    emits: ['close', 'update:activeTab', 'refresh-data', 'request-help'], // Added refresh/help emits
    computed: {
        ...mapState(useLookupsStore, [
            'stages',
            'tranches'
        ]),
        // Use a consistent naming convention for the main data object
        project() {
            return this.projectData;
        },
        contactName() {
            // Provide a more descriptive loading state or default
            if (this.isLoading) return 'Loading Name...';
            return this.project?.[FIELD_PROJECT_CONTACT_NAME_LOOKUP]?.zc_display_value || 'Project Details';
        },
        contactEmail() {
            return this.project?.[FIELD_PROJECT_CONTACT_EMAIL] || null;
        },
        contactPhone() {
            return this.project?.[FIELD_PROJECT_CONTACT_PHONE] || null;
        },
        formattedAddress() {
            if (this.isLoading) return 'Loading Address...';
            if (!this.project?.[FIELD_PROJECT_ADDRESS]) return 'Address not available';
            const addr = this.project[FIELD_PROJECT_ADDRESS];
            // Ensure parts are strings and handle potential null/undefined values gracefully
            const parts = [addr.address_line_1, addr.district_city, addr.state_province, addr.postal_code]
                .map(part => String(part || '')) // Convert to string, handle null/undefined
                .filter(Boolean); // Remove empty strings
            return parts.join(', ') || 'Address incomplete';
        },
        currentStageId() {
            // Use optional chaining safely
            return this.project?.New_Stage?.ID ?? null;
        },
        currentTrancheId() {
            return this.project?.Tranche?.ID ?? null;
        },
        stageOptions() {
            // Ensure stages is an array before mapping
            if (!Array.isArray(this.stages)) return [];
            return this.stages.map(s => ({ value: s.id, label: s.title || 'Unnamed Stage' }));
        },
        trancheOptions() {
            // Ensure tranches is an array before mapping
            if (!Array.isArray(this.tranches)) return [{ value: null, label: 'Unassigned' }]; // Default if tranches not loaded
            const options = this.tranches.map(t => ({ value: t.id, label: `Tranche ${t.number ?? 'N/A'}` }));
            // Add the 'Unassigned' option at the beginning
            return [{ value: null, label: 'Unassigned' }, ...options];
        },
        processedTags() {
            const lookupsStore = useLookupsStore();
            // Add more robust checks
            if (this.isLoading || !this.project || !Array.isArray(this.project.Tags)) {
                return [];
            }
            const tagsMap = lookupsStore.tags;
            if (!tagsMap || !(tagsMap instanceof Map) || tagsMap.size === 0) {
                 console.warn("ModalHeader: tagsMap not ready or empty for processedTags");
                 // Optionally return raw tags if map isn't ready but tags exist
                 // return this.project.Tags.map(rawTag => ({ id: rawTag.ID, name: `Tag ${rawTag.ID}` }));
                 return [];
            }

            return this.project.Tags
                .map(rawTag => {
                    if (!rawTag || !rawTag.ID) return null; // Skip invalid tag data
                    const mappedTag = tagsMap.get(rawTag.ID);
                    // Provide default name if mapped tag is missing details
                    return mappedTag ? { ...mappedTag, id: rawTag.ID, name: mappedTag.name || `Tag ${rawTag.ID}` } : { id: rawTag.ID, name: `Tag ${rawTag.ID}`, color: '#6b7280' }; // Default color
                })
                .filter(Boolean); // Filter out any nulls from invalid data
        },
        systemSizeDisplay() {
            if (this.isLoading) return '... kW';
            const size = parseFloat(this.project?.[FIELD_PROJECT_KW_STC]);
            // Handle null, undefined, or non-numeric values
            return !isNaN(size) && size > 0 ? `${size.toFixed(2)} kW` : '0.00 kW';
        },
        paymentOptionDisplay() {
            if (this.isLoading) return 'Loading...';
            return this.project?.[FIELD_PROJECT_PAYMENT_OPTION] || 'N/A'; // Provide fallback
        },
        projectTypeBadge() {
            if (this.isLoading) return { text: '...', colorClass: 'bg-gray-400', title: 'Loading Type' };
            // Explicitly check for the string 'true'
            const isCommercial = String(this.project?.[FIELD_PROJECT_COMMERCIAL]).toLowerCase() === 'true';
            return {
                text: isCommercial ? 'COM' : 'RES',
                // Use Tailwind classes directly for easier maintenance
                colorClass: isCommercial ? 'bg-purple-600 hover:bg-purple-700' : 'bg-sky-600 hover:bg-sky-700',
                title: isCommercial ? 'Commercial Project' : 'Residential Project'
            };
        },
        soldDateDisplay() {
            if (this.isLoading) return 'Loading Date...';
            const date = this.project?.[FIELD_PROJECT_DATE_SOLD];
            return date ? formatDateMMDDYY(date) : 'Not Set';
        },
        installDateDisplay() {
            if (this.isLoading) return { text: 'Loading Date...', isApprox: false, colorClass: 'bg-gray-400' };
            const installDate = this.project?.[FIELD_PROJECT_INSTALL_DATE_TIME];
            const soldDate = this.project?.[FIELD_PROJECT_DATE_SOLD];

            if (installDate) {
                return {
                    text: `Install: ${formatDateMMDDYY(installDate)}`,
                    isApprox: false,
                    colorClass: 'bg-green-600 hover:bg-green-700' // Success color for confirmed date
                };
            }
            const approxDate = calculateApproxInstallDate(soldDate);
            if (approxDate) {
                return {
                    text: `Approx: ${formatDateMMDDYY(approxDate)}`,
                    isApprox: true,
                    colorClass: 'bg-yellow-600 hover:bg-yellow-700' // Warning/notice color for approximate
                };
            }
            return { text: 'Install: N/A', isApprox: false, colorClass: 'bg-gray-500 hover:bg-gray-600' }; // Neutral color if no date
        },
        // Check if the necessary IDs are present for external links
        hasOpenSolarLink() {
            return !!this.project?.[FIELD_PROJECT_OS_ID];
        },
        hasAduuLink() {
            return !!this.project?.[FIELD_PROJECT_ADUU_ID];
        },
        hasProjectFolderLink() {
            return !!this.project?.[FIELD_PROJECT_FOLDER_LINK]?.url;
        },
        hasInvestorFolderLink() {
            return !!this.project?.[FIELD_PROJECT_INVESTOR_FOLDER_LINK]?.url;
        },
        isFundedByRedball() {
            // Explicitly check for the string 'true'
            return String(this.project?.[FIELD_PROJECT_FUNDED_REDBALL]).toLowerCase() === 'true';
        }
    },
    methods: {
        ...mapActions(useProjectsStore, [
            'updateProjectStage',
            'updateProjectTranche',
            // Assuming actions for tags and funded status exist
            'addProjectTag',
            'removeProjectTag',
            'updateProjectFundedStatus'
        ]),

        // --- Event Handlers ---
        handleStageChange(event) {
            const newStageId = event.target.value;
            // Prevent unnecessary updates if the value hasn't changed or project is missing
            if (!this.project || newStageId === this.currentStageId) return;
            console.log(`ModalHeader: Stage change selected: ID=${newStageId}`);
            this.updateProjectStage({ projectId: this.project.ID, newStageId: newStageId })
                .catch(err => console.error("Failed to update stage:", err)); // Add basic error handling
        },
        handleTrancheChange(event) {
            const newTrancheId = event.target.value === 'null' ? null : event.target.value; // Handle 'Unassigned' which has value 'null'
             // Prevent unnecessary updates
            if (!this.project || newTrancheId === this.currentTrancheId) return;
            console.log(`ModalHeader: Tranche change selected: ID=${newTrancheId}`);
            this.updateProjectTranche({ projectId: this.project.ID, newTrancheId: newTrancheId })
                 .catch(err => console.error("Failed to update tranche:", err)); // Add basic error handling
        },
        handleAddTagClick() {
            // Replace alert with a more robust implementation (e.g., open a tag selection dropdown/modal)
            console.warn('Add Tag UI not implemented yet.');
            // Example of how you might call an action (if you had a tagIdToAdd)
            // this.addProjectTag({ projectId: this.project.ID, tagId: tagIdToAdd });
        },
        handleRemoveTagClick(tagId) {
             if (!this.project || !tagId) return;
             console.log(`ModalHeader: Remove tag clicked: ID=${tagId}`);
             // Add confirmation dialog before removing
             if (confirm(`Are you sure you want to remove this tag?`)) {
                 this.removeProjectTag({ projectId: this.project.ID, tagId: tagId })
                     .catch(err => console.error("Failed to remove tag:", err));
             }
        },
        handleEmailClick() {
            if (this.contactEmail) {
                window.location.href = `mailto:${this.contactEmail}`;
            } else {
                // Provide user feedback differently (e.g., disable button, show tooltip)
                console.warn('No email available.');
            }
        },
        handlePhoneClick() {
            if (this.contactPhone) {
                window.location.href = `tel:${this.contactPhone}`;
            } else {
                console.warn('No phone number available.');
            }
        },
        handleAddressClick() {
            // Implement actual map functionality or link to Google Maps
            if (this.formattedAddress && this.formattedAddress !== 'Address not available' && this.formattedAddress !== 'Address incomplete') {
                 const query = encodeURIComponent(this.formattedAddress);
                 window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
            } else {
                 console.warn('Cannot open map, address unavailable.');
            }
        },
        handleOpenSolarClick() {
            if (this.hasOpenSolarLink) {
                window.open(`https://app.opensolar.com/#/projects/${this.project[FIELD_PROJECT_OS_ID]}`, '_blank');
            } else {
                console.warn('OpenSolar ID not available.');
            }
        },
        handleAduuClick() {
            if (this.hasAduuLink) {
                window.open(`https://client.aduusolar.com/portal/orders/${this.project[FIELD_PROJECT_ADUU_ID]}`, '_blank');
            } else {
                console.warn('ADUU ID not available.');
            }
        },
        handleFundedByRedballChange(event) {
            const isChecked = event.target.checked;
            if (!this.project) return;
            console.log(`ModalHeader: Funded by Redball changed: ${isChecked}`);
            this.updateProjectFundedStatus({ projectId: this.project.ID, isFunded: isChecked })
                 .catch(err => {
                     console.error("Failed to update funded status:", err);
                     // Optionally revert checkbox state on failure
                     event.target.checked = !isChecked;
                 });
        },
        handleRefreshData() {
            console.log('ModalHeader: Refresh Data requested');
            this.$emit('refresh-data'); // Emit event for parent component to handle
        },
        handleRequestHelp() {
             console.log('ModalHeader: Request Help clicked');
             this.$emit('request-help'); // Emit event for parent component to handle
        },
        openProjectFolder() {
            if (this.hasProjectFolderLink) {
                window.open(this.project[FIELD_PROJECT_FOLDER_LINK].url, '_blank');
            } else {
                console.warn('Project Folder Link not available.');
            }
        },
        openInvestorFolder() {
            if (this.hasInvestorFolderLink) {
                window.open(this.project[FIELD_PROJECT_INVESTOR_FOLDER_LINK].url, '_blank');
            } else {
                console.warn('Investor Folder Link not available.');
            }
        },
        // --- Internal Methods ---
        setActiveTab(tabId) {
            this.$emit('update:activeTab', tabId); // Use v-model convention
        }
    },
    template: `
        <div class="modal-header-content flex-none border-b border-gray-200 dark:border-gray-700">
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-4 sm:p-6 text-white">
                <div v-if="isLoading" class="text-center text-blue-200 dark:text-blue-300 py-4">
                    <i class="fas fa-spinner fa-spin mr-2"></i> Loading Project Details...
                </div>
                <div v-else-if="error" class="text-center bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 p-3 rounded-md">
                    <i class="fas fa-exclamation-triangle mr-2"></i> Error loading project: {{ typeof error === 'string' ? error : 'Details unavailable' }}
                </div>
                <div v-else-if="!project" class="text-center text-blue-200 dark:text-blue-300 py-4">
                    <i class="fas fa-info-circle mr-2"></i> Project data unavailable.
                </div>

                <div v-else class="space-y-4">
                    <div class="flex flex-wrap justify-between items-start gap-3">
                        <div class="flex-1 min-w-0">
                            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate mb-2" :title="contactName">
                                {{ contactName }}
                            </h2>
                            <div class="flex items-center gap-2 flex-wrap">
                                <button
                                    @click="handleEmailClick"
                                    :disabled="!contactEmail"
                                    :class="[
                                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white',
                                        contactEmail ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white/10 text-white/50 cursor-not-allowed'
                                    ]"
                                    :title="contactEmail ? 'Send Email: ' + contactEmail : 'Email not available'"
                                >
                                    <i class="far fa-envelope w-4 h-4"></i>
                                    <span>Email</span>
                                </button>
                                <button
                                    @click="handlePhoneClick"
                                    :disabled="!contactPhone"
                                    :class="[
                                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white',
                                        contactPhone ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white/10 text-white/50 cursor-not-allowed'
                                    ]"
                                    :title="contactPhone ? 'Call: ' + contactPhone : 'Phone not available'"
                                >
                                    <i class="far fa-phone w-4 h-4"></i>
                                    <span>Call</span>
                                </button>
                            </div>
                        </div>

                        <div class="flex flex-shrink-0 items-center gap-1 sm:gap-2">
                            <button class="p-1.5 rounded-md text-blue-100 hover:bg-white/20 hover:text-white transition-colors duration-150 focus:outline-none focus:bg-white/20" title="More Actions (Not Implemented)">
                                <i class="fas fa-ellipsis-v w-5 h-5"></i>
                            </button>
                            <button @click="handleRefreshData" class="p-1.5 rounded-md text-blue-100 hover:bg-white/20 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white" title="Refresh Project Data">
                                <i class="fas fa-sync-alt w-5 h-5"></i>
                            </button>
                            <button @click="$emit('close')" class="p-1.5 rounded-md text-blue-100 hover:bg-red-500/50 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white" title="Close Modal">
                                <i class="fas fa-times w-5 h-5"></i>
                            </button>
                        </div>
                    </div>

                    <div class="mt-4 flex items-center flex-wrap justify-start space-x-2">
                         <!-- Stage Selector -->
                         <div class="flex items-center gap-1.5"> 
                              <base-select-menu
                                   id="modal-stage-select"
                                   class="w-40 pr-3 bg-white/10 text-white rounded-md text-sm font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white appearance-none transition-colors duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                   :modelValue="currentStageId"
                                   @update:modelValue="handleStageChange"
                                   :options="stageOptions"
                                   optionValueKey="value"
                                   optionLabelKey="label"
                                   :disabled="isLoading || !stageOptions.length"
                                   placeholder="Select Stage..."
                                   :attrs="{ 'aria-label': 'Project Stage' }"
                              >
                              </base-select-menu>
                         </div>
                         
                         <!-- Group Tranche Select and Funded Checkbox -->
                         <div class="flex items-center gap-3">
                             <!-- Tranche Select -->
                               <base-select-menu
                                    id="modal-tranche-select"
                                    class="px-3py-1 bg-white/10 text-white rounded-md text-sm font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white appearance-none transition-colors duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                    :modelValue="currentTrancheId"
                                    @update:modelValue="handleTrancheChange"
                                    :options="trancheOptions"
                                    optionValueKey="value"
                                    optionLabelKey="label"
                                    :disabled="isLoading || !trancheOptions.length"
                                    placeholder="Select Tranche..."
                                    :attrs="{ 'aria-label': 'Project Tranche' }"
                               >
                               </base-select-menu>
                             <!-- Funded by Redball Checkbox (Styled like a badge/button) -->
                              <label class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-blue-700">
                                 <input 
                                    type="checkbox" 
                                    :checked="isFundedByRedball" 
                                    @change="handleFundedByRedballChange"
                                    class="rounded border-white/50 text-teal-500 bg-white/10 focus:ring-offset-blue-600 focus:ring-white h-4 w-4 transition duration-150 ease-in-out focus:ring-2 focus:ring-teal-400 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                    :disabled="isLoading"
                                 />
                                 Funded By Redball
                              </label>
                         </div>
                        
                         <!-- System Size (Styled Span) -->
                         <span class="px-3 py-1 bg-blue-600 text-white rounded-md font-medium text-sm">{{ systemSizeDisplay }}</span>
                         <!-- Payment Option (Styled Span) -->
                         <span v-if="paymentOptionDisplay && paymentOptionDisplay !== 'N/A'" class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium">{{ paymentOptionDisplay }}</span>
                         <!-- Install Date (Styled Span) -->
                         <span v-if="installDateDisplay" :class="installDateDisplay.colorClass" class="inline-flex items-center gap-1 text-white rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-150" :title="installDateDisplay.isApprox ? 'Approximate Install Date' : 'Scheduled Install Date'"> 
                             {{ installDateDisplay.text }}
                         </span>
                         <!-- Sold Date (Styled Span) -->
                         <span v-if="soldDateDisplay && soldDateDisplay !== 'Not Set'" class="inline-flex items-center gap-1 bg-blue-600 text-white rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap" title="Date Sold">
                              Sold: {{ soldDateDisplay }}
                         </span>
                         <!-- Project Type (Styled Span) -->
                         <span class="inline-block bg-blue-600 text-white rounded-md px-3 py-1 text-sm font-medium tracking-wide whitespace-nowrap" :title="projectTypeBadge.title"> 
                              {{ projectTypeBadge.text }}
                         </span>
                    </div>

                     <div class="flex justify-start text-sm text-blue-100 dark:text-blue-200 pt-1">
                        <button
                            class="group inline-flex items-center gap-1.5 hover:text-white transition-colors duration-150 text-left"
                            @click="handleAddressClick"
                            :title="formattedAddress !== 'Address not available' && formattedAddress !== 'Address incomplete' ? 'View address on map' : formattedAddress"
                            :disabled="formattedAddress === 'Address not available' || formattedAddress === 'Address incomplete'"
                        >
                            <i class="fas fa-map-marker-alt w-4 h-4 text-blue-200 group-hover:text-white transition-colors duration-150"></i>
                            <span class="truncate">{{ formattedAddress }}</span>
                        </button>
                    </div>

                    <hr class="border-white/20">
                    <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-2">
                        <div class="flex items-center gap-2 flex-wrap flex-1 min-w-[200px]">
                            <span class="text-xs font-medium text-blue-100 dark:text-blue-200 flex-shrink-0">Tags:</span>
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span
                                    v-for="tag in processedTags"
                                    :key="tag.id"
                                    :style="{ backgroundColor: tag.color || '#4b5563' }"
                                    class="group relative inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm transition-transform duration-150 hover:scale-105"
                                    :title="tag.name"
                                >
                                    {{ tag.name }}
                                    <button
                                        @click.stop="handleRemoveTagClick(tag.id)"
                                        class="ml-1 -mr-1 p-0.5 text-white/70 hover:text-white hover:bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-red-400"
                                        title="Remove Tag"
                                    >
                                        <svg class="h-2.5 w-2.5" stroke="currentColor" fill="none" viewBox="0 0 8 8"><path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6L1 7" /></svg>
                                    </button>
                                </span>
                                <button
                                    @click="handleAddTagClick"
                                    title="Add Tag (Not Implemented)"
                                    class="flex-shrink-0 bg-white/20 text-white hover:bg-white/30 rounded-full w-6 h-6 flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white"
                                >
                                    <i class="fas fa-plus w-3 h-3"></i>
                                    <span class="sr-only">Add Tag</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 p-3 border-y border-gray-200 dark:border-gray-700">
                 <div class="text-center text-sm text-gray-500 dark:text-gray-400 italic">(Counters Component Placeholder)</div>
            </div>

            <div class="bg-white dark:bg-gray-800 px-4 sm:px-6 pt-1">
                <nav class="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                    <button v-for="tab in tabs"
                        :key="tab.id"
                        @click="setActiveTab(tab.id)"
                        :class="[
                            tab.id === activeTab
                                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
                            'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 rounded-t-sm'
                        ]"
                        :aria-current="tab.id === activeTab ? 'page' : undefined"
                    >
                        {{ tab.name }}
                        </button>
                </nav>
            </div>
        </div>
    `
};

export default ModalHeader;
