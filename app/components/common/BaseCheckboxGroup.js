const { computed, ref } = Vue;

export default {
  name: 'BaseCheckboxGroup',
  props: {
    // Data binding
    modelValue: {
      type: Array,
      default: () => []
    },
    // Options array
    options: {
      type: Array,
      default: () => []
    },
    // Option keys for object options
    optionValueKey: {
      type: String,
      default: 'id'
    },
    optionLabelKey: {
      type: String,
      default: 'name'
    },
    optionDescriptionKey: {
      type: String,
      default: 'description'
    },
    optionDisabledKey: {
      type: String,
      default: 'disabled'
    },
    // Field metadata
    name: {
      type: String,
      default: 'checkbox-group'
    },
    legend: {
      type: String,
      default: ''
    },
    legendClass: {
      type: String,
      default: 'text-sm font-semibold leading-6 text-gray-900'
    },
    legendSrOnly: {
      type: Boolean,
      default: false
    },
    description: {
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
    // Styling/layout options
    variant: {
      type: String,
      default: 'default',
      validator: value => [
        'default',       // Standard list
        'dividers',      // With dividers
        'right',         // Checkbox on right
        'bordered'       // With borders
      ].includes(value)
    },
    descriptionDisplay: {
      type: String,
      default: 'block',
      validator: value => ['block', 'inline'].includes(value)
    },
    error: {
      type: String,
      default: ''
    },
    // Optional aria label
    ariaLabel: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const groupId = computed(() => `checkbox-group-${Math.random().toString(36).substring(2, 9)}`);
    
    // Indeterminate state management
    const checkboxRefs = ref([]);
    
    // Helper function to get option value
    const getOptionValue = (option) => {
      return typeof option === 'object' ? option[props.optionValueKey] : option;
    };
    
    // Helper function to get option label
    const getOptionLabel = (option) => {
      return typeof option === 'object' ? option[props.optionLabelKey] : option;
    };
    
    // Helper function to get option description
    const getOptionDescription = (option) => {
      return typeof option === 'object' ? option[props.optionDescriptionKey] : null;
    };
    
    // Helper function to check if option is disabled
    const isOptionDisabled = (option) => {
      return typeof option === 'object' ? !!option[props.optionDisabledKey] : false;
    };
    
    // Check if option is selected
    const isSelected = (option) => {
      const optionValue = getOptionValue(option);
      return props.modelValue.includes(optionValue);
    };
    
    // Handle checkbox change
    const handleChange = (option, event) => {
      const optionValue = getOptionValue(option);
      let newValue = [...props.modelValue];
      
      if (event.target.checked) {
        if (!newValue.includes(optionValue)) {
          newValue.push(optionValue);
        }
      } else {
        newValue = newValue.filter(value => value !== optionValue);
      }
      
      emit('update:modelValue', newValue);
      emit('change', { value: newValue, option, checked: event.target.checked });
    };
    
    // Set indeterminate state programmatically
    const setIndeterminateState = (option, index) => {
      if (typeof option === 'object' && option.indeterminate && checkboxRefs.value[index]) {
        checkboxRefs.value[index].indeterminate = true;
      }
    };
    
    // Group container classes
    const containerClasses = computed(() => {
      switch (props.variant) {
        case 'dividers':
          return 'space-y-5';
        case 'right':
        case 'bordered':
          return 'divide-y divide-gray-200 border-t border-b border-gray-200';
        default:
          return 'space-y-5';
      }
    });
    
    // Option container classes based on variant
    const getOptionContainerClasses = (option, index) => {
      const disabled = isOptionDisabled(option) || props.disabled;
      
      switch (props.variant) {
        case 'right':
        case 'bordered':
          return [
            'relative flex gap-3 pt-3.5 pb-4',
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          ].filter(Boolean).join(' ');
        default:
          return [
            'flex gap-3',
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          ].filter(Boolean).join(' ');
      }
    };
    
    // Checkbox container classes
    const getCheckboxContainerClasses = () => {
      return 'flex h-6 shrink-0 items-center';
    };
    
    // Label container classes based on variant and description display
    const getLabelContainerClasses = (variant, descriptionDisplay, hasCheckboxOnRight) => {
      if (hasCheckboxOnRight) {
        return 'min-w-0 flex-1 text-sm/6';
      }
      return 'text-sm/6';
    };
    
    // Legend classes
    const getLegendClasses = (isScreenReaderOnly, customClass) => {
      if (isScreenReaderOnly) {
        return 'sr-only';
      }
      return customClass || 'text-sm font-semibold leading-6 text-gray-900';
    };
    
    // Helper for making refs array match options length
    const ensureRefsArray = () => {
      if (props.options && Array.isArray(props.options)) {
        checkboxRefs.value = Array(props.options.length).fill(null);
      }
    };
    
    // Watch for options changes to update refs array
    Vue.watchEffect(() => {
      ensureRefsArray();
    });

    // Watch for option changes to apply indeterminate state
    Vue.watchEffect(() => {
      if (props.options) {
        Vue.nextTick(() => {
          props.options.forEach((option, index) => {
            setIndeterminateState(option, index);
          });
        });
      }
    });
    
    return {
      groupId,
      checkboxRefs,
      getOptionValue,
      getOptionLabel,
      getOptionDescription,
      isOptionDisabled,
      isSelected,
      handleChange,
      setIndeterminateState,
      containerClasses,
      getOptionContainerClasses,
      getCheckboxContainerClasses,
      getLabelContainerClasses,
      getLegendClasses
    };
  },
  template: `
    <fieldset :aria-label="ariaLabel">
      <legend :class="getLegendClasses(legendSrOnly, legendClass)">
        {{ legend }} <span v-if="required" class="text-red-500">*</span>
      </legend>
      <p v-if="description" class="mt-1 text-sm leading-6 text-gray-600">{{ description }}</p>
      
      <!-- Container For Options -->
      <div :class="containerClasses">
        <!-- Options -->
        <div 
          v-for="(option, index) in options" 
          :key="getOptionValue(option)"
          :class="getOptionContainerClasses(option, index)"
        >
          <!-- Checkbox on Left (default) -->
          <template v-if="variant !== 'right'">
            <div :class="getCheckboxContainerClasses()">
              <div class="group grid size-4 grid-cols-1">
                <input 
                  :id="groupId + '-' + index"
                  :ref="el => { if (el) checkboxRefs[index] = el }"
                  :name="name + '-' + getOptionValue(option)"
                  type="checkbox"
                  :checked="isSelected(option)"
                  :disabled="isOptionDisabled(option) || disabled"
                  :aria-describedby="getOptionDescription(option) ? (groupId + '-' + index + '-description') : null"
                  @change="event => handleChange(option, event)"
                  class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                />
                <svg class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25" viewBox="0 0 14 14" fill="none">
                  <path class="opacity-0 group-has-checked:opacity-100" d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path class="opacity-0 group-has-indeterminate:opacity-100" d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
            
            <div :class="getLabelContainerClasses(variant, descriptionDisplay, false)">
              <label :for="groupId + '-' + index" class="font-medium text-gray-900">
                {{ getOptionLabel(option) }}
              </label>
              
              <!-- Description (Block) -->
              <p 
                v-if="getOptionDescription(option) && descriptionDisplay === 'block'"
                :id="groupId + '-' + index + '-description'"
                class="text-gray-500"
              >
                {{ getOptionDescription(option) }}
              </p>
              
              <!-- Description (Inline) -->
              <template v-if="getOptionDescription(option) && descriptionDisplay === 'inline'">
                {{ ' ' }}
                <span 
                  :id="groupId + '-' + index + '-description'"
                  class="text-gray-500"
                >
                  <span class="sr-only">{{ getOptionLabel(option) }} </span>{{ getOptionDescription(option) }}
                </span>
              </template>
            </div>
          </template>
          
          <!-- Checkbox on Right -->
          <template v-else>
            <div :class="getLabelContainerClasses(variant, descriptionDisplay, true)">
              <label :for="groupId + '-' + index" class="font-medium text-gray-900">
                {{ getOptionLabel(option) }}
              </label>
              
              <!-- Description (Block) -->
              <p 
                v-if="getOptionDescription(option) && descriptionDisplay === 'block'"
                :id="groupId + '-' + index + '-description'"
                class="text-gray-500"
              >
                {{ getOptionDescription(option) }}
              </p>
              
              <!-- Description (Inline) -->
              <template v-if="getOptionDescription(option) && descriptionDisplay === 'inline'">
                {{ ' ' }}
                <span 
                  :id="groupId + '-' + index + '-description'"
                  class="text-gray-500"
                >
                  <span class="sr-only">{{ getOptionLabel(option) }} </span>{{ getOptionDescription(option) }}
                </span>
              </template>
            </div>
            
            <div :class="getCheckboxContainerClasses()">
              <div class="group grid size-4 grid-cols-1">
                <input 
                  :id="groupId + '-' + index"
                  :ref="el => { if (el) checkboxRefs[index] = el }"
                  :name="name + '-' + getOptionValue(option)"
                  type="checkbox"
                  :checked="isSelected(option)"
                  :disabled="isOptionDisabled(option) || disabled"
                  :aria-describedby="getOptionDescription(option) ? (groupId + '-' + index + '-description') : null"
                  @change="event => handleChange(option, event)"
                  class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                />
                <svg class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25" viewBox="0 0 14 14" fill="none">
                  <path class="opacity-0 group-has-checked:opacity-100" d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path class="opacity-0 group-has-indeterminate:opacity-100" d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
          </template>
        </div>
      </div>
      
      <!-- Error message -->
      <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
    </fieldset>
  `
};
