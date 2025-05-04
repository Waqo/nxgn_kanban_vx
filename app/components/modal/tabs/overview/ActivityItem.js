const { computed } = Vue;
const { useTimeAgo } = VueUse; // Assumes VueUse is available globally

export default {
  name: 'ActivityItem',
  props: {
    activity: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const activity = computed(() => props.activity);

    const activityText = computed(() => activity.value?.Activity || 'No description');
    const activityAuthor = computed(() => activity.value?.Is_Who || 'Unknown'); // Use Is_Who based on backend_structure

    // Use useTimeAgo for the timestamp
    const timestampRef = computed(() => activity.value?.Added_Time);
    const timeAgo = useTimeAgo(timestampRef);

    return {
      activityText,
      activityAuthor,
      timeAgo,
      timestampRef // Expose for title attribute
    };
  },
  template: `
    <div class="flex items-start gap-3 text-sm text-gray-600">
         <i class="fas fa-history mt-1 text-gray-400"></i>
         <div class="flex-1 min-w-0">
             <p class="font-medium text-gray-800 break-words">{{ activityText }}</p>
             <p class="text-xs text-gray-500 mt-1">
                {{ activityAuthor }} • <span :title="activity.Added_Time || 'No timestamp'">{{ timeAgo }}</span>
             </p>
         </div>
    </div>
  `
}; 