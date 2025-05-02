import BaseBadge from '../../../common/BaseBadge.js';
// Remove formatDateWithOptions import
// import { formatDateWithOptions } from '../../../../utils/helpers.js';
// Import VueUse composable
const { computed } = Vue;
const { useDateFormat } = VueUse;

export default {
  name: 'EventItem',
  components: {
    BaseBadge
  },
  props: {
    event: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const event = computed(() => props.event);

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

    return {
        eventType,
        eventStatus,
        displayDate, // Use this in template
        statusBadgeColor,
        eventIconClass,
        eventDate // Keep raw date for title attribute
    };
  },
  template: `
    <div class="flex space-x-3">
        <!-- Icon -->
        <div class="flex-shrink-0">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 ring-4 ring-white">
                 <i :class="[eventIconClass, 'h-4 w-4 text-white']"></i>
            </span>
        </div>
        <!-- Content -->
        <div class="flex-1 space-y-1 min-w-0">
            <!-- Header: Type and Status -->
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium text-gray-900 truncate" :title="eventType">{{ eventType }}</h3>
                <base-badge :color="statusBadgeColor" size="xs">{{ eventStatus }}</base-badge>
            </div>
            <!-- Date -->
            <p v-if="eventDate" class="text-sm text-gray-500" :title="eventDate">{{ displayDate }}</p>
            <p v-else class="text-sm text-gray-400 italic">{{ displayDate }}</p>
            <!-- TODO: Add Edit/Book button later (Phase 5) -->
        </div>
    </div>
  `
}; 