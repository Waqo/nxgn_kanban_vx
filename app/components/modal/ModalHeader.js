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
    TAG_CATEGORY_COLORS,
} from '../../config/constants.js';

// Import Helpers
import { calculateApproxInstallDate } from '../../utils/helpers.js';
// Import VueUse composable
// Correct the import method for VueUse
// import { useDateFormat } from 'vue-use'; 

// Import Pinia stores and helpers
import { useLookupsStore } from '../../store/lookupsStore.js';
import { useProjectsStore } from '../../store/projectsStore.js';
import { useUiStore } from '../../store/uiStore.js'; // Import UI store for notifications
import { logActivity } from '../../services/activityLogService.js';
const { mapState, mapActions } = Pinia;
const { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } = Vue; // Add Vue refs
// Destructure from global VueUse
const { useDateFormat } = VueUse; 

// Import common components used in the header
// import BaseSelectMenu from '../common/BaseSelectMenu.js';
// import BaseButton from '../common/BaseButton.js';
// import BaseBadge from '../common/BaseBadge.js';
import Counters from './Counters.js';

const ModalHeader = {
    name: 'ModalHeader',
    components: {
        // --- REMOVE Global Base Components Registration --- 
        // BaseSelectMenu,
        // BaseButton,
        // BaseBadge,
        // --- ADD Local Registration for Counters ---
        Counters
    },
    props: {
        projectData: {
            type: Object,
            default: null
        },
        isLoading: Boolean,
        error: [String, Object, null],
        tabs: {
            type: Array,
            default: () => []
        },
        activeTab: {
            type: String,
            default: ''
        }
    },
    emits: ['close', 'update:activeTab', 'refresh-data', 'request-help'], // Added refresh/help emits
    setup(props, { emit }) {
        // --- Get Stores ---
        const lookupsStore = useLookupsStore();
        const projectsStore = useProjectsStore(); // Use directly instead of mapActions if preferred
        const uiStore = useUiStore();

        // --- State for Add Tag Dropdown ---
        const showAddTagDropdown = ref(false);
        const addTagButtonRef = ref(null); // Ref for the '+' button element
        const addTagDropdownRef = ref(null); // Ref for the dropdown element

        // --- Computed Properties (mostly unchanged) ---
        const project = computed(() => props.projectData); // Use computed for reactivity

        const contactName = computed(() => {
            if (props.isLoading) return 'Loading Name...';
            return project.value?.[FIELD_PROJECT_CONTACT_NAME_LOOKUP]?.zc_display_value || 'Project Details';
        });

        const contactEmail = computed(() => project.value?.[FIELD_PROJECT_CONTACT_EMAIL] || null);
        const contactPhone = computed(() => project.value?.[FIELD_PROJECT_CONTACT_PHONE] || null);

        const formattedAddress = computed(() => {
            if (props.isLoading) return 'Loading Address...';
            if (!project.value?.[FIELD_PROJECT_ADDRESS]) return 'Address not available';
            const addr = project.value[FIELD_PROJECT_ADDRESS];
            const parts = [addr.address_line_1, addr.district_city, addr.state_province, addr.postal_code]
                .map(part => String(part || ''))
                .filter(Boolean);
            return parts.join(', ') || 'Address incomplete';
        });

        const currentStageId = computed(() => project.value?.New_Stage?.ID ?? null);
        const currentTrancheId = computed(() => project.value?.Tranche?.ID ?? null);

        const stageOptions = computed(() => {
            if (!Array.isArray(lookupsStore.stages)) return [];
            return lookupsStore.stages.map(s => ({ value: s.id, label: s.title || 'Unnamed Stage' }));
        });

        const trancheOptions = computed(() => {
            if (!Array.isArray(lookupsStore.tranches)) return [{ value: null, label: 'Unassigned' }];
            const options = lookupsStore.tranches.map(t => ({ value: t.id, label: `Tranche ${t.number ?? 'N/A'}` }));
            return [{ value: null, label: 'Unassigned' }, ...options];
        });

        // --- Processed Tags (with simplified setter for optimistic updates) ---
        const processedTags = computed({
            get() {
                if (props.isLoading || !project.value || !Array.isArray(project.value.Tags)) {
                    return [];
                }
                const tagsMap = lookupsStore.tags;
                if (!tagsMap || !(tagsMap instanceof Map) || tagsMap.size === 0) {
                    // console.warn("Tags map not ready or empty in lookupsStore");
                    return []; // Return empty if lookups aren't ready
                }

                return project.value.Tags
                    .map(rawTag => {
                        if (!rawTag || !rawTag.ID) return null;
                        const mappedTag = tagsMap.get(rawTag.ID);
                        if (!mappedTag) {
                            console.warn(`Tag ID ${rawTag.ID} not found in lookups store.`);
                            return { id: rawTag.ID, name: `Tag ${rawTag.ID}`, badgeColorName: 'gray', description: 'Unknown Tag' };
                        }
                        const category = mappedTag.category || 'default';
                        const badgeColorName = TAG_CATEGORY_COLORS[category] || TAG_CATEGORY_COLORS['default'] || 'gray';

                        return {
                             id: rawTag.ID, 
                             name: mappedTag.name || `Tag ${rawTag.ID}`,
                             badgeColorName: badgeColorName,
                             description: mappedTag.description || ''
                        };
                    })
                    .filter(Boolean) 
                    .sort((a, b) => a.name.localeCompare(b.name)); 
            },
            set(newProcessedTagsArray) {
                // This setter allows direct manipulation for optimistic UI updates.
                // It assumes the parent component handles the actual data persistence.
                if (project.value && Array.isArray(project.value.Tags)) {
                    // Map back to the raw format expected by projectData.Tags
                    project.value.Tags = newProcessedTagsArray.map(procTag => ({
                        ID: procTag.id,
                        // Note: zc_display_value might not be perfectly accurate here
                        // if the name was derived from the lookup, but it's for UI display.
                        zc_display_value: procTag.name
                    }));
                    // console.log('ProcessedTags setter updated project.value.Tags (optimistic)');
                } else {
                     console.error('Cannot set processedTags, project prop or project.Tags not valid.');
                }
            }
        });

        // --- Computed Property for Available Tags (for the Add Tag dropdown) ---
        const availableTagsForAdding = computed(() => {
            const allTagsMap = lookupsStore.tags;
            const currentTagIds = new Set(processedTags.value.map(tag => tag.id));

            if (!allTagsMap || allTagsMap.size === 0) return [];

            const available = [];
            allTagsMap.forEach((tagData, tagId) => {
                if (!currentTagIds.has(tagId)) {
                    const category = tagData.category || 'default';
                    const badgeColorName = TAG_CATEGORY_COLORS[category] || TAG_CATEGORY_COLORS['default'] || 'gray';
                    available.push({
                        id: tagId,
                        name: tagData.name || `Tag ${tagId}`,
                        badgeColorName: badgeColorName,
                        description: tagData.description || ''
                    });
                }
            });

            return available.sort((a, b) => a.name.localeCompare(b.name));
        });


        // --- Other Computed Properties (unchanged) ---
        const systemSizeDisplay = computed(() => {
            if (props.isLoading) return '... kW';
            const size = parseFloat(project.value?.[FIELD_PROJECT_KW_STC]);
            return !isNaN(size) && size > 0 ? `${size.toFixed(2)} kW` : '0.00 kW';
        });
        const paymentOptionDisplay = computed(() => project.value?.[FIELD_PROJECT_PAYMENT_OPTION] || 'N/A');
        const projectTypeBadge = computed(() => {
             if (props.isLoading) return { text: '...', colorClass: 'bg-gray-400', title: 'Loading Type' };
            const isCommercial = String(project.value?.[FIELD_PROJECT_COMMERCIAL]).toLowerCase() === 'true';
            return {
                text: isCommercial ? 'COM' : 'RES',
                colorClass: isCommercial ? 'bg-purple-600 hover:bg-purple-700' : 'bg-sky-600 hover:bg-sky-700',
                title: isCommercial ? 'Commercial Project' : 'Residential Project'
            };
        });
        
        // Date value refs with fallbacks
        const projectSoldDate = computed(() => project.value?.[FIELD_PROJECT_DATE_SOLD] || '');
        const projectInstallDateTime = computed(() => project.value?.[FIELD_PROJECT_INSTALL_DATE_TIME] || '');
        
        // Use useDateFormat wrapped in computed properties for fallbacks
        const soldDateDisplay = computed(() => {
            return projectSoldDate.value ? useDateFormat(projectSoldDate, 'MM/DD/YY', { locales: 'en-US' }).value : 'N/A';
        });
        
        const installDate = computed(() => {
            return projectInstallDateTime.value ? useDateFormat(projectInstallDateTime, 'MM/DD/YY', { locales: 'en-US' }).value : 'N/A';
        });
        
        // Calculate Approx Install Date with fallback
        const approxInstallDate = computed(() => {
            if (!projectSoldDate.value) return null;
            return calculateApproxInstallDate(projectSoldDate.value); // Use helper
        });
        
        const formattedApproxInstallDate = computed(() => {
            return approxInstallDate.value ? useDateFormat(approxInstallDate, 'MM/DD/YY', { locales: 'en-US' }).value : 'N/A';
        });
        
        // Combined Install Date Display Logic
        const installDateDisplay = computed(() => {
             if (props.isLoading) return { text: 'Loading Date...', isApprox: false, colorClass: 'bg-gray-400' };
             
             if (projectInstallDateTime.value) {
                 return { text: `Install: ${installDate.value}`, isApprox: false, colorClass: 'bg-green-600 hover:bg-green-700' };
            }
             if (approxInstallDate.value) {
                 return { text: `Approx: ${formattedApproxInstallDate.value}`, isApprox: true, colorClass: 'bg-yellow-600 hover:bg-yellow-700' };
            }
             return { text: 'Install: N/A', isApprox: false, colorClass: 'bg-gray-500 hover:bg-gray-600' };
        });
        const hasOpenSolarLink = computed(() => !!project.value?.[FIELD_PROJECT_OS_ID]);
        const hasAduuLink = computed(() => !!project.value?.[FIELD_PROJECT_ADUU_ID]);
        const hasProjectFolderLink = computed(() => !!project.value?.[FIELD_PROJECT_FOLDER_LINK]?.url);
        const hasInvestorFolderLink = computed(() => !!project.value?.[FIELD_PROJECT_INVESTOR_FOLDER_LINK]?.url);
        const isFundedByRedball = computed(() => String(project.value?.[FIELD_PROJECT_FUNDED_REDBALL]).toLowerCase() === 'true');

        // --- Methods ---
        const handleStageChange = (selectedOption) => {
            const newStageId = selectedOption ?? null;
            if (!project.value || newStageId === currentStageId.value) return;
            console.log(`ModalHeader: Stage change selected: ID=${newStageId}`);
            projectsStore.updateProjectStage({ projectId: project.value.ID, newStageId: newStageId })
                .catch(err => console.error("Failed to update stage:", err));
        };

        const handleTrancheChange = (selectedOption) => {
            const newTrancheId = selectedOption ?? null;
            if (!project.value || newTrancheId === currentTrancheId.value) return;
            console.log(`ModalHeader: Tranche change selected: ID=${newTrancheId}`);
            projectsStore.updateProjectTranche({ projectId: project.value.ID, newTrancheId: newTrancheId })
                 .catch(err => console.error("Failed to update tranche:", err));
        };

        // --- Add Tag Logic ---
        const handleAddTagClick = () => {
            showAddTagDropdown.value = !showAddTagDropdown.value;
        };

        const addTag = async (tagToAdd) => {
            if (!project.value?.ID || !tagToAdd?.id) return;

            showAddTagDropdown.value = false; // Hide dropdown immediately

            const originalTags = [...processedTags.value]; // Store for revert
            const currentTagIds = originalTags.map(tag => tag.id);

            // Prevent adding duplicates (shouldn't happen if availableTagsForAdding is correct, but belt-and-suspenders)
            if (currentTagIds.includes(tagToAdd.id)) {
                console.warn(`Tag "${tagToAdd.name}" is already added.`);
                return;
            }

            const newTagIds = [...currentTagIds, tagToAdd.id];

            // --- Optimistic UI Update ---
            // Create the processed tag object based on the selected available tag
            const newProcessedTag = {
                id: tagToAdd.id,
                name: tagToAdd.name,
                badgeColorName: tagToAdd.badgeColorName,
                description: tagToAdd.description
            };
            // Use the setter to update the underlying project.Tags
            processedTags.value = [...originalTags, newProcessedTag].sort((a, b) => a.name.localeCompare(b.name));

            // --- Specific Logging ---
            logActivity(project.value.ID, `Tag added: ${tagToAdd.name}`);

            try {
                // Call the store action
                await projectsStore.updateProjectTags({ projectId: project.value.ID, tagIds: newTagIds });
                // Success - UI already updated, maybe show a brief success notification
                uiStore.addNotification({ type: 'success', message: `Tag "${tagToAdd.name}" added.`, duration: 2000 });
            } catch (error) {
                console.error("Failed to add tag:", error);
                // --- Revert UI on Error ---
                processedTags.value = originalTags; // Use setter to revert
                uiStore.addNotification({ type: 'error', message: `Failed to add tag "${tagToAdd.name}".`, title: 'Update Error' });
            }
        };

        // --- Remove Tag Logic ---
        const handleRemoveTagClick = async (tagIdToRemove) => {
            if (!project.value?.ID || !processedTags.value) return;

            const tagToRemove = processedTags.value.find(t => t.id === tagIdToRemove);
            if (!tagToRemove) return;

            const originalTags = [...processedTags.value]; // Store for revert
            const currentTagIds = originalTags.map(tag => tag.id);
            const newTagIds = currentTagIds.filter(id => id !== tagIdToRemove);

            // --- Optimistic UI Update --- 
            processedTags.value = originalTags.filter(tag => tag.id !== tagIdToRemove); // Use setter

            // --- Specific Logging --- 
            logActivity(project.value.ID, `Tag removed: ${tagToRemove.name}`);

            try {
                // Call the store action
                await projectsStore.updateProjectTags({ projectId: project.value.ID, tagIds: newTagIds });
                 uiStore.addNotification({ type: 'success', message: `Tag "${tagToRemove.name}" removed.`, duration: 2000 });
            } catch (error) {
                console.error("Failed to remove tag:", error);
                // --- Revert UI on Error --- 
                processedTags.value = originalTags; // Use setter to revert
                uiStore.addNotification({ type: 'error', message: `Failed to remove tag "${tagToRemove.name}".`, title: 'Update Error' });
            }
        };

        // --- Other Event Handlers (unchanged) ---
        const handleEmailClick = () => { if (contactEmail.value) window.location.href = `mailto:${contactEmail.value}`; };
        const handlePhoneClick = () => { if (contactPhone.value) window.location.href = `tel:${contactPhone.value}`; };
        const handleAddressClick = () => {
            if (formattedAddress.value && formattedAddress.value !== 'Address not available' && formattedAddress.value !== 'Address incomplete') {
                 const query = encodeURIComponent(formattedAddress.value);
                 window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank'); // Use standard Google Maps URL
            }
        };
        const handleOpenSolarClick = () => { if (hasOpenSolarLink.value) window.open(`https://app.opensolar.com/#/projects/${project.value[FIELD_PROJECT_OS_ID]}`, '_blank'); };
        const handleAduuClick = () => { if (hasAduuLink.value) window.open(`https://client.aduusolar.com/portal/orders/${project.value[FIELD_PROJECT_ADUU_ID]}`, '_blank'); };
        const handleFundedByRedballChange = (event) => {
            const isChecked = event.target.checked;
            if (!project.value) return;
            projectsStore.updateProjectFundedStatus({ projectId: project.value.ID, isFunded: isChecked })
                 .catch(err => {
                     console.error("Failed to update funded status:", err);
                     event.target.checked = !isChecked; // Revert checkbox on failure
                 });
        };
        const handleRefreshData = () => emit('refresh-data');
        const handleRequestHelp = () => emit('request-help');
        const openProjectFolder = () => { if (hasProjectFolderLink.value) window.open(project.value[FIELD_PROJECT_FOLDER_LINK].url, '_blank'); };
        const openInvestorFolder = () => { if (hasInvestorFolderLink.value) window.open(project.value[FIELD_PROJECT_INVESTOR_FOLDER_LINK].url, '_blank'); };
        const setActiveTab = (tabId) => emit('update:activeTab', tabId);

        // --- Click Outside Handler for Add Tag Dropdown ---
        const handleClickOutside = (event) => {
          if (showAddTagDropdown.value &&
              addTagButtonRef.value &&
              !addTagButtonRef.value.contains(event.target) &&
              addTagDropdownRef.value &&
              !addTagDropdownRef.value.contains(event.target)) {
            showAddTagDropdown.value = false;
          }
        };

        onMounted(() => {
          document.addEventListener('click', handleClickOutside, true); // Use capture phase
        });

        onBeforeUnmount(() => {
          document.removeEventListener('click', handleClickOutside, true);
        });


        return {
            // State & Refs
            project, // Use computed project
            isLoading: computed(() => props.isLoading), // Pass down reactive isLoading
            error: computed(() => props.error), // Pass down reactive error
            showAddTagDropdown,
            addTagButtonRef,
            addTagDropdownRef,

            // Computed Props for Display
            contactName,
            contactEmail,
            contactPhone,
            formattedAddress,
            currentStageId,
            currentTrancheId,
            stageOptions,
            trancheOptions,
            processedTags, // Use computed with setter
            availableTagsForAdding, // For the dropdown
            systemSizeDisplay,
            paymentOptionDisplay,
            projectTypeBadge,
            soldDateDisplay,
            installDate,
            installDateDisplay,
            hasOpenSolarLink,
            hasAduuLink,
            hasProjectFolderLink,
            hasInvestorFolderLink,
            isFundedByRedball,

            // Methods
            handleStageChange,
            handleTrancheChange,
            handleAddTagClick,
            addTag, // New method to add a selected tag
            handleRemoveTagClick,
            handleEmailClick,
            handlePhoneClick,
            handleAddressClick,
            handleOpenSolarClick,
            handleAduuClick,
            handleFundedByRedballChange,
            handleRefreshData,
            handleRequestHelp,
            openProjectFolder,
            openInvestorFolder,
            setActiveTab,
            emit // Make emit available if needed directly in template (though usually methods handle this)
        };
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
                                    :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white', contactEmail ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white/10 text-white/50 cursor-not-allowed']"
                                    :title="contactEmail ? 'Send Email: ' + contactEmail : 'Email not available'"
                                >
                                    <i class="far fa-envelope w-4 h-4"></i>
                                    <span>Email</span>
                                </button>
                                <button
                                    @click="handlePhoneClick"
                                    :disabled="!contactPhone"
                                    :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white', contactPhone ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white/10 text-white/50 cursor-not-allowed']"
                                    :title="contactPhone ? 'Call: ' + contactPhone : 'Phone not available'"
                                >
                                    <i class="far fa-phone w-4 h-4"></i>
                                    <span>Call</span>
                                </button>
                            </div>
                        </div>
                        <div class="flex flex-shrink-0 items-center gap-1 sm:gap-2">
                             <button class="p-1.5 rounded-md text-blue-100 hover:bg-white/20 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white" title="More Actions (Not Implemented)">
                                <i class="fas fa-ellipsis-v w-5 h-5"></i>
                            </button>
                            <button class="p-1.5 rounded-md text-blue-100 hover:bg-white/20 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white" title="Edit Project (Not Implemented)">
                                <i class="fas fa-pencil-alt w-5 h-5"></i>
                            </button>
                            <button @click="handleRefreshData" class="p-1.5 rounded-md text-blue-100 hover:bg-white/20 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white" title="Refresh Project Data">
                                <i class="fas fa-sync-alt w-5 h-5"></i>
                            </button>
                            <button @click="emit('close')" class="p-1.5 rounded-md text-blue-100 hover:bg-red-500/50 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white" title="Close Modal">
                                <i class="fas fa-times w-5 h-5"></i>
                            </button>
                        </div>
                    </div>

                    <div class="mt-4 flex items-center flex-wrap justify-start gap-x-3 gap-y-2">
                              <base-select-menu
                                   id="modal-stage-select"
                                   :modelValue="currentStageId"
                                   @update:modelValue="handleStageChange"
                                   :options="stageOptions"
                                   optionValueKey="value"
                                   optionLabelKey="label"
                                   :disabled="isLoading || !stageOptions.length"
                                   placeholder="Select Stage..."
                              class="w-40 bg-white/10 text-white rounded-md text-sm font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white appearance-none transition-colors duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                   :attrs="{ 'aria-label': 'Project Stage' }"
                         />
                               <base-select-menu
                                    id="modal-tranche-select"
                                    :modelValue="currentTrancheId"
                                    @update:modelValue="handleTrancheChange"
                                    :options="trancheOptions"
                                    optionValueKey="value"
                                    optionLabelKey="label"
                                    :disabled="isLoading || !trancheOptions.length"
                                    placeholder="Select Tranche..."
                               class="w-36 bg-white/10 text-white rounded-md text-sm font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white appearance-none transition-colors duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                    :attrs="{ 'aria-label': 'Project Tranche' }"
                          />
                         <label class="px-3 py-1 bg-white/10 text-white rounded-md text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-white/20 transition-colors duration-150">
                                 <input 
                                    type="checkbox" 
                                    :checked="isFundedByRedball" 
                                    @change="handleFundedByRedballChange"
                                    class="rounded border-white/50 text-teal-500 bg-white/10 focus:ring-offset-blue-600 focus:ring-white h-4 w-4 transition duration-150 ease-in-out focus:ring-2 focus:ring-teal-400 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                    :disabled="isLoading"
                                 />
                                 Funded By Redball
                              </label>
                         <span class="px-3 py-1 bg-white/20 text-white rounded-md font-medium text-sm">{{ systemSizeDisplay }}</span>
                         <span v-if="paymentOptionDisplay && paymentOptionDisplay !== 'N/A'" class="px-3 py-1 bg-white/20 text-white rounded-md text-sm font-medium">{{ paymentOptionDisplay }}</span>
                         <span v-if="installDateDisplay" :class="installDateDisplay.colorClass" class="inline-flex items-center gap-1 text-white rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-150" :title="installDateDisplay.isApprox ? 'Approximate Install Date' : 'Scheduled Install Date'"> 
                             {{ installDateDisplay.text }}
                         </span>
                         <span v-if="soldDateDisplay && soldDateDisplay !== 'N/A'" class="inline-flex items-center gap-1 bg-white/20 text-white rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap" title="Date Sold">
                              Sold: {{ soldDateDisplay }}
                         </span>
                         <span :class="projectTypeBadge.colorClass" class="inline-block text-white rounded-md px-3 py-1 text-sm font-medium tracking-wide whitespace-nowrap transition-colors duration-150" :title="projectTypeBadge.title">
                              {{ projectTypeBadge.text }}
                         </span>
                    </div>

                     <div class="flex justify-start text-sm text-blue-100 dark:text-blue-200 pt-1">
                        <button
                            class="group inline-flex items-center gap-1.5 hover:text-white transition-colors duration-150 text-left disabled:opacity-70 disabled:cursor-not-allowed"
                            @click="handleAddressClick"
                            :title="formattedAddress !== 'Address not available' && formattedAddress !== 'Address incomplete' ? 'View address on map' : formattedAddress"
                            :disabled="formattedAddress === 'Address not available' || formattedAddress === 'Address incomplete'"
                        >
                            <i class="fas fa-map-marker-alt w-4 h-4 text-blue-200 group-hover:text-white transition-colors duration-150"></i>
                            <span class="truncate">{{ formattedAddress }}</span>
                        </button>
                    </div>

                    <hr class="border-white/20 my-3"> <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-2">
                        <div class="flex items-center gap-2 flex-wrap flex-1 min-w-[200px]">
                            <span class="text-xs font-medium text-blue-100 dark:text-blue-200 flex-shrink-0 mr-1">Tags:</span>
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <base-badge
                                    v-for="tag in processedTags"
                                    :key="tag.id"
                                    :color="tag.badgeColorName"
                                    size="sm"
                                    class="group relative transition-transform duration-150 hover:scale-105 cursor-default"
                                    :title="tag.description || tag.name"
                                >
                                    {{ tag.name }}
                                    <button
                                        @click.stop="handleRemoveTagClick(tag.id)"
                                        class="ml-1 -mr-1 p-0.5 text-current opacity-60 hover:opacity-100 focus:opacity-100 hover:bg-black/20 dark:hover:bg-white/20 rounded-full transition-all focus:outline-none focus:ring-1 focus:ring-current"
                                        title="Remove Tag"
                                    >
                                        <span class="sr-only">Remove {{ tag.name }}</span>
                                        <svg class="h-2.5 w-2.5" stroke="currentColor" fill="none" viewBox="0 0 8 8"><path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6L1 7" /></svg>
                                    </button>
                                </base-badge>
                                
                                <div class="relative inline-block text-left">
                                <button
                                        ref="addTagButtonRef"
                                    @click="handleAddTagClick"
                                        title="Add Tag"
                                        :disabled="availableTagsForAdding.length === 0"
                                        class="flex-shrink-0 bg-white/20 text-white hover:bg-white/30 rounded-full w-6 h-6 flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i class="fas fa-plus w-3 h-3"></i>
                                    <span class="sr-only">Add Tag</span>
                                </button>

                                    <transition
                                        enter-active-class="transition ease-out duration-100"
                                        enter-from-class="transform opacity-0 scale-95"
                                        enter-to-class="transform opacity-100 scale-100"
                                        leave-active-class="transition ease-in duration-75"
                                        leave-from-class="transform opacity-100 scale-100"
                                        leave-to-class="transform opacity-0 scale-95"
                                    >
                                        <div
                                            v-if="showAddTagDropdown && availableTagsForAdding.length > 0"
                                            ref="addTagDropdownRef"
                                            class="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-60 overflow-y-auto"
                                            role="menu" aria-orientation="vertical" aria-labelledby="add-tag-button"
                                        >
                                            <div class="py-1" role="none">
                                                <button
                                                    v-for="tag in availableTagsForAdding"
                                                    :key="tag.id"
                                                    @click="addTag(tag)"
                                                    :title="tag.description || tag.name"
                                                    class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors duration-150"
                                                    role="menuitem"
                                                >
                                                     <span class="truncate flex-1">{{ tag.name }}</span>
                                                </button>
                                            </div>
                                        </div>
                                         <div
                                             v-else-if="showAddTagDropdown && availableTagsForAdding.length === 0"
                                             ref="addTagDropdownRef"
                                             class="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 p-4 text-sm text-gray-500 dark:text-gray-400"
                                         >
                                             No more tags available to add.
                                         </div>
                                    </transition>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <counters v-if="project" :project="project"></counters>
        </div>
    `
};

export default ModalHeader;
