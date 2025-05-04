import BaseBadge from '../../../common/BaseBadge.js';
// Remove formatDateWithOptions import
// import { formatDateWithOptions } from '../../../../utils/helpers.js';
// Import VueUse composable
const { computed, ref, watch } = Vue;
const { useDateFormat } = VueUse;
// --- ADD Helper Imports ---
// import { formatDateTimeForInput } from '../../../../utils/helpers.js'; // No longer needed for input
// --- ADD Base Component Imports ---
import BaseButton from '../../../common/BaseButton.js';
import BaseSelectMenu from '../../../common/BaseSelectMenu.js'; // Or a simpler select if BaseSelectMenu is too complex here
// --- ADD Store Imports ---
import { useProjectsStore } from '../../../../store/projectsStore.js';
import { useModalStore } from '../../../../store/modalStore.js';
import { useUiStore } from '../../../../store/uiStore.js';
import { useLookupsStore } from '../../../../store/lookupsStore.js'; // Needed? Maybe not directly

export default {
  name: 'EventItem',
  components: {
    BaseBadge,
    BaseButton,    // Register button
    BaseSelectMenu, // Register select
  },
  props: {
    event: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const event = computed(() => props.event);
    // --- ADD Stores ---
    const projectsStore = useProjectsStore();
    const modalStore = useModalStore(); // Needed for projectId
    const uiStore = useUiStore();

    // --- Define Helper Logic Locally --- 

    const getStatusBadgeClass = (status) => {
        // Map status names (lowercase) to BaseBadge color props
        switch (status?.toLowerCase()) {
            case 'completed': return 'green';
            case 'scheduled': return 'blue';
            case 'needs scheduling': return 'yellow';
            case 'not required':
            case 'tbd':
            default: return 'gray';
        }
    };

    const getEventIcon = (eventType) => {
        // Map event types to Font Awesome icon classes
        switch (eventType) {
            case 'Site Survey':         return 'fas fa-search';
            case 'Installation':        return 'fas fa-solar-panel';
            case 'Roof Work':           return 'fas fa-home';
            case 'Tree Work':           return 'fas fa-tree';
            case 'Final Inspection':    return 'fas fa-clipboard-check';
            case 'Panel Upgrade':       return 'fas fa-bolt';
            case 'Utility Interconnection': return 'fas fa-plug'; // Example
            case 'System Activation':   return 'fas fa-power-off'; // Example
            default:                  return 'fas fa-calendar-alt';
        }
    };

    // --- Computed Properties --- 
    const eventType = computed(() => event.value?.type || 'Unknown Event');
    const eventStatus = computed(() => event.value?.status || 'TBD');
    const eventDate = computed(() => event.value?.date); // Raw date ref
    
    // Use useDateFormat
    const formattedEventDate = useDateFormat(
        eventDate, 
        'MMM D, YYYY h:mm A', // Desired format string
        { locales: 'en-US' } // Optional: Specify locale
    );
    const displayDate = computed(() => eventDate.value ? formattedEventDate.value : 'Not Scheduled');

    const statusBadgeColor = computed(() => getStatusBadgeClass(eventStatus.value));
    const eventIconClass = computed(() => getEventIcon(eventType.value));

    // --- ADD Edit State --- 
    const isEditing = ref(false);
    const isSaving = ref(false);
    const editDate = ref(null); // Will hold a Date object or null
    const editStatus = ref(null);

    // Initialize edit values when edit mode starts
    watch(isEditing, (newValue) => {
        if (newValue) {
             // Use the raw date from the event prop for initialization
             // Convert Zoho date string to Date object
             try {
                 editDate.value = event.value?.date ? new Date(event.value.date) : null;
             } catch(e) {
                 console.warn('Could not parse event date for editing:', event.value?.date);
                 editDate.value = null;
             }
             editStatus.value = event.value?.status || '';
        } else {
             // Optionally clear edits on cancel/close?
             // editDate.value = null;
             // editStatus.value = null;
        }
    });

    // --- ADD Methods ---
    const toggleEdit = () => {
        isEditing.value = !isEditing.value;
    };

    const handleSave = async () => {
        if (!modalStore.currentProjectId || !event.value) {
            uiStore.addNotification({ type: 'error', message: 'Cannot save event: Missing project or event context.'});
            return;
        }

        isSaving.value = true;
        try {
            await projectsStore.updateProjectEvent({
                 projectId: modalStore.currentProjectId,
                 eventType: event.value.type,
                 apiBookingField: event.value.apiBookingField,
                 apiStatusField: event.value.apiStatusField,
                 newDateValue: editDate.value || null, // Pass null if empty to clear
                 newStatusValue: editStatus.value
            });
            // Success! Turn off edit mode.
            isEditing.value = false;
            // Notification is handled by store
        } catch (error) {
            // Error notification is handled by store
            console.error('EventItem: Failed to save event changes', error);
        } finally {
            isSaving.value = false;
        }
    };

    const handleCancel = () => {
        isEditing.value = false;
        // Optionally reset editDate/editStatus refs here if desired
    };

    return {
        eventType,
        eventStatus,
        displayDate, // Use this in template
        statusBadgeColor,
        eventIconClass,
        eventDate, // Keep raw date for title attribute
        // --- Expose Edit State/Methods ---
        isEditing,
        isSaving,
        editDate,
        editStatus,
        toggleEdit,
        handleSave,
        handleCancel,
    };
  },
  template: `
    <div class="flex items-center gap-3">
         <!-- Icon -->
         <div class="flex-shrink-0">
             <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 ring-4 ring-white">
                 <i :class="[eventIconClass, 'text-white text-xs']"></i>
             </span>
         </div>

         <!-- Content -->
         <div class="flex-1 min-w-0 space-y-1.5">
              <!-- Header: Type and Status -->
              <div class="flex items-center justify-between pr-6">
                  <h3 class="text-sm font-medium text-gray-900 truncate" :title="eventType">{{ eventType }}</h3>
              </div>
              <!-- Date -->
              <p :class="[eventDate ? 'text-gray-500' : 'text-gray-400 italic']" class="text-xs" :title="eventDate || 'Event date'">{{ displayDate }}</p>
              <!-- Edit Form (Conditional) -->
              <div v-if="isEditing" class="mt-2 space-y-3">
                   <div>
                       <label :for="'event-date-' + event.id" class="block text-xs font-medium text-gray-700 mb-1">Date/Time</label>
                       <VueDatePicker 
                          :id="'event-date-' + event.id" 
                          v-model="editDate" 
                          :enable-time-picker="true" 
                          :is-24="true"                 
                          format="MM/dd/yyyy HH:mm:ss"  
                          :minutes-increment="30"
                          :time-picker-inline="true"
                          :clearable="true" 
                          :auto-apply="true" 
                          placeholder="Select Date & Time" 
                          input-class-name="dp-custom-input" 
                          :disabled="isSaving"
                          month-name-format="short" 
                       />
                       <!-- Add custom styles for dp-custom-input if needed -->
                       <style>
                         .dp-custom-input {
                             border-radius: 0.375rem; /* rounded-md */
                             border-color: #d1d5db; /* border-gray-300 */
                             box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
                             font-size: 0.75rem; /* text-xs */
                             padding: 0.375rem 0.75rem; /* Similar to p-1.5 text-xs */
                             line-height: 1rem;
                             width: 100%;
                         }
                         .dp-custom-input:focus {
                             border-color: #3b82f6; /* focus:border-blue-500 */
                             box-shadow: 0 0 0 1px #3b82f6; /* Mimic focus:ring-blue-500 */
                         }
                         .dp-custom-input:disabled {
                            background-color: #f9fafb; /* bg-gray-50 */
                            cursor: not-allowed;
                         }
                       </style>
                   </div>
                   <div>
                       <label :for="'event-status-' + event.id" class="block text-xs font-medium text-gray-700">Status</label>
                       <select
                           :id="'event-status-' + event.id"
                           v-model="editStatus"
                           class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs p-1.5"
                           :disabled="isSaving"
                       >
                           <option v-for="statusOption in event.possibleStatuses" :key="statusOption" :value="statusOption">
                               {{ statusOption }}
                           </option>
                       </select>
                   </div>
                   <div>
                       <base-button size="xs" variant="secondary" @click="handleCancel" :disabled="isSaving">
                           Cancel
                       </base-button>
                       <base-button size="xs" variant="primary" @click="handleSave" :loading="isSaving" :disabled="isSaving">
                           Save
                       </base-button>
                   </div>
              </div>
         </div>

         <!-- Status Badge Column -->
         <div class="flex-shrink-0 flex items-center">
             <base-badge :color="statusBadgeColor" size="xs">{{ eventStatus }}</base-badge>
         </div>

         <!-- Edit Button Column -->
         <div class="flex-shrink-0">
             <button 
                v-if="!isEditing" 
                @click="toggleEdit" 
                class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-sm p-0.5 transition-colors"
                title="Edit Event"
             >
                 <span class="sr-only">Edit Event</span>
                 <i class="fas fa-pencil-alt text-xs"></i>
             </button>
         </div>
    </div>
`
}; 