import BaseCard from '../../../common/BaseCard.js';
// Import the new ActivityItem component
import ActivityItem from './ActivityItem.js';

// Import VueUse composable and Vue computed
const { computed } = Vue;
const { useTimeAgo } = VueUse; 

// --- ADD: Simple Relative Time Calculation Helper ---
// (This avoids calling useTimeAgo outside setup)
const calculateRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Invalid date

  const thresholds = [
    { threshold: 60, divisor: 1, unit: 'second' },
    { threshold: 3600, divisor: 60, unit: 'minute' },
    { threshold: 86400, divisor: 3600, unit: 'hour' },
    { threshold: 604800, divisor: 86400, unit: 'day' },
    { threshold: 2592000, divisor: 604800, unit: 'week' },
    { threshold: 31536000, divisor: 2592000, unit: 'month' },
    { threshold: Infinity, divisor: 31536000, unit: 'year' }
  ];

  const now = new Date();
  const elapsedSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (elapsedSeconds < 5) return 'just now';

  for (const t of thresholds) {
    if (elapsedSeconds < t.threshold) {
      const value = Math.round(elapsedSeconds / t.divisor);
      return `${value} ${t.unit}${value > 1 ? 's' : ''} ago`;
    }
  }
  return ''; // Should not be reached
};

export default {
  name: 'LatestActivityPreview',
  components: {
      BaseCard,
      ActivityItem // Register the new component
  },
  props: {
    activities: {
      type: Array,
      default: () => []
    },
    setActiveTab: {
        type: Function,
        required: true
    }
  },
  setup(props) {
    const activities = computed(() => props.activities);
    
    // Assuming activities are sorted descending by DataProcessors
    const displayedActivities = computed(() => {
      const topActivities = activities.value?.slice(0, 1) || []; // Show top 1 activities
      return topActivities; // Just return the top activities
    });

    const viewAll = () => {
        props.setActiveTab('activity');
    };

    return {
        displayedActivities,
        viewAll
    };
  },
  template: `
    <base-card>
        <template #header>
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium text-gray-900">Latest Activity</h3>
                <button 
                    @click="viewAll"
                    class="text-sm text-blue-600 hover:text-blue-700"
                    :disabled="!activities || activities.length === 0"
                >
                    View All
                </button>
            </div>
        </template>
        <template #default>
            <div v-if="displayedActivities.length > 0" class="space-y-3">
                <activity-item 
                    v-for="activity in displayedActivities" 
                    :key="activity.ID" 
                    :activity="activity" 
                />
            </div>
            <div v-else class="text-center text-sm text-gray-500 py-3">
                No activity logged yet.
            </div>
        </template>
    </base-card>
  `
}; 