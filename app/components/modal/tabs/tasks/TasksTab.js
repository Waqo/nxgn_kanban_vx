// app/components/modal/tabs/tasks/TasksTab.js
import BaseButtonGroup from '../../../common/BaseButtonGroup.js';
import TasksKanbanView from './TasksKanbanView.js';
import TasksTableView from './TasksTableView.js';
import TaskForm from './TaskForm.js'; // Import the new inline form

// Pinia Stores
import { useUserStore } from '../../../../store/userStore.js';

// Vue Composition API
const { ref, computed } = Vue;

export default {
    name: 'TasksTab',
    components: {
        BaseButtonGroup,
        TasksKanbanView,
        TasksTableView,
        TaskForm // Register the inline form
    },
    props: {
        project: {
            type: Object,
            required: true
        },
        currentUser: { // Added currentUser prop
            type: Object,
            required: true
        }
    },
    setup(props) {
        const userStore = useUserStore(); // Access store if needed globally, though role comes from prop now

        const currentView = ref('kanban'); // 'kanban' or 'table'
        const isAddingTask = ref(false); // Add state for inline form

        const isAdmin = computed(() => props.currentUser?.role === 'Admin');

        const allProjectTasks = computed(() => props.project?.Tasks || []);

        // Filter tasks based on user role
        const filteredTasks = computed(() => {
            if (!Array.isArray(allProjectTasks.value)) return [];
            if (isAdmin.value) {
                return allProjectTasks.value; // Admins see all tasks for the project
            } else {
                // Non-admins see only tasks assigned to them
                const currentUserId = props.currentUser?.id;
                if (!currentUserId) return []; // Should not happen if currentUser is passed correctly

                return allProjectTasks.value.filter(task => {
                    // Assignee is an array of lookup objects { ID, zc_display_value }
                    return Array.isArray(task.Assignee) && task.Assignee.some(assignee => assignee.ID === currentUserId);
                });
            }
        });

        // Define Kanban columns (can be moved to constants if needed)
        const kanbanColumns = ref([
            { id: 'To Do', title: 'To Do' },
            { id: 'In Progress', title: 'In Progress' },
            { id: 'Done', title: 'Done' },
            { id: 'Cancelled', title: 'Cancelled' }
        ]);

        const toggleView = (view) => {
            currentView.value = view;
        };

        // Add toggle method for inline form
        const toggleAddTaskForm = () => {
            isAddingTask.value = !isAddingTask.value;
        };
        
        // Add handlers for the form component's events
        const handleTaskFormSubmit = () => {
            isAddingTask.value = false; // Close form on successful submit
            // Refresh logic is handled by the store action now
        };
        
        const handleTaskFormCancel = () => {
             isAddingTask.value = false; // Close form on cancel
        };

        return {
            currentView,
            isAdmin,
            filteredTasks,
            kanbanColumns,
            toggleView,
            isAddingTask, // Expose inline form state
            toggleAddTaskForm, // Expose toggle method
            handleTaskFormSubmit,
            handleTaskFormCancel
        };
    },
    template: `
        <div class="tasks-tab-content">
             <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Tasks ({{ filteredTasks.length }})</h3>
                <div class="flex items-center gap-2">
                    <base-button-group
                        :options="[ { value: 'kanban', label: 'Board', icon: 'fas fa-columns' }, { value: 'table', label: 'Table', icon: 'fas fa-list' } ]"
                        :modelValue="currentView"
                        @update:modelValue="toggleView"
                        size="sm"
                    />
                     <button 
                        v-if="isAdmin" 
                        @click="toggleAddTaskForm" 
                        :class="[
                            'inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2',
                            isAddingTask ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                         ]"
                        :title="isAddingTask ? 'Cancel Add Task' : 'Add New Task'"
                    >
                         <i :class="['-ml-0.5 mr-1.5 h-4 w-4', isAddingTask ? 'fas fa-times' : 'fas fa-plus']" aria-hidden="true"></i>
                         {{ isAddingTask ? 'Cancel' : 'Add Task' }}
                     </button>
                </div>
            </div>

            <!-- ADD Inline Add Task Form -->
            <div v-if="isAddingTask" class="mb-6">
                <task-form 
                    :projectId="project?.ID"
                    @submit="handleTaskFormSubmit"
                    @cancel="handleTaskFormCancel"
                 />
             </div>

            <!-- Container for view components with minimum height -->
            <div class="min-h-[400px]">
                <!-- Kanban View -->
                <tasks-kanban-view 
                    v-if="currentView === 'kanban'" 
                    :tasks="filteredTasks" 
                    :columns="kanbanColumns" 
                />

                <!-- Table View -->
                <tasks-table-view 
                    v-else-if="currentView === 'table'" 
                    :tasks="filteredTasks" 
                />
            </div>
        </div>
    `
}; 