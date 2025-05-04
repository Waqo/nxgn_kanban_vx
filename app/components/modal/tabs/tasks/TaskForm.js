// app/components/modal/tabs/tasks/TaskForm.js

// Import Base Components
import BaseTextArea from '../../../common/BaseTextArea.js';
import BaseSelectMenu from '../../../common/BaseSelectMenu.js';
import BaseCombobox from '../../../common/BaseCombobox.js'; // For Assignee
import BaseButton from '../../../common/BaseButton.js';
// VueDatePicker is globally registered

// Pinia Stores
import { useProjectsStore } from '../../../../store/projectsStore.js';
import { useLookupsStore } from '../../../../store/lookupsStore.js';
import { useUiStore } from '../../../../store/uiStore.js';

// Vue Composition API
const { ref, computed, reactive } = Vue;

export default {
    name: 'TaskForm',
    components: {
        BaseTextArea,
        BaseSelectMenu,
        BaseCombobox,
        BaseButton,
        // VueDatePicker (global)
    },
    props: {
        projectId: {
            type: String,
            required: true
        },
        // Add props for editing later if needed
        // initialData: { type: Object, default: () => ({}) },
        // isEditing: { type: Boolean, default: false }
    },
    emits: ['submit', 'cancel'], // Declare events
    setup(props, { emit }) {
        const projectsStore = useProjectsStore();
        const lookupsStore = useLookupsStore();
        const uiStore = useUiStore();

        // Form state (reactive for easier handling)
        const formData = reactive({
            description: '',
            assigneeIds: [], // Holds array of selected user IDs
            priority: null,
            dueDate: null // Use null for VueDatePicker
        });
        
        const isLoading = ref(false);
        const error = ref(null);

        // Options for dropdowns
        const priorityOptions = ref([
            { value: 'Low', label: 'Low' },
            { value: 'Medium', label: 'Medium' },
            { value: 'High', label: 'High' },
            { value: 'Critical', label: 'Critical' },
        ]);

        // Fetch users for assignee combobox if not already loaded
        if (lookupsStore.users.length === 0 && !lookupsStore.isLoadingTeamUsers) {
            lookupsStore.fetchTeamUsers(); 
        }
        const assigneeOptions = computed(() => lookupsStore.usersForTagging);

        const handleCancel = () => {
            emit('cancel');
        };

        const handleSubmit = async () => {
            error.value = null;
            isLoading.value = true;

            if (!formData.description || formData.assigneeIds.length === 0) {
                error.value = 'Description and Assignee are required.';
                isLoading.value = false;
                return;
            }

            try {
                await projectsStore.addTask({
                    projectId: props.projectId,
                    description: formData.description,
                    assigneeIds: formData.assigneeIds, // Pass the array of IDs
                    priority: formData.priority,
                    dueDate: formData.dueDate
                });
                emit('submit'); // Emit success
                 // Reset form fields after successful submission
                Object.assign(formData, { description: '', assigneeIds: [], priority: null, dueDate: null });
            } catch (err) {
                console.error("TaskForm: Error submitting task:", err);
                error.value = err.message || 'Failed to add task. Please try again.';
            } finally {
                isLoading.value = false;
            }
        };

        return {
            formData,
            isLoading,
            error,
            priorityOptions,
            assigneeOptions,
            handleCancel,
            handleSubmit
        };
    },
    // Template is similar to AddTaskModal's default slot + footer
    template: `
        <form @submit.prevent="handleSubmit" class="space-y-4 p-4 border border-blue-200 rounded-md bg-blue-50 shadow-sm">
            <h4 class="text-md font-semibold text-gray-800 mb-2">Add New Task</h4>
            
            <!-- Description -->
            <base-text-area
                label="Description"
                v-model="formData.description"
                :required="true"
                :rows="2" 
                placeholder="Enter task details..."
            />

            <!-- Assignee (Multi-select Combobox) -->
            <base-combobox
                label="Assignee(s)"
                v-model="formData.assigneeIds" 
                :options="assigneeOptions"
                :multiple="true"
                :required="true"
                placeholder="Select user(s)..."
            />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Priority -->
                <base-select-menu
                    label="Priority (Optional)"
                    v-model="formData.priority"
                    :options="priorityOptions"
                    placeholder="Select priority"
                    :clearable="true"
                />

                <!-- Due Date -->
                <div>
                     <label class="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                     <VueDatePicker 
                        v-model="formData.dueDate" 
                        :enable-time-picker="false" 
                        :clearable="true" 
                        :auto-apply="true" 
                        placeholder="Select due date" 
                        input-class-name="dp-custom-input-add-task" 
                        month-name-format="short" 
                    />
                     <!-- Styles copied from AddTaskModal -->
                     <style>
                       .dp-custom-input-add-task {
                           border-radius: 0.375rem; 
                           border-color: #d1d5db; 
                           box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); 
                           font-size: 0.875rem; 
                           padding: 0.5rem 0.75rem;
                           line-height: 1.25rem;
                           width: 100%;
                       }
                       .dp-custom-input-add-task:focus {
                           border-color: #3b82f6; 
                           box-shadow: 0 0 0 1px #3b82f6;
                       }
                     </style>
                </div>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="text-xs text-red-600 bg-red-50 p-2 rounded">
                {{ error }}
            </div>
            
            <!-- Actions -->
             <div class="flex justify-end gap-2 pt-4 border-t border-blue-100">
                 <base-button variant="secondary" @click="handleCancel" type="button" :disabled="isLoading">
                     Cancel
                 </base-button>
                 <base-button type="submit" variant="primary" :loading="isLoading" :disabled="isLoading">
                     Add Task
                 </base-button>
            </div>
        </form>
    `
}; 