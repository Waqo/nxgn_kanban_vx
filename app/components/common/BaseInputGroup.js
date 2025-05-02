const { computed } = Vue;

export default {
  name: 'BaseInputGroup',
  props: {
    // Input binding
    modelValue: {
      type: [String, Number],
      default: ''
    },
    // Input type
    type: {
      type: String,
      default: 'text'
    },
    // Add-ons
    prepend: {
      type: String,
      default: ''
    },
    prependIcon: {
      type: String,
      default: ''
    },
    append: {
      type: String,
      default: ''
    },
    appendIcon: {
      type: String,
      default: ''
    },
    // Input metadata
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    // Validation
    error: {
      type: String,
      default: ''
    },
    // Special combinations
    withCheckbox: {
      type: Boolean,
      default: false
    },
    checkboxLabel: {
      type: String,
      default: ''
    },
    checkboxChecked: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'update:checkbox-checked'],
  setup(props, { emit }) {
    // Determine if we have add-ons
    const hasLeadingAddon = computed(() => {
      return props.prepend || props.prependIcon || props.withCheckbox;
    });
    
    const hasTrailingAddon = computed(() => {
      return props.append || props.appendIcon;
    });
    
    // Input classes with conditional borders based on add-ons
    const inputClasses = computed(() => {
      const classes = [
        'block w-full min-w-0 flex-1 py-1.5 text-gray-900 ring-1 ring-inset',
        'placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6'
      ];
      
      // Add error styles or default styles
      if (props.error) {
        classes.push('ring-red-300 focus:ring-red-500');
      } else {
        classes.push('ring-gray-300 focus:ring-indigo-600');
      }
      
      // Adjust borders based on add-ons
      if (hasLeadingAddon.value && !hasTrailingAddon.value) {
        classes.push('rounded-r-md rounded-l-none');
      } else if (!hasLeadingAddon.value && hasTrailingAddon.value) {
        classes.push('rounded-l-md rounded-r-none');
      } else if (hasLeadingAddon.value && hasTrailingAddon.value) {
        classes.push('rounded-none');
      } else {
        classes.push('rounded-md');
      }
      
      return classes.join(' ');
    });
    
    // Specific prepend add-on classes
    const prependClasses = computed(() => {
      const classes = [
        'inline-flex items-center border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm'
      ];
      
      if (hasTrailingAddon.value) {
        classes.push('rounded-l-md');
      }
      
      return classes.join(' ');
    });
    
    // Specific append add-on classes
    const appendClasses = computed(() => {
      const classes = [
        'inline-flex items-center border border-l-0 border-gray-300 px-3 text-gray-500 sm:text-sm'
      ];
      
      if (hasLeadingAddon.value) {
        classes.push('rounded-r-md');
      }
      
      return classes.join(' ');
    });
    
    // Update model value
    const updateModelValue = (event) => {
      emit('update:modelValue', event.target.value);
    };
    
    // Update checkbox state
    const updateCheckboxState = (event) => {
      emit('update:checkbox-checked', event.target.checked);
    };
    
    return {
      hasLeadingAddon,
      hasTrailingAddon,
      inputClasses,
      prependClasses,
      appendClasses,
      updateModelValue,
      updateCheckboxState
    };
  },
  template: `
    <div>
      <!-- Label (if provided) -->
      <label v-if="label" :for="$attrs.id || 'input-' + $attrs.name" class="block text-sm font-medium leading-6 text-gray-900">
        {{ label }} <span v-if="required" class="text-red-500">*</span>
      </label>
      
      <div class="mt-2 flex rounded-md shadow-sm">
        <!-- Checkbox Add-on (if enabled) -->
        <span v-if="withCheckbox" class="inline-flex shrink-0 items-center rounded-l-md border border-r-0 border-gray-300 bg-white px-2 py-2">
          <div class="group grid size-4 grid-cols-1">
            <input 
              :checked="checkboxChecked"
              @change="updateCheckboxState"
              name="select-checkbox"
              :aria-label="checkboxLabel || 'Select'"
              type="checkbox" 
              class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100" 
              :disabled="disabled"
            />
            <svg class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25" viewBox="0 0 14 14" fill="none">
              <path class="opacity-0 group-has-checked:opacity-100" d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </span>
        
        <!-- Prepend Add-on (text and/or icon) -->
        <span v-if="prepend || prependIcon" :class="prependClasses">
          <i v-if="prependIcon" :class="['fas', prependIcon, prepend ? 'mr-1' : '']"></i>
          {{ prepend }}
        </span>
        
        <!-- Main Input Field -->
        <input 
          :type="type" 
          :value="modelValue" 
          @input="updateModelValue" 
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :class="inputClasses"
          v-bind="$attrs"
        />
        
        <!-- Append Add-on (text and/or icon) -->
        <span v-if="append || appendIcon" :class="appendClasses">
          {{ append }}
          <i v-if="appendIcon" :class="['fas', appendIcon, append ? 'ml-1' : '']"></i>
        </span>
        
        <!-- Dropdown Append (if slot provided) -->
        <slot name="dropdown"></slot>
      </div>
      
      <!-- Error Message -->
      <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
    </div>
  `
};
