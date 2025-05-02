// app/components/kanban/KanbanCard.js

// Import helper function
// Remove old helper
// import { formatDateMMDDYY } from '../../utils/helpers.js';
// Import VueUse
const { useDateFormat } = VueUse;

// Import Cancelled Stage ID constant
import { FIELD_PROJECT_CANCELLED_STAGE_ID, REPORT_USERS } from '../../config/constants.js';

// Import Pinia stores and helpers
import { useUserStore } from '../../store/userStore.js'; // Import user store
import { useProjectsStore } from '../../store/projectsStore.js'; // Import projects store
import { useModalStore } from '../../store/modalStore.js'; // Import modal store
const { mapState } = Pinia; // Use alias for clarity

// Import Vue/VueUse Imports (assuming VueUse is global via CDN) ---
const { computed, watch, ref, getCurrentInstance } = Vue; // ADD getCurrentInstance
const { useTimeAgo, useDebounceFn } = VueUse;

const KanbanCard = {
    name: 'KanbanCard',
    props: {
      project: {
        type: Object,
        required: true,
        // Expected shape defined in processors.js (e.g., ID, Owner_Name_Display, etc.)
      },
      draggedCardId: { // Added prop to receive the ID of the card being dragged
          type: String,
          default: null
      }
    },
    emits: ['dragstart', 'dragend'], // Emits events handled by KanbanColumn
    setup(props, { emit }) {
        // --- Destructure from global Vue ---
        const { computed } = Vue;
        // --- Get Current Instance --- ADD THIS
        const instance = getCurrentInstance();
        const api = instance.appContext.config.globalProperties.$api;

        // --- Get Stores ---
        const userStore = useUserStore();
        const projectsStore = useProjectsStore();
        const modalStore = useModalStore();

        // --- Computed Properties using Composition API ---
        const project = computed(() => props.project);
        const draggedCardId = computed(() => props.draggedCardId);
        const currentUserId = computed(() => userStore.currentUser?.id);

        const formattedAddress = computed(() => {
            if (!project.value.address) return 'No Address';
            return `${project.value.addressLine1 || ''}, ${project.value.city || ''}, ${project.value.state || ''}`.replace(/^, |, $/g, '');
        });
        const contactNameDisplay = computed(() => project.value.Owner_Name_Display || 'No Contact Name');
        const systemSizeDisplay = computed(() => {
            const size = parseFloat(project.value.kW_STC);
            return !isNaN(size) && size > 0 ? `${size} kW` : 'N/A';
        });
        const workBadges = computed(() => {
            const badges = [];
            const projectData = project.value;
    
            // Tree Work
            if (projectData.Tree_Work_Required) {
                const isCompleted = projectData.Tree_Work_Status === 'Completed';
                badges.push({
                    text: 'Tree',
                    color: isCompleted ? 'gray' : 'green'
                });
            }
    
            // Roof Work
            if (projectData.Roof_Work_Required) {
                const isCompleted = projectData.Roof_Work_Status === 'Completed';
                badges.push({
                    text: 'Roof',
                    color: isCompleted ? 'gray' : 'red'
                });
            }
    
            // Panel Upgrade Work
            if (projectData.Panel_Upgrade_Required) {
                const isCompleted = projectData.PU_Work_Status === 'Completed';
                badges.push({
                    text: 'PU',
                    color: isCompleted ? 'gray' : 'blue'
                });
            }
    
            return badges;
        });
        const showSurveyBadge = computed(() => Array.isArray(project.value.Survey_Results) && project.value.Survey_Results.length > 0);
        const systemSizeBadgeColor = computed(() => project.value.Is_Approved ? 'green' : 'gray');
        const isCashDeal = computed(() => project.value.Is_Cash_Finance);
        const projectTypeBadge = computed(() => {
            const isCommercial = project.value.Commercial;
            return {
                text: isCommercial ? 'COM' : 'RES',
                color: isCommercial ? 'purple' : 'blue',
                title: isCommercial ? 'Commercial' : 'Residential'
            };
        });
        const roofTypeBadge = computed(() => {
            const roofType = project.value.Roof_Type || '';
            if (!roofType) return null; // Don't show badge if no data
            const truncatedText = roofType.length > 15 ? roofType.substring(0, 15) + '...' : roofType;
            return {
                text: truncatedText,
                title: roofType, // Full text for tooltip
                color: 'gray'
            };
        });
        const permitBadge = computed(() => {
            const status = project.value.Permit_Status || '';
            if (!status || status === 'No Record') return null;
            const isApproved = ["Approved", "Projectdox Accepted"].includes(status);
            return {
                text: isApproved ? 'Permit: Y' : 'Permit: N',
                color: isApproved ? 'green' : 'red',
                title: status // Full status for tooltip
            };
        });
        const interconnectBadge = computed(() => {
            const status = project.value.Interconnection_Status || '';
            if (!status || status === 'No Record') return null;
            const isApproved = [
                "Approval to Install", 
                "Upgrades Rqd: Approval",
                "In Service",
                "Conditionally Approved",
                "Approval To Install Upgrades Required"
            ].includes(status);
            return {
                text: isApproved ? 'IC: Y' : 'IC: N',
                color: isApproved ? 'green' : 'red',
                title: status // Full status for tooltip
            };
        });

        // --- Date Formatting with useDateFormat ---
        const soldDateRef = computed(() => project.value?.Date_Sold || '');
        const formattedDateSold = computed(() => {
            // Add fallback for empty date
            return soldDateRef.value ? useDateFormat(soldDateRef, 'MM/DD/YY').value : 'N/A';
        });
        
        const installDateRef = computed(() => project.value?.Installation_Date_Time || '');
        const formattedInstallDate = computed(() => {
            // Add fallback for empty date
            return installDateRef.value ? useDateFormat(installDateRef, 'MM/DD/YY').value : 'N/A';
        });

        const daysSinceSold = computed(() => {
            if (!soldDateRef.value) return null;
            try {
                const soldDate = new Date(soldDateRef.value);
                const today = new Date();
                // Reset time part for accurate day difference
                soldDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                const diffTime = Math.abs(today - soldDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays;
            } catch (e) {
                console.error("Error calculating days since sold:", e);
                return null;
            }
        });
        const installDateBadge = computed(() => {
            if (!installDateRef.value) return null;
            const formattedDate = formattedInstallDate.value;
            if (!formattedDate || formattedDate === 'N/A') return null;
            return { text: `Inst: ${formattedDate}`, color: 'green' };
        });
        const salesRepDisplay = computed(() => {
            const name = project.value.Sales_Rep_Name || 'Unassigned';
            const limit = 15;
            return name.length > limit ? name.substring(0, limit) + '...' : name;
        });
        const yieldBadge = computed(() => {
            const yieldVal = parseFloat(project.value.Yield);
            if (isNaN(yieldVal) || yieldVal === 0) return null;
            const formattedYield = yieldVal.toFixed(2);
            let color = 'gray';
            if (yieldVal < 1000) {
                color = 'red';
            } else if (yieldVal <= 1100) {
                color = 'yellow';
            } else {
                color = 'green';
            }
            return {
                text: formattedYield,
                color: color,
                title: `${yieldVal} kWh/kWp`
            };
        });
        const isPossibleDuplicate = computed(() => {
            const duplicateIds = projectsStore.duplicateLatLongProjectIds; // Access getter directly
            
            // Add safety check in case getter isn't ready immediately
            if (!duplicateIds || typeof duplicateIds.has !== 'function') { 
                // console.warn('KanbanCard: duplicateProjectIds Set not yet available.');
                return false; // Default to false if Set is not ready
            }
            
            const isDuplicate = duplicateIds.has(project.value.ID);
            const isCancelled = project.value.New_Stage?.ID === FIELD_PROJECT_CANCELLED_STAGE_ID;
            return isDuplicate && !isCancelled;
        });

        // --- Methods --- 
        const handleDragStart = (event) => {
            console.log(`KanbanCard: Drag Start - Project ID: ${project.value.ID}`);
            event.dataTransfer.setData('text/plain', project.value.ID);
            event.dataTransfer.effectAllowed = 'move';
            emit('dragstart');
        };
        const handleDragEnd = (event) => {
            console.log(`KanbanCard: Drag End - Project ID: ${project.value.ID}`);
            emit('dragend');
        };
        const handlePhoneClick = () => { 
            const phoneToCall = project.value.Owner_Phone;
            const contactName = contactNameDisplay.value;
            const agentUserId = currentUserId.value; 

            if (!phoneToCall || !agentUserId) {
                 // Use combined check and single alert/log for brevity
                 const missing = !phoneToCall ? 'phone number' : 'user ID';
                 console.warn(`KanbanCard: Cannot initiate call, missing ${missing}.`);
                 alert(`Cannot initiate call: Missing ${missing}.`);
                 return;
            }
            
            const cleanedPhone = phoneToCall.replace(/[^+\d]/g, '');
            const payload = {
                data: { In_Call: true, Calling_Number: cleanedPhone, Calling_Name: contactName }
            };
            
            console.log(`KanbanCard: INFO - Initiating call to ${contactName}...`); 
            console.log(`KanbanCard: Updating user ${agentUserId} call status in ${REPORT_USERS}`);

            api.updateRecordById(REPORT_USERS, agentUserId, payload) // USE api instead of this.$api
                .then(response => {
                    console.log(`KanbanCard: SUCCESS - User call status updated for ${agentUserId}.`);
                    console.log(`KanbanCard: Triggering parent page reload.`);
                    // Reload the parent page after successful update.
                    // NOTE: This reload is REQUIRED by the Zoho integration to properly handle the call initiation process.
                    try {
                       if (api && typeof api.navigateParentUrl === 'function') { // USE api
                           api.navigateParentUrl({ action: "reload" }); // Call with reload action
                       } else {
                           console.warn('api.navigateParentUrl not available, attempting direct reload.');
                           window.location.reload(); // Fallback reload
                       }
                    } catch(reloadError) {
                         console.error('Error attempting to reload page:', reloadError);
                         alert('Call initiated, but failed to reload page.');
                    }
                })
                .catch(error => {
                    console.error(`KanbanCard: Failed to update user call status for ${agentUserId}:`, error);
                    alert(`Failed to initiate call: ${error.message || 'Unknown error'}`); 
                });
        };
        const handleEmailClick = () => {
            const email = project.value.Owner_Email;
            if (!email) {
                console.warn('KanbanCard: No email address available.');
                alert('No email address available for this contact.');
                return;
            }
            const mailtoUrl = `mailto:${email}`;
            console.log(`KanbanCard: Calling API service navigateParentUrl for email: ${mailtoUrl}`);
             try {
               if (api && typeof api.navigateParentUrl === 'function') { // USE api instead of this.$api
                  // Call with config object for opening mailto link (defaults to new window/tab)
                  api.navigateParentUrl({ action: 'open', url: mailtoUrl }); // USE api
               } else {
                   console.error('api.navigateParentUrl not available on this component.');
                   window.location.href = mailtoUrl; // Keep direct fallback
               }
            } catch (error) {
                console.error('Error invoking api.navigateParentUrl for email:', error);
                 try {
                    window.location.href = mailtoUrl; // Keep direct fallback
                } catch (fallbackError) {
                    console.error("Error opening mailto link as fallback:", fallbackError);
                    alert("Could not open email client. Please check browser settings or copy the email address manually.");
                }
            }
        };
        const handleCardClick = () => {
            console.log(`KanbanCard: Card clicked, calling modalStore.openModal for Project ID: ${project.value.ID}`);
            modalStore.openModal(project.value.ID); // Call Pinia action
        };

        return {
            // Return all computed props and methods needed by the template
            formattedAddress,
            contactNameDisplay,
            systemSizeDisplay,
            workBadges,
            showSurveyBadge,
            systemSizeBadgeColor,
            isCashDeal,
            projectTypeBadge,
            roofTypeBadge,
            permitBadge,
            interconnectBadge,
            formattedDateSold,
            daysSinceSold,
            installDateBadge,
            salesRepDisplay,
            yieldBadge,
            isPossibleDuplicate,
            handleDragStart,
            handleDragEnd,
            handlePhoneClick,
            handleEmailClick,
            handleCardClick
        };
    },
    template: `
        <div
          :draggable="true"
          @dragstart="handleDragStart"
          @dragend="handleDragEnd"
          :class="[
              'kanban-card bg-white rounded-md shadow p-3 border border-gray-200 hover:shadow-md cursor-grab active:cursor-grabbing transition-opacity duration-150',
              project.Need_Help ? 'border-l-4 border-red-500' : '',
              project.ID === draggedCardId ? 'opacity-50 border-dashed border-blue-300 bg-gray-50' : '' // Apply styling if this card is being dragged
          ]"
          @dblclick="handleCardClick"
          >
          <!-- Card Header -->
          <div :class="[
              'flex items-center justify-between p-2 bg-gray-50 rounded-t-md -m-3 mb-3 border-b border-gray-200'
          ]">
               <!-- Left side: Work/Survey Badges -->
               <div class="flex flex-wrap items-center gap-1">
                   <base-badge v-for="badge in workBadges" :key="badge.text" :color="badge.color" :title="badge.text">
                       {{ badge.text }}
                   </base-badge>
               </div>
               <!-- Right side: Cash Deal and Duplicate Badge -->
               <div class="flex items-center gap-2 ml-auto">
                    <i v-if="isCashDeal" class="fas fa-dollar-sign text-green-600" title="Cash Deal"></i>
                    <base-badge v-if="isPossibleDuplicate" color="yellow" title="Possible Duplicate" class="px-1.5 py-0.5">
                        DUP
                    </base-badge>
               </div>
          </div>
  
          <!-- Contact Name & Icons -->
          <div class="mb-2 flex items-center justify-between">
               <h4 class="text-sm font-medium text-gray-800 truncate mr-2" :title="contactNameDisplay">{{ contactNameDisplay }}</h4>
               <!-- Icons Container -->
               <div class="flex items-center space-x-2 flex-shrink-0">
                    <!-- Phone Icon -->
                    <i 
                        v-if="project.Owner_Phone"
                        class="fas fa-phone-alt text-blue-500 hover:text-blue-700 cursor-pointer"
                        title="Click to call"
                        @click.stop="handlePhoneClick">
                    </i>
                    <!-- Email Icon -->
                    <i 
                        v-if="project.Owner_Email"
                        class="fas fa-envelope text-blue-500 hover:text-blue-700 cursor-pointer"
                        title="Click to email"
                        @click.stop="handleEmailClick">
                    </i>
               </div>
          </div>
  
          <div class="mb-2 flex items-center gap-1.5 text-sm text-gray-700" :title="formattedAddress">
              <i class="fas fa-map-marker-alt text-gray-400 w-4 text-center"></i>
              <span class="truncate">{{ project.addressLine1 || 'No Address' }}</span>
          </div>
  
          <div class="mb-2 flex flex-wrap gap-1">
              <base-badge v-if="showSurveyBadge" color="gray" title="Survey Completed">
                   SURV
               </base-badge>
               <base-badge v-if="project.kW_STC" :color="systemSizeBadgeColor">
                   {{ systemSizeDisplay }}
               </base-badge>
               <base-badge :color="projectTypeBadge.color" :title="projectTypeBadge.title">{{ projectTypeBadge.text }}</base-badge>
               <base-badge v-if="roofTypeBadge" :color="roofTypeBadge.color" :title="roofTypeBadge.title">{{ roofTypeBadge.text }}</base-badge>
               <base-badge v-if="permitBadge" :color="permitBadge.color" :title="permitBadge.title">{{ permitBadge.text }}</base-badge>
               <base-badge v-if="interconnectBadge" :color="interconnectBadge.color" :title="interconnectBadge.title">{{ interconnectBadge.text }}</base-badge>
          </div>
  
          <div class="text-xs text-gray-600 space-y-1"></div>
  
          <!-- Footer Section -->
          <div class="mt-2 pt-2 border-t border-gray-100 text-xs space-y-1.5">
              <!-- Row 1: Dates -->
              <div class="flex items-center justify-between gap-2">
                  <!-- Sold Date & Days Ago -->
                  <div v-if="formattedDateSold && formattedDateSold !== 'N/A'" class="flex items-center gap-1 text-gray-600">
                      <span>Sold: {{ formattedDateSold }}</span>
                      <base-badge 
                           v-if="daysSinceSold !== null"
                           color="gray"
                           :title="daysSinceSold + ' days ago'"
                           class="px-1 py-0.5" 
                           align="center" >
                               {{ daysSinceSold }}
                      </base-badge>
                  </div>
                  <div v-else></div> <!-- Spacer if no sold date -->
                  
                  <!-- Install Date Badge -->
                  <base-badge v-if="installDateBadge" :color="installDateBadge.color" class="flex-shrink-0">{{ installDateBadge.text }}</base-badge>
              </div>

              <!-- Row 2: Sales Rep & Yield -->
              <div class="flex items-center justify-between gap-2">
                  <!-- Sales Rep -->
                  <div class="flex items-center text-gray-500 min-w-0" :title="project.Sales_Rep_Name || 'Unassigned'">
                      <i class="far fa-user w-3 h-3 mr-1"></i>
                      <span class="truncate">{{ salesRepDisplay }}</span>
                  </div>
                  <!-- Yield Badge -->
                  <base-badge v-if="yieldBadge" :color="yieldBadge.color" class="flex-shrink-0" :title="yieldBadge.title">{{ yieldBadge.text }}</base-badge>
              </div>
          </div>
        </div>
      `
  };
  
  export default KanbanCard;