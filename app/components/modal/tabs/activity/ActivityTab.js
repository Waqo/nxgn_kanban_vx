const ActivityTab = {
    name: 'ActivityTab',
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    computed: {
        activities() {
            // Processor should ensure this is an array and potentially sort it
            return this.project?.Activities || [];
        }
    },
    methods: {
        formatRelativeTime(timestamp) {
            if (!timestamp) return '';
            const now = new Date();
            const past = new Date(timestamp);
            if (isNaN(past.getTime())) return 'Invalid Date';
            const diffInSeconds = Math.floor((now - past) / 1000);
            if (diffInSeconds < 60) return 'Just now';
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours}h ago`;
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays === 1) return 'Yesterday';
            return `${diffInDays}d ago`;
        },
        // Placeholder for potentially adding manual activity later
        addActivity() {
            alert('Add Activity functionality not implemented yet.');
        }
    },
    template: `
        <div class="activity-tab-content">
             <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Activity Log</h3>
                <!-- <button @click="addActivity" class="text-sm text-blue-600 hover:text-blue-800">+ Add Activity</button> -->
            </div>

            <div v-if="activities.length > 0">
                 <ul role="list" class="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white shadow-sm">
                    <li v-for="activity in activities" :key="activity.ID" class="px-4 py-3">
                        <div class="flex items-center justify-between">
                            <p class="text-sm text-gray-800 flex-grow mr-4">
                                <i class="fas fa-history text-gray-400 mr-2"></i> 
                                {{ activity.Activity || 'No description' }}
                            </p>
                            <p class="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                                {{ formatRelativeTime(activity.Created_Date || activity.Added_Time) }}
                            </p>
                        </div>
                         <div class="pl-7 mt-1 text-xs text-gray-500">
                             <span>By: {{ activity.Is_Who || 'Unknown' }}</span>
                             <span class="ml-3">Source: {{ activity.Where || 'System' }}</span>
                         </div>
                    </li>
                </ul>
            </div>
            <div v-else class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md">
                No activity logged for this project.
            </div>
        </div>
    `
};

export default ActivityTab; 