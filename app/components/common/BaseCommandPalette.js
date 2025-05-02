const { ref, computed, watch } = Vue;
// Assuming BaseModal and BaseCombobox are registered globally or imported if using a build system
// import BaseModal from './BaseModal.js';
// import BaseCombobox from './BaseCombobox.js';

export default {
  name: 'BaseCommandPalette',
  // components: { BaseModal, BaseCombobox }, // Register if needed
  props: {
    /**
     * Controls the visibility of the command palette modal.
     * Use v-model:show="yourVisibilityVariable".
     */
    show: {
      type: Boolean,
      default: false,
    },
    /**
     * Array of items/commands to display and search.
     * Shape depends on how you structure the #option slot or BaseCombobox usage.
     * Example: [{ id: 1, name: 'Add User', category: 'Users', icon: 'fas fa-user-plus', url: '#' }]
     */
    options: {
      type: Array,
      default: () => [],
    },
    /**
     * Placeholder text for the search input.
     */
    placeholder: {
      type: String,
      default: 'Search...'
    },
    /**
     * Key in the option object to use for the display label (passed to BaseCombobox).
     */
    optionLabelKey: {
        type: String,
        default: 'name'
    },
     /**
     * Key in the option object to use for the unique value (passed to BaseCombobox).
     */
    optionValueKey: {
        type: String,
        default: 'id'
    },
    /**
     * Text displayed when the search query yields no results.
     */
    emptyResultMessage: {
        type: String,
        default: 'No results found.'
    },
     /**
     * Text or prompt displayed when the search query is empty.
     */
    initialPrompt: {
        type: String,
        default: 'Start typing to search...'
    },
     /**
      * Size variant for the underlying BaseModal.
      */
     modalSize: {
         type: String,
         default: 'xl' // Default to a larger size for palettes
     },
    /**
     * Enable persistent mode for the underlying BaseModal (prevents closing on overlay click).
     */
    persistent: {
        type: Boolean,
        default: false
    }
    // Add other props as needed to pass down (e.g., display options for BaseCombobox)
  },
  emits: ['update:show', 'select'],
  setup(props, { emit, slots }) {
    const internalComboboxModel = ref(null); // Track selection within combobox

    const handleClose = () => {
      emit('update:show', false);
    };

    // Watch the internal model of the combobox
    watch(internalComboboxModel, (newValue) => {
      if (newValue) {
        console.log('Command Palette: Item selected', newValue);
        emit('select', newValue);
        // Optionally close the palette after selection
        handleClose();
        // Reset internal model after emitting
        internalComboboxModel.value = null;
      }
    });

    return {
      handleClose,
      internalComboboxModel
    };
  },
  // Note: This component primarily orchestrates BaseModal and BaseCombobox.
  // Customization happens via slots passed down to BaseCombobox.
  template: `
    <base-modal
      :show="show"
      @close="handleClose"
      :size="modalSize"
      :persistent="persistent"
      :hide-close-button="true" 
      :no-header-padding="true" 
      scroll-behavior="inside" 
    >
      <!-- Use the default slot of BaseModal -->
      <template #default>
        <base-combobox
            v-model="internalComboboxModel"
            :options="options"
            :placeholder="placeholder"
            :optionLabelKey="optionLabelKey"
            :optionValueKey="optionValueKey"
            class="w-full" 
            ref="combobox"
        >
           <!-- Pass through slots to BaseCombobox -->
           <template #option="{ option, active, selected }">
               <slot name="option" :option="option" :active="active" :selected="selected">
                   <!-- Default Option Rendering -->
                   <div class="flex items-center">
                       <i v-if="option.icon" :class="[option.icon, 'size-5 mr-3 flex-none', active ? 'text-white' : 'text-gray-400']"></i>
                       <span class="flex-auto truncate">{{ option[optionLabelKey] }}</span>
                       <span v-if="active" class="ml-3 flex-none" :class="active ? 'text-indigo-100' : 'text-gray-400'">Jump to...</span>
                   </div>
               </slot>
           </template>

           <template #empty-state="{ query }">
              <slot name="empty-state" :query="query">
                  <div class="px-6 py-14 text-center text-sm sm:px-14">
                     <i class="fas fa-exclamation-circle mx-auto size-6 text-gray-400"></i>
                     <p class="mt-4 font-semibold text-gray-900">{{ emptyResultMessage }}</p>
                     <p class="mt-2 text-gray-500">We couldn't find anything with that term. Please try again.</p>
                 </div>
              </slot>
           </template>
           
           <template #initial-state>
              <slot name="initial-state">
                   <div class="px-6 py-14 text-center text-sm sm:px-14">
                     <i class="fas fa-search mx-auto size-6 text-gray-400"></i>
                     <p class="mt-4 font-semibold text-gray-900">{{ initialPrompt }}</p>
                     <p class="mt-2 text-gray-500">Quickly search for commands or items.</p>
                 </div>
              </slot>
           </template>
           
        </base-combobox>
      </template>
      
      <!-- Optional Footer -->
       <template #footer v-if="$slots.footer">
           <slot name="footer"></slot>
       </template>
       
    </base-modal>
  `
}; 