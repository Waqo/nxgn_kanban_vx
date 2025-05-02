const { computed } = Vue;

export default {
  name: 'BaseSelectMenu',
  props: {
    modelValue: {
      type: [String, Number, Object, null],
      // Make it not required, default to null or empty string depending on use case
      // required: true, 
      default: null
    },
    options: {
      type: Array,
      default: () => [],
      // Allow both {value, label} and primitive arrays
      // validator: (arr) => arr.every(o => typeof o === 'object' && o.value !== undefined && o.label !== undefined)
    },
    label: { type: String, default: '' },
    placeholder: { type: String, default: 'Select an option' },
    // Keys for object options
    optionValueKey: { type: String, default: 'value' },
    optionLabelKey: { type: String, default: 'label' },
    // Standard attributes
    disabled: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
    // Allow passing attributes like id, name directly to the select element
    attrs: { type: Object, default: () => ({}) },
    // --- ADD Prop for clear button ---
    showClearButton: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // Determine the bound value for the select element
    const selectValue = computed(() => {
      if (props.modelValue && typeof props.modelValue === 'object' && props.optionValueKey) {
          return props.modelValue[props.optionValueKey];
      }
      return props.modelValue; // Handles primitive values or null
    });
    
    // Helper to get value for an option
    const getOptionValue = (option) => {
      return typeof option === 'object' ? option[props.optionValueKey] : option;
    };
    
    // Helper to get label for an option
    const getOptionLabel = (option) => {
      return typeof option === 'object' ? option[props.optionLabelKey] : option;
    };
    
    const handleChange = (event) => {
      const selectedValue = event.target.value;
      let emittedValue = null; // Default to null if nothing found or placeholder selected

      // Handle placeholder selection (empty string value)
      if (selectedValue === "") {
          emit('update:modelValue', null); // Emit null for placeholder
          return;
      }
      
      // Check if options are objects
      if (props.options.length > 0 && typeof props.options[0] === 'object' && props.optionValueKey) {
        // Find the full option object matching the selected value
        const selectedOption = props.options.find(opt => String(getOptionValue(opt)) === selectedValue);
        
        if (selectedOption !== undefined) {
            // Emit only the value, not the full object
            emittedValue = getOptionValue(selectedOption); 
        } else {
            // Fallback: if somehow the value doesn't match an object, emit the raw value
            emittedValue = selectedValue;
        }
      } else {
          // Handle primitive options array or empty options
          emittedValue = selectedValue; 
      }
      
      emit('update:modelValue', emittedValue);
    };
    
    // --- ADD Method to clear selection ---
    const clearSelection = () => {
      if (!props.disabled) {
        emit('update:modelValue', null); // Emit null to clear
      }
    };
    
    return {
      selectValue,
      getOptionValue,
      getOptionLabel,
      handleChange,
      clearSelection // Expose clearSelection
    };
  },
  // Template uses standard select, styled with Tailwind
  template: `
    <div class="base-select-wrapper">
        <label v-if="label" :for="attrs.id || 'select-' + attrs.name" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
        <div class="relative">
            <select 
                :value="selectValue" 
                @change="handleChange" 
                :disabled="disabled" 
                :required="required"
                :id="attrs.id || 'select-' + attrs.name" 
                :name="attrs.name" 
                v-bind="attrs" 
                :class="[
                    'block w-full rounded-md border-0 py-1.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-0 focus:ring-offset-0 focus:border-gray-300 sm:text-sm sm:leading-6 appearance-none disabled:bg-gray-50 disabled:cursor-not-allowed',
                    showClearButton && selectValue !== null && selectValue !== '' ? 'pr-16' : 'pr-10' // Adjust padding-right
                ]"
            >
                <option v-if="placeholder" value="" :selected="selectValue === null || selectValue === ''" disabled>{{ placeholder }}</option>
                <option v-for="(option, index) in options" 
                        :key="index" 
                        :value="getOptionValue(option)" 
                        :selected="selectValue === getOptionValue(option)"
                        :disabled="typeof option === 'object' && option.disabled === true"
                >
                    {{ getOptionLabel(option) }}
                </option>
            </select>

            <!-- Clear Button -->
            <div v-if="showClearButton && selectValue !== null && selectValue !== '' && !disabled" class="absolute inset-y-0 right-8 flex items-center pr-1.5 z-10">
                <button @mousedown.prevent="clearSelection" type="button" class="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-gray-400" aria-label="Clear selection">
                    <span class="sr-only">Clear selection</span>
                    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
                </button>
            </div>

            <!-- Custom dropdown arrow -->
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                 <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.24a.75.75 0 011.06-.04l2.7 2.92 2.7-2.92a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01-.04-1.06z" clip-rule="evenodd" /></svg>
            </div>
        </div>
    </div>
  `
}; 