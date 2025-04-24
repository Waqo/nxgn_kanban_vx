// app/components/modal/tabs/tasks/TasksTab.js

// No base component imports needed currently

// Pinia imports if needed directly
// import { useModalStore } from '../../store/modalStore.js';

// Vuex no longer needed
// if (typeof Vuex === 'undefined') { ... }

const TasksTab = {
    name: 'TasksTab',
    components: {},
    // Define the project prop
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    computed: {
        // Remove Vuex mapState
        // ...(typeof Vuex !== 'undefined' ? Vuex.mapState('modal', { ... }) : { ... }),

        // Get the tasks array from the prop
        tasks() {
            return this.project?.Tasks || []; 
        },
    },
    methods: {
        // Helper to format date
        formatDateSimple(dateString) {
            if (!dateString) return 'N/A';
            try {
                return new Date(dateString).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                });
            } catch (e) {
                return 'Invalid Date';
            }
        },
        // Placeholder for adding a task later
        addTask() {
            alert('Add Task functionality not implemented yet.');
        },
        // Helper to get assignee display text
        getAssigneeDisplay(assigneeList) {
            if (!Array.isArray(assigneeList) || assigneeList.length === 0) {
                return 'Unassigned';
            }
            // Assuming zc_display_value holds the name
            return assigneeList.map(a => a.zc_display_value || 'Unknown').join(', ');
        },
        // Helper for status badge class
        getStatusClass(status) {
            switch(status?.toLowerCase()) {
                case 'done': return 'bg-green-100 text-green-800';
                case 'in progress': return 'bg-blue-100 text-blue-800';
                case 'cancelled': return 'bg-gray-100 text-gray-500';
                case 'to do':
                default: return 'bg-yellow-100 text-yellow-800';
            }
        },
         // Helper for priority badge class
        getPriorityClass(priority) {
             switch(priority?.toLowerCase()) {
                case 'critical': return 'bg-red-100 text-red-800 font-bold';
                case 'high': return 'bg-orange-100 text-orange-800 font-semibold';
                case 'medium': return 'bg-yellow-100 text-yellow-800';
                case 'low':
                default: return 'bg-gray-100 text-gray-700';
            }
        }
    },
    template: `
        <div class="tasks-tab-content">
             <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Tasks</h3>
                <button @click="addTask" class="text-sm text-blue-600 hover:text-blue-800">+ Add Task</button>
            </div>

            <div v-if="tasks.length > 0" class="space-y-3">
                 <div v-for="task in tasks" :key="task.ID" class="p-3 border border-gray-200 rounded-md bg-white shadow-sm">
                    <div class="flex justify-between items-start gap-4">
                        <div class="flex-grow">
                            <p class="text-sm text-gray-800 mb-1">{{ task.Description || 'No description' }}</p>
                             <div class="flex items-center gap-3 text-xs text-gray-500">
                                <span>Due: {{ formatDateSimple(task.Due_Date) }}</span>
                                <span>Assignee(s): {{ getAssigneeDisplay(task.Assignee) }}</span>
                             </div>
                        </div>
                        <div class="flex flex-col items-end flex-shrink-0 space-y-1">
                             <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', getStatusClass(task.Status)]">{{ task.Status || 'N/A' }}</span>
                             <span :class="['px-2 py-0.5 rounded-full text-xs', getPriorityClass(task.Priority)]">{{ task.Priority || 'N/A' }}</span>
                        </div>
                    </div>
                     <!-- TODO: Add expand/details/edit later -->
                 </div>
            </div>
             <div v-else class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md">
                No tasks found for this project.
             </div>
        </div>
    `
};

export default TasksTab; 