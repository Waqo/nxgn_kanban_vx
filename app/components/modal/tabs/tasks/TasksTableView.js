import BaseTable from '../../../common/BaseTable.js';
import BaseBadge from '../../../common/BaseBadge.js';
// Remove incorrect import
// import { useDateFormat } from '@vueuse/core';

// Use global VueUse object
const { useDateFormat } = VueUse; 

// Import the new helper
import { getRelativeDueDate } from '../../../../utils/helpers.js'; 

const { ref } = Vue;

export default {
    name: 'TasksTableView',
    components: {
        BaseTable,
        BaseBadge
    },
    props: {
        tasks: {
            type: Array,
            required: true,
            default: () => []
        }
    },
    setup(props) {
        const tableHeaders = ref([
            { key: 'Description', label: 'Description' },
            { key: 'Assignee', label: 'Assignee' },
            { key: 'Due_Date', label: 'Due Date' },
            { key: 'Priority', label: 'Priority' },
            { key: 'Status', label: 'Status' },
            // Add other relevant columns like Added_Time, Completed_Time later if needed
        ]);

        // Helper to format date using VueUse
        const getFormattedDate = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                return useDateFormat(date, 'MMM D, YYYY').value;
            } catch (e) {
                return 'Invalid Date';
            }
        };

        // Helper to get assignee display text
        const getAssigneeDisplay = (assigneeList) => {
            // --- DEBUG LOG --- 
            console.log('getAssigneeDisplay received:', assigneeList, 'Type:', typeof assigneeList);
            
            if (!Array.isArray(assigneeList) || assigneeList.length === 0) {
                 console.log('getAssigneeDisplay returning: Unassigned');
                return 'Unassigned';
            }
            const result = assigneeList.map(a => a.zc_display_value || 'Unknown').join(', ');
            // --- DEBUG LOG --- 
            console.log('getAssigneeDisplay returning:', result);
            return result;
        };

        // Helper for status badge class
        const getStatusClass = (status) => {
            switch (status?.toLowerCase()) {
                case 'done': return 'green';
                case 'in progress': return 'blue';
                case 'cancelled': return 'gray';
                case 'to do':
                default: return 'yellow';
            }
        };

        // Helper for priority badge class
        const getPriorityClass = (priority) => {
            switch (priority?.toLowerCase()) {
                case 'critical': return 'red';
                case 'high': return 'orange';
                case 'medium': return 'yellow';
                case 'low':
                default: return 'gray';
            }
        };

        return {
            tableHeaders,
            getFormattedDate,
            getAssigneeDisplay,
            getStatusClass,
            getPriorityClass,
            getRelativeDueDate
        };
    },
    template: `
        <div class="tasks-table-view">
            <base-table :headers="tableHeaders" :items="tasks">
                <template #item.Description="{ item }">
                    <span class="text-sm text-gray-800">{{ item.Description || '-' }}</span>
                </template>
                <template #cell(Assignee)="{ item }">
                    <span class="text-xs text-gray-600">{{ getAssigneeDisplay(item.Assignee) }}</span>
                </template>
                <template #item.Due_Date="{ item }">
                     <!-- Display relative due date -->
                     <span 
                        :class="{
                            'text-red-600 font-medium': getRelativeDueDate(item.Due_Date).isOverdue,
                            'text-orange-600 font-medium': getRelativeDueDate(item.Due_Date).isDueToday
                        }"
                        class="text-xs"
                        :title="item.Due_Date ? 'Due: ' + getFormattedDate(item.Due_Date) : 'No due date set'"
                     >
                         {{ getRelativeDueDate(item.Due_Date).text }}
                     </span>
                </template>
                 <template #item.Priority="{ item }">
                     <base-badge :color="getPriorityClass(item.Priority)" size="xs">
                         {{ item.Priority || 'N/A' }}
                     </base-badge>
                </template>
                <template #item.Status="{ item }">
                    <base-badge :color="getStatusClass(item.Status)" size="xs">
                        {{ item.Status || 'N/A' }}
                    </base-badge>
                </template>
                <!-- Add slots for actions (edit/delete) later -->
            </base-table>
             <div v-if="!tasks || tasks.length === 0" class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md mt-4">
                No tasks found matching the current filters.
             </div>
        </div>
    `
}; 