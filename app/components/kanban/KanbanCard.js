// app/components/kanban/KanbanCard.js

// Import helper function
import { formatDateMMDDYY } from '../../utils/helpers.js';
// Import Cancelled Stage ID constant
import { FIELD_PROJECT_CANCELLED_STAGE_ID, REPORT_USERS } from '../../config/constants.js';

// Ensure Vuex is available (needed for mapActions now)
if (typeof Vuex === 'undefined') {
  console.warn('Vuex might not be loaded yet for mapGetters/mapActions helper in KanbanCard.');
}

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
    computed: {
      // Map the duplicate IDs getter from the store here
      ...(typeof Vuex !== 'undefined' ? Vuex.mapGetters({
          duplicateProjectIds: 'projects/duplicateLatLongProjectIds'
      }) : {
          // Fallback
          duplicateProjectIds: () => new Set()
      }),
      ...(typeof Vuex !== 'undefined' ? Vuex.mapState('user', {
           // Map current user state to get the agent's ID
           currentUserId: state => state.currentUser?.id
      }) : {
          currentUserId: () => null
      }),
      formattedAddress() {
        if (!this.project.address) return 'No Address';
        return `${this.project.addressLine1 || ''}, ${this.project.city || ''}, ${this.project.state || ''}`.replace(/^, |, $/g, '');
      },
      contactNameDisplay() {
          return this.project.Owner_Name_Display || 'No Contact Name';
      },
      systemSizeDisplay() {
          const size = parseFloat(this.project.kW_STC);
          return !isNaN(size) && size > 0 ? `${size} kW` : 'N/A';
      },
      workBadges() {
          const badges = [];
          const project = this.project;
  
          // Tree Work
          if (project.Tree_Work_Required) {
              const isCompleted = project.Tree_Work_Status === 'Completed';
              badges.push({
                  text: 'Tree',
                  color: isCompleted ? 'gray' : 'green'
              });
          }
  
          // Roof Work
          if (project.Roof_Work_Required) {
              const isCompleted = project.Roof_Work_Status === 'Completed';
              badges.push({
                  text: 'Roof',
                  color: isCompleted ? 'gray' : 'red'
              });
          }
  
          // Panel Upgrade Work
          if (project.Panel_Upgrade_Required) {
              const isCompleted = project.PU_Work_Status === 'Completed';
              badges.push({
                  text: 'PU',
                  color: isCompleted ? 'gray' : 'blue'
              });
          }
  
          return badges;
      },
      showSurveyBadge() {
          return Array.isArray(this.project.Survey_Results) && this.project.Survey_Results.length > 0;
      },
      systemSizeBadgeColor() {
          return this.project.Is_Approved ? 'green' : 'gray';
      },
      isCashDeal() {
          return this.project.Is_Cash_Finance;
      },
      // *** REMOVED: headerBorderClasses computed property is no longer needed ***
      projectTypeBadge() {
           const isCommercial = this.project.Commercial;
           return {
               text: isCommercial ? 'COM' : 'RES',
               color: isCommercial ? 'purple' : 'blue',
               title: isCommercial ? 'Commercial' : 'Residential'
           };
      },
      roofTypeBadge() {
           const roofType = this.project.Roof_Type || '';
           if (!roofType) return null; // Don't show badge if no data
           const truncatedText = roofType.length > 15 ? roofType.substring(0, 15) + '...' : roofType;
           return {
               text: truncatedText,
               title: roofType, // Full text for tooltip
               color: 'gray'
           };
      },
      permitBadge() {
           const status = this.project.Permit_Status || '';
           if (!status || status === 'No Record') return null;
           const isApproved = ["Approved", "Projectdox Accepted"].includes(status);
           return {
               text: isApproved ? 'Permit: Y' : 'Permit: N',
               color: isApproved ? 'green' : 'red',
               title: status // Full status for tooltip
           };
      },
      interconnectBadge() {
           const status = this.project.Interconnection_Status || '';
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
      },
      formattedDateSold() {
          return formatDateMMDDYY(this.project.Date_Sold);
      },
      daysSinceSold() {
          if (!this.project.Date_Sold) return null;
          try {
              const soldDate = new Date(this.project.Date_Sold);
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
      },
      installDateBadge() {
          const installDate = this.project.Installation_Date_Time;
          if (!installDate) return null;
          const formattedDate = formatDateMMDDYY(installDate);
          if (!formattedDate) return null;
          return {
              text: `Inst: ${formattedDate}`,
              color: 'green'
          };
      },
      salesRepDisplay() {
          const name = this.project.Sales_Rep_Name || 'Unassigned';
          const limit = 15;
          return name.length > limit ? name.substring(0, limit) + '...' : name;
      },
      yieldBadge() {
          const yieldVal = parseFloat(this.project.Yield);
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
      },
      // Computed property to check if this card is a potential duplicate (excluding cancelled)
      isPossibleDuplicate() {
          const isDuplicate = this.duplicateProjectIds.has(this.project.ID);
          const isCancelled = this.project.New_Stage?.ID === FIELD_PROJECT_CANCELLED_STAGE_ID;
          return isDuplicate && !isCancelled;
      },
      // Map UI action for notifications
      ...(typeof Vuex !== 'undefined' ? Vuex.mapActions('ui', [
          'addNotification'
      ]) : {
          // Provide a function for addNotification in the fallback case
          addNotification(notification) { console.error('Vuex not available, cannot add notification', notification); }
      }),
    },
    methods: {
      handleDragStart(event) {
        console.log(`KanbanCard: Drag Start - Project ID: ${this.project.ID}`);
        event.dataTransfer.setData('text/plain', this.project.ID);
        event.dataTransfer.effectAllowed = 'move';
        this.$emit('dragstart');
      },
      handleDragEnd(event) {
        console.log(`KanbanCard: Drag End - Project ID: ${this.project.ID}`);
        this.$emit('dragend');
      },
      handlePhoneClick() { 
          const phoneToCall = this.project.Owner_Phone;
          const contactName = this.project.Owner_Name_Display || 'Unknown Contact';
          const agentUserId = this.currentUserId; 

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

          this.$api.updateRecordById(REPORT_USERS, agentUserId, payload)
              .then(response => {
                  console.log(`KanbanCard: SUCCESS - User call status updated for ${agentUserId}.`);
                  console.log(`KanbanCard: Triggering parent page reload.`);
                  // Reload the parent page after successful update
                  try {
                     if (this.$api && typeof this.$api.navigateParentUrl === 'function') {
                         this.$api.navigateParentUrl({ action: "reload" }); // Call with reload action
                     } else {
                         console.warn('$api.navigateParentUrl not available, attempting direct reload.');
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
      },
      handleEmailClick() {
          const email = this.project.Owner_Email;
          if (!email) {
              console.warn('KanbanCard: No email address available.');
              alert('No email address available for this contact.');
              return;
          }
          const mailtoUrl = `mailto:${email}`;
          console.log(`KanbanCard: Calling API service navigateParentUrl for email: ${mailtoUrl}`);
           try {
             if (this.$api && typeof this.$api.navigateParentUrl === 'function') {
                // Call with config object for opening mailto link (defaults to new window/tab)
                this.$api.navigateParentUrl({ action: 'open', url: mailtoUrl }); 
             } else {
                 console.error('$api.navigateParentUrl not available on this component.');
                 window.location.href = mailtoUrl; // Keep direct fallback
             }
          } catch (error) {
              console.error('Error invoking $api.navigateParentUrl for email:', error);
               try {
                  window.location.href = mailtoUrl; // Keep direct fallback
              } catch (fallbackError) {
                  console.error("Error opening mailto link as fallback:", fallbackError);
                  alert("Could not open email client. Please check browser settings or copy the email address manually.");
              }
          }
      }
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
                  <div v-if="formattedDateSold" class="flex items-center gap-1 text-gray-600">
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