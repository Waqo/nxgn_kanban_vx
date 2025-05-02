import { formatCurrency } from '../../../../utils/helpers.js';
const { computed } = Vue;

export default {
  name: 'MaterialItem',
  // Assume BaseButton is globally registered
  props: {
    material: {
      type: Object,
      required: true
    },
    // Add props to manage confirmation state for this specific item
    isConfirmingDelete: {
        type: Boolean,
        default: false
    },
    // REMOVED: isAnyFormOpen prop
    // isAnyFormOpen: {
    //     type: Boolean,
    //     default: false
    // }
  },
  emits: ['edit', 'delete-request', 'confirm-delete', 'cancel-delete'],
  setup(props, { emit }) {
    const material = computed(() => props.material);

    const handleEdit = () => {
      emit('edit', props.material); // Emit the full material object
    };
    const handleDeleteRequest = () => {
      emit('delete-request', props.material.ID);
    };
     const handleConfirmDelete = () => {
      emit('confirm-delete', props.material.ID);
    };
     const handleCancelDelete = () => {
      emit('cancel-delete'); // No ID needed, just cancels the confirmation state
    };


    return {
      material,
      formatCurrency,
      handleEdit,
      handleDeleteRequest,
      handleConfirmDelete,
      handleCancelDelete
    };
  },
  template: `
    <div class="grid grid-cols-4 gap-4 items-center py-3 px-4">
        <div class="col-span-2 font-medium text-gray-900 text-sm break-words" :title="material.Manufacturer + ' - ' + material.Model">
            {{ material.Manufacturer }} - {{ material.Model }}
        </div>
        <div class="text-sm text-gray-600 text-center">Qty: {{ material.Quantity }}</div>
        <div class="text-gray-700 text-right text-sm font-medium flex justify-end items-center gap-1">
            <span>{{ formatCurrency(material.Total_Price) }}</span>

            <!-- Action Buttons: Edit/Delete/Confirm -->
            <!-- MODIFIED: Show buttons only if not confirming delete -->
            <template v-if="!isConfirmingDelete">
                <base-button 
                    @click="handleEdit" 
                    variant="icon-ghost" 
                    size="xs" 
                    title="Edit" 
                    :showFocusRing="false"
                >
                    <i class="far fa-edit"></i>
                </base-button>
                <base-button 
                    @click="handleDeleteRequest" 
                    variant="icon-ghost" 
                    size="xs" 
                    class="text-red-500 hover:text-red-700" 
                    title="Delete"
                    :showFocusRing="false"
                >
                    <i class="far fa-trash-alt"></i>
                </base-button>
            </template>
            <!-- Confirmation Buttons -->
            <template v-else>
                <span class="text-xs text-red-600 mr-1">Delete?</span>
                <base-button 
                    @click="handleConfirmDelete" 
                    variant="icon-ghost" 
                    size="xs" 
                    class="text-red-500 hover:text-red-700" 
                    title="Confirm Delete"
                    :showFocusRing="false"
                >
                   <i class="fas fa-check"></i>
                </base-button>
                 <base-button 
                    @click="handleCancelDelete" 
                    variant="icon-ghost" 
                    size="xs" 
                    class="text-gray-500 hover:text-gray-700" 
                    title="Cancel"
                    :showFocusRing="false"
                 >
                    <i class="fas fa-times"></i>
                 </base-button>
            </template>
            <!-- REMOVED: Placeholder/Disabled state when a form is open -->
            <!-- 
             <template v-else-if="isAnyFormOpen">
                <base-button variant="icon-ghost" size="xs" disabled> <i class="far fa-edit opacity-30"></i> </base-button>
                <base-button variant="icon-ghost" size="xs" disabled> <i class="far fa-trash-alt opacity-30"></i> </base-button>
             </template> 
             -->
        </div>
    </div>
    `
}; 