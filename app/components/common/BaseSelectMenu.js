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
    attrs: { type: Object, default: () => ({}) }
  },
  emits: ['update:modelValue'],
  computed: {
    // Determine the bound value for the select element
    selectValue() {
      if (this.modelValue && typeof this.modelValue === 'object' && this.optionValueKey) {
          return this.modelValue[this.optionValueKey];
      }
      return this.modelValue; // Handles primitive values or null
    }
  },
  methods: {
    handleChange(event) {
      const selectedValue = event.target.value;
      let emittedValue = null; // Default to null if nothing found or placeholder selected

      // Handle placeholder selection (empty string value)
      if (selectedValue === "") {
          this.$emit('update:modelValue', null); // Emit null for placeholder
          return;
      }
      
      // Check if options are objects
      if (this.options.length > 0 && typeof this.options[0] === 'object' && this.optionValueKey) {
        // Find the full option object matching the selected value
        const selectedOption = this.options.find(opt => String(this.getOptionValue(opt)) === selectedValue);
        
        if (selectedOption !== undefined) {
            // Always emit the full object if options are objects
            emittedValue = selectedOption; 
        } else {
            // Fallback: if somehow the value doesn't match an object, emit the raw value (or null)
            // This might happen with primitive options, but the check above should handle that?
             console.warn('[BaseSelectMenu] Selected value did not match any option object.');
             emittedValue = selectedValue; // Or keep null?
        }
      } else {
          // Handle primitive options array or empty options
          emittedValue = selectedValue; 
      }
      
      this.$emit('update:modelValue', emittedValue);
    },
    // Helper to get value for an option
    getOptionValue(option) {
        return typeof option === 'object' ? option[this.optionValueKey] : option;
    },
    // Helper to get label for an option
    getOptionLabel(option) {
         return typeof option === 'object' ? option[this.optionLabelKey] : option;
    }
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
                class="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 appearance-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
                <option v-if="placeholder" value="" :selected="selectValue === null || selectValue === ''" disabled>{{ placeholder }}</option>
                <option v-for="(option, index) in options" 
                        :key="index" 
                        :value="getOptionValue(option)" 
                        :selected="selectValue === getOptionValue(option)"
                >
                    {{ getOptionLabel(option) }}
                </option>
            </select>
            <!-- Custom dropdown arrow -->
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                 <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.24a.75.75 0 011.06-.04l2.7 2.92 2.7-2.92a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01-.04-1.06z" clip-rule="evenodd" /></svg>
            </div>
        </div>
    </div>
  `
}; 