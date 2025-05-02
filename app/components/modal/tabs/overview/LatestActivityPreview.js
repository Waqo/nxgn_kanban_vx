import BaseCard from '../../../common/BaseCard.js';

// Import VueUse composable and Vue computed
const { computed } = Vue;
const { useTimeAgo } = VueUse; 

export default {
  name: 'LatestActivityPreview',
  components: {
      BaseCard
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
    const latestActivity = computed(() => activities.value?.[0] || null);

    const activityText = computed(() => latestActivity.value?.Activity || 'No description');
    const activityAuthor = computed(() => latestActivity.value?.Is_Who || 'Unknown'); // Use Is_Who based on backend_structure
    
    // Use useTimeAgo for the timestamp
    const timestampRef = computed(() => latestActivity.value?.Added_Time);
    const timeAgo = useTimeAgo(timestampRef);
    
    const viewAll = () => {
        props.setActiveTab('activity');
    };

    return {
        latestActivity,
        activityText,
        activityAuthor,
        timeAgo,
        timestampRef,
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
            <div v-if="latestActivity" class="flex items-start gap-3 text-sm text-gray-600">
                 <i class="fas fa-history mt-1 text-gray-400"></i>
                 <div class="flex-1 min-w-0">
                     <p class="font-medium text-gray-800 break-words">{{ activityText }}</p>
                     <p class="text-xs text-gray-500 mt-1">
                         {{ activityAuthor }} • <span :title="timestampRef">{{ timeAgo }}</span>
                     </p>
                 </div>
            </div>
             <div v-else class="text-center text-sm text-gray-500 py-3">
                No activity logged yet.
            </div>
        </template>
    </base-card>
  `
}; 