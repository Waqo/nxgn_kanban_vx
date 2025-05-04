// app/components/modal/tabs/tasks/TasksKanbanView.js
// import BaseCard from '../../../common/BaseCard.js'; // No longer needed directly here
import BaseKanbanBoard from '../../../common/BaseKanbanBoard.js'; // Import BaseKanbanBoard
import BaseBadge from '../../../common/BaseBadge.js';
// Remove incorrect import
// import { useDateFormat } from '@vueuse/core';
// Import the new helper
import { getRelativeDueDate } from '../../../../utils/helpers.js'; 

// Use global VueUse object
const { useDateFormat } = VueUse; 

// Remove computed import, not needed directly in setup anymore
// const { computed } = Vue;

export default {
    name: 'TasksKanbanView',
    components: {
        // BaseCard, // Rendered via slot
        BaseKanbanBoard, // Register BaseKanbanBoard
        BaseBadge
    },
    props: {
        tasks: {
            type: Array,
            required: true,
            default: () => []
        },
        columns: { // Columns are the statuses (e.g., {id: 'To Do', title: 'To Do'})
            type: Array,
            required: true,
            default: () => []
        }
    },
    setup(props) {
        // Remove tasksByColumn computed property, BaseKanbanBoard handles grouping

        // Keep helpers needed for the item slot template
        const getFormattedDate = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                return useDateFormat(date, 'MMM D, YYYY').value;
            } catch (e) {
                return 'Invalid Date';
            }
        };

        const getAssigneeDisplay = (assigneeList) => {
            if (!Array.isArray(assigneeList) || assigneeList.length === 0) {
                return 'Unassigned';
            }
            return assigneeList.map(a => a.zc_display_value || 'Unknown').join(', ');
        };

        const getPriorityClass = (priority) => {
             switch(priority?.toLowerCase()) {
                case 'critical': return 'red';
                case 'high': return 'orange';
                case 'medium': return 'yellow';
                case 'low':
                default: return 'gray';
            }
        };
        
        // Add handler for item click (optional, can be handled in parent)
        const handleTaskClick = (task) => {
            console.log("Task clicked:", task);
            // Emit an event or handle directly if needed
        };
        
        // Add handler for task drop (optional, needed for status update)
        const handleTaskDrop = async ({ itemId, newColumnId, oldColumnId }) => {
            // Use projectsStore from outer scope or import/use it here
            const { useProjectsStore } = await import('../../../../store/projectsStore.js');
            const projectsStore = useProjectsStore();
            const { useUiStore } = await import('../../../../store/uiStore.js');
            const uiStore = useUiStore(); // For potential error notifications

            console.log(`Task ${itemId} moved from ${oldColumnId} to ${newColumnId}`);

            if (!itemId || !newColumnId || newColumnId === oldColumnId) {
                console.warn("Task drop ignored: Invalid data or same column.");
                return; 
            }

            try {
                 // Call the store action to update the status
                 await projectsStore.updateTaskStatus({ taskId: itemId, newStatus: newColumnId });
                 // Success notification is handled by the store action
                 // Optional: Add specific success logic here if needed
            } catch (error) {
                 console.error("handleTaskDrop: Error updating task status:", error);
                 // Error notification is handled by the store action, but you could add more context here
                 uiStore.addNotification({ 
                    type: 'error', 
                    title: 'Drag & Drop Failed', 
                    message: `Could not move task: ${error.message || 'Please refresh and try again.'}` 
                 });
                 // IMPORTANT: Consider reverting the visual change if the API call fails.
                 // This would likely involve emitting an event or calling a method
                 // on the parent TasksTab to trigger a refresh/re-evaluation
                 // of the tasks prop to put the card back visually.
                 // For now, we rely on the store refresh, which might have a delay.
            }
            
            // Remove the temporary alert
            // alert(`Task ${itemId} dropped onto ${newColumnId}. Status update API call not implemented yet.`);
        };

        return {
            // Helpers for the slot
            getFormattedDate,
            getRelativeDueDate,
            getAssigneeDisplay,
            getPriorityClass,
            // Event handlers
            handleTaskClick,
            handleTaskDrop
        };
    },
    // Update template to use BaseKanbanBoard
    template: `
        <base-kanban-board
            :columns="columns" 
            :items="tasks"
            column-key="id" 
            item-key="ID"       
            item-column-key="Status" 
            board-class="kanban-board flex overflow-x-auto space-x-4 h-full bg-transparent p-4" 
            column-class="kanban-column bg-gray-50 p-3 rounded-lg shadow-sm min-h-[calc(100vh-300px)] w-64 md:w-72 lg:w-80"
            item-list-class="space-y-2 kanban-item-list scrollbar-hide pt-1"
            @item-click="handleTaskClick" 
            @item-drop="handleTaskDrop" 
        >
            <!-- Use the #item slot to define how each task card looks -->
            <template #item="{ item }">
                 <div class="task-card bg-white p-3 rounded shadow-xs border border-gray-200 cursor-grab">
                     <p class="text-sm text-gray-800 mb-2 font-medium">{{ item.Description || 'No description' }}</p>
                     <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                         <!-- Display relative due date -->
                         <span 
                            :class="{
                                'text-red-600 font-medium': getRelativeDueDate(item.Due_Date).isOverdue,
                                'text-orange-600 font-medium': getRelativeDueDate(item.Due_Date).isDueToday
                            }"
                            :title="item.Due_Date ? 'Due: ' + getFormattedDate(item.Due_Date) : 'No due date set'"
                         >
                             <i class="far fa-calendar-alt mr-1"></i>{{ getRelativeDueDate(item.Due_Date).text }}
                         </span>
                         <base-badge :color="getPriorityClass(item.Priority)" size="xs">{{ item.Priority || 'N/A' }}</base-badge>
                     </div>
                     <div class="text-xs text-gray-500">
                         Assignee: {{ getAssigneeDisplay(item.Assignee) }}
                     </div>
                     <!-- Add edit/view details button later -->
                 </div>
            </template>
            
             <!-- Optional: Slot for column header customization -->
            <template #column-header="{ column }">
                 <span class="text-sm font-medium text-gray-700 uppercase tracking-wide truncate">{{ column.title }}</span>
                 <!-- Count is handled by BaseKanbanBoard now -->
             </template>

        </base-kanban-board>
    `
}; 