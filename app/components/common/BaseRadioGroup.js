const { computed, ref } = Vue;

export default {
  name: 'BaseRadioGroup',
  props: {
    // Data binding
    modelValue: {
      type: [String, Number, Object, Boolean, null],
      default: null
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
      default: 'radio-group'
    },
    legend: {
      type: String,
      default: ''
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
      default: 'simple',
      validator: value => [
        'simple',         // Basic list
        'panel',          // List with border around entire group
        'cards',          // Individual cards for each option
        'small-cards',    // Compact cards
        'stacked-cards',  // Larger cards with more info
        'table',          // Table-like layout
        'dividers',       // List with dividers between options
        'color-picker'    // Special color picker variant
      ].includes(value)
    },
    layout: {
      type: String,
      default: 'vertical',
      validator: value => ['vertical', 'horizontal'].includes(value)
    },
    labelPosition: {
      type: String,
      default: 'right',
      validator: value => ['right', 'left'].includes(value)
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
    // For color picker variant
    colorKey: {
      type: String,
      default: 'color'
    },
    // Optional aria label
    ariaLabel: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const groupId = computed(() => `radio-group-${Math.random().toString(36).substring(2, 9)}`);
    
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
    
    // Helper to get option color (for color picker variant)
    const getOptionColor = (option) => {
      return typeof option === 'object' ? option[props.colorKey] : null;
    };

    // Check if option is selected
    const isSelected = (option) => {
      const optionValue = getOptionValue(option);
      
      if (props.modelValue === null) return false;
      
      if (typeof props.modelValue === 'object' && props.modelValue !== null) {
        return props.modelValue[props.optionValueKey] === optionValue;
      }
      
      return props.modelValue === optionValue;
    };
    
    // Handle option selection
    const selectOption = (option) => {
      if (isOptionDisabled(option) || props.disabled) return;
      emit('update:modelValue', typeof option === 'object' ? option : getOptionValue(option));
    };
    
    // Group container classes
    const containerClasses = computed(() => {
      switch (props.variant) {
        case 'panel':
          return 'relative -space-y-px rounded-md bg-white';
        case 'cards':
          return 'mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-4';
        case 'small-cards':
          return 'mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6';
        case 'stacked-cards':
          return 'space-y-4';
        case 'table':
          return 'relative -space-y-px rounded-md bg-white';
        case 'dividers':
          return 'mt-2 divide-y divide-gray-200 border-t border-b border-gray-200';
        case 'color-picker':
          return 'mt-6 flex items-center gap-x-3';
        default:
          if (props.layout === 'horizontal') {
            return 'mt-6 sm:flex sm:items-center sm:space-y-0 sm:space-x-10';
          }
          return 'mt-6 space-y-6';
      }
    });
    
    // Option container classes based on variant
    const getOptionClasses = (option, index, isActive, isChecked) => {
      const checked = isChecked || isSelected(option);
      const active = isActive || false;
      const disabled = isOptionDisabled(option) || props.disabled;
      
      switch (props.variant) {
        case 'panel':
          return [
            'group flex cursor-pointer border border-gray-200 p-4',
            'focus:outline-hidden',
            index === 0 ? 'rounded-tl-md rounded-tr-md' : '',
            index === props.options.length - 1 ? 'rounded-br-md rounded-bl-md' : '',
            checked ? 'relative border-indigo-200 bg-indigo-50' : '',
            disabled ? 'cursor-not-allowed opacity-60' : ''
          ].filter(Boolean).join(' ');
          
        case 'cards':
          return [
            'relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-xs',
            active ? 'border-indigo-600 ring-2 ring-indigo-600' : 'border-gray-300',
            disabled ? 'cursor-not-allowed opacity-60' : 'focus:outline-hidden'
          ].filter(Boolean).join(' ');
          
        case 'small-cards':
          return [
            disabled ? 'cursor-not-allowed opacity-25' : 'cursor-pointer focus:outline-hidden',
            active ? 'ring-2 ring-indigo-600 ring-offset-2' : '',
            checked ? 'bg-indigo-600 text-white ring-0 hover:bg-indigo-500' : 'bg-white text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50',
            !active && !checked ? 'ring-inset' : '',
            active && checked ? 'ring-2' : '',
            'flex items-center justify-center rounded-md px-3 py-3 text-sm font-semibold uppercase sm:flex-1'
          ].filter(Boolean).join(' ');
          
        case 'stacked-cards':
          return [
            'relative block cursor-pointer rounded-lg border bg-white px-6 py-4 shadow-xs sm:flex sm:justify-between',
            active ? 'border-indigo-600 ring-2 ring-indigo-600' : 'border-gray-300',
            disabled ? 'cursor-not-allowed opacity-60' : 'focus:outline-hidden'
          ].filter(Boolean).join(' ');
          
        case 'table':
          return [
            'group flex cursor-pointer flex-col border border-gray-200 p-4 md:grid md:grid-cols-3 md:pr-6 md:pl-4',
            'focus:outline-hidden',
            index === 0 ? 'rounded-tl-md rounded-tr-md' : '',
            index === props.options.length - 1 ? 'rounded-br-md rounded-bl-md' : '',
            checked ? 'relative border-indigo-200 bg-indigo-50' : '',
            disabled ? 'cursor-not-allowed opacity-60' : ''
          ].filter(Boolean).join(' ');
          
        case 'dividers':
          return [
            'relative flex items-start py-4',
            disabled ? 'cursor-not-allowed opacity-60' : ''
          ].filter(Boolean).join(' ');
          
        case 'color-picker':
          return [
            getOptionColor(option),
            active && checked ? 'ring-3 ring-offset-1' : '',
            !active && checked ? 'ring-2' : '',
            'relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 ring-current focus:outline-hidden',
            disabled ? 'cursor-not-allowed opacity-60' : ''
          ].filter(Boolean).join(' ');
          
        default: // simple
          return [
            props.labelPosition === 'right' ? 'flex items-center' : 'relative flex items-start',
            disabled ? 'cursor-not-allowed opacity-60' : ''
          ].filter(Boolean).join(' ');
      }
    };
    
    // Styles for the "checked" state indicator (used in cards, panels)
    const getSelectionIndicatorClasses = (option, isActive, isChecked) => {
      const checked = isChecked || isSelected(option);
      const active = isActive || false;
      
      if (['cards', 'stacked-cards'].includes(props.variant)) {
        return [
          active ? 'border' : 'border-2',
          checked ? 'border-indigo-600' : 'border-transparent',
          'pointer-events-none absolute -inset-px rounded-lg'
        ].filter(Boolean).join(' ');
      }
      
      return '';
    };
    
    // Radio input classes
    const getRadioClasses = (isDisabled) => {
      return [
        'relative size-4 appearance-none rounded-full border border-gray-300 bg-white',
        'before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden',
        'checked:border-indigo-600 checked:bg-indigo-600',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
        isDisabled ? 'disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400' : '',
        'forced-colors:appearance-auto forced-colors:before:hidden'
      ].filter(Boolean).join(' ');
    };
    
    return {
      groupId,
      getOptionValue,
      getOptionLabel,
      getOptionDescription,
      isOptionDisabled,
      getOptionColor,
      isSelected,
      selectOption,
      containerClasses,
      getOptionClasses,
      getSelectionIndicatorClasses,
      getRadioClasses
    };
  },
  template: `
    <fieldset :aria-label="ariaLabel">
      <legend v-if="legend" class="text-sm font-semibold leading-6 text-gray-900">
        {{ legend }} <span v-if="required" class="text-red-500">*</span>
      </legend>
      <p v-if="description" class="mt-1 text-sm leading-6 text-gray-600">{{ description }}</p>
      
      <!-- Container For Options -->
      <div :class="containerClasses">
        <!-- Simple, Panel, Dividers Variants -->
        <template v-if="['simple', 'panel', 'dividers'].includes(variant)">
          <div 
            v-for="(option, index) in options" 
            :key="getOptionValue(option)"
            :class="getOptionClasses(option, index)"
            @click="selectOption(option)"
          >
            <!-- Label on Left, Radio on Right -->
            <template v-if="labelPosition === 'left'">
              <div class="min-w-0 flex-1 text-sm">
                <label :for="groupId + '-' + index" class="font-medium text-gray-900 select-none">
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
                    {{ getOptionDescription(option) }}
                  </span>
                </template>
              </div>
              
              <!-- Radio Input on Right -->
              <div class="ml-3 flex h-6 items-center">
                <input 
                  :id="groupId + '-' + index"
                  :name="name"
                  type="radio"
                  :value="getOptionValue(option)"
                  :checked="isSelected(option)"
                  :disabled="isOptionDisabled(option) || disabled"
                  :aria-describedby="getOptionDescription(option) ? groupId + '-' + index + '-description' : null"
                  :class="getRadioClasses(isOptionDisabled(option) || disabled)"
                  @change="selectOption(option)"
                />
              </div>
            </template>
            
            <!-- Radio on Left, Label on Right (Default) -->
            <template v-else>
              <div class="flex h-6 items-center">
                <input 
                  :id="groupId + '-' + index"
                  :name="name"
                  type="radio"
                  :value="getOptionValue(option)"
                  :checked="isSelected(option)"
                  :disabled="isOptionDisabled(option) || disabled"
                  :aria-describedby="getOptionDescription(option) ? groupId + '-' + index + '-description' : null"
                  :class="getRadioClasses(isOptionDisabled(option) || disabled)"
                  @change="selectOption(option)"
                />
              </div>
              
              <div class="ml-3 text-sm">
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
                    {{ getOptionDescription(option) }}
                  </span>
                </template>
              </div>
            </template>
          </div>
        </template>
        
        <!-- Table Variant -->
        <template v-else-if="variant === 'table'">
          <label 
            v-for="(option, index) in options" 
            :key="getOptionValue(option)"
            :class="getOptionClasses(option, index)"
            :aria-label="getOptionLabel(option)"
            :aria-description="getOptionDescription(option)"
          >
            <span class="flex items-center gap-3 text-sm">
              <input 
                :name="name"
                :value="getOptionValue(option)"
                type="radio"
                :checked="isSelected(option)"
                :disabled="isOptionDisabled(option) || disabled"
                :class="getRadioClasses(isOptionDisabled(option) || disabled)"
                @change="selectOption(option)"
              />
              <span class="font-medium text-gray-900 group-has-checked:text-indigo-900">
                {{ getOptionLabel(option) }}
              </span>
            </span>
            
            <!-- Flexible slot for additional table columns -->
            <slot name="tableColumns" :option="option" :checked="isSelected(option)">
              <!-- Default implementation for pricing info -->
              <template v-if="option.priceMonthly && option.priceYearly">
                <span class="ml-6 pl-1 text-sm md:ml-0 md:pl-0 md:text-center">
                  <span class="font-medium text-gray-900 group-has-checked:text-indigo-900">{{ option.priceMonthly }} / mo</span>
                  {{ ' ' }}
                  <span class="text-gray-500 group-has-checked:text-indigo-700">({{ option.priceYearly }} / yr)</span>
                </span>
                <span class="ml-6 pl-1 text-sm text-gray-500 group-has-checked:text-indigo-700 md:ml-0 md:pl-0 md:text-right">
                  {{ option.limit || getOptionDescription(option) }}
                </span>
              </template>
            </slot>
          </label>
        </template>
        
        <!-- Cards Variant -->
        <template v-else-if="variant === 'cards'">
          <div 
            v-for="(option, index) in options" 
            :key="getOptionValue(option)"
            :class="getOptionClasses(option, index, false, isSelected(option))"
            @click="selectOption(option)"
          >
            <span class="flex flex-1">
              <span class="flex flex-col">
                <span class="block text-sm font-medium text-gray-900">{{ getOptionLabel(option) }}</span>
                <span class="mt-1 flex items-center text-sm text-gray-500">{{ getOptionDescription(option) }}</span>
                <slot name="cardFooter" :option="option">
                  <span v-if="option.users || option.usage" class="mt-6 text-sm font-medium text-gray-900">
                    {{ option.users || option.usage }}
                  </span>
                </slot>
              </span>
            </span>
            
            <!-- Selection indicator icon -->
            <i 
              v-if="isSelected(option)" 
              class="fas fa-check-circle h-5 w-5 text-indigo-600" 
              aria-hidden="true"
            ></i>
            
            <!-- Selection border indicator -->
            <span 
              :class="getSelectionIndicatorClasses(option, false, isSelected(option))" 
              aria-hidden="true"
            ></span>
            
            <!-- Hidden radio for accessibility -->
            <input 
              :id="groupId + '-' + index"
              :name="name"
              type="radio"
              :value="getOptionValue(option)"
              :checked="isSelected(option)"
              :disabled="isOptionDisabled(option) || disabled"
              class="sr-only"
              @change="selectOption(option)"
            />
          </div>
        </template>
        
        <!-- Small Cards Variant -->
        <template v-else-if="variant === 'small-cards'">
          <div 
            v-for="(option, index) in options" 
            :key="getOptionValue(option)"
            :class="getOptionClasses(option, index, false, isSelected(option))"
            @click="selectOption(option)"
          >
            {{ getOptionLabel(option) }}
            
            <!-- Hidden radio for accessibility -->
            <input 
              :id="groupId + '-' + index"
              :name="name"
              type="radio"
              :value="getOptionValue(option)"
              :checked="isSelected(option)"
              :disabled="isOptionDisabled(option) || disabled"
              class="sr-only"
              @change="selectOption(option)"
            />
          </div>
        </template>
        
        <!-- Stacked Cards Variant -->
        <template v-else-if="variant === 'stacked-cards'">
          <div 
            v-for="(option, index) in options" 
            :key="getOptionValue(option)"
            :class="getOptionClasses(option, index, false, isSelected(option))"
            @click="selectOption(option)"
            :aria-label="getOptionLabel(option)"
            :aria-description="getOptionDescription(option)"
          >
            <span class="flex items-center">
              <span class="flex flex-col text-sm">
                <span class="font-medium text-gray-900">{{ getOptionLabel(option) }}</span>
                <span class="text-gray-500">
                  <slot name="stackedCardDescription" :option="option">
                    <span class="block sm:inline">{{ option.ram || 'Feature 1' }} / {{ option.cpus || 'Feature 2' }}</span>
                    {{ ' ' }}
                    <span class="hidden sm:mx-1 sm:inline" aria-hidden="true">&middot;</span>
                    {{ ' ' }}
                    <span class="block sm:inline">{{ option.disk || getOptionDescription(option) }}</span>
                  </slot>
                </span>
              </span>
            </span>
            
            <span class="mt-2 flex text-sm sm:mt-0 sm:ml-4 sm:flex-col sm:text-right">
              <slot name="stackedCardPrice" :option="option">
                <span class="font-medium text-gray-900">{{ option.price || '$40' }}</span>
                <span class="ml-1 text-gray-500 sm:ml-0">/mo</span>
              </slot>
            </span>
            
            <!-- Selection border indicator -->
            <span 
              :class="getSelectionIndicatorClasses(option, false, isSelected(option))" 
              aria-hidden="true"
            ></span>
            
            <!-- Hidden radio for accessibility -->
            <input 
              :id="groupId + '-' + index"
              :name="name"
              type="radio"
              :value="getOptionValue(option)"
              :checked="isSelected(option)"
              :disabled="isOptionDisabled(option) || disabled"
              class="sr-only"
              @change="selectOption(option)"
            />
          </div>
        </template>
        
        <!-- Color Picker Variant -->
        <template v-else-if="variant === 'color-picker'">
          <div 
            v-for="(option, index) in options" 
            :key="getOptionValue(option)"
            :class="getOptionClasses(option, index, false, isSelected(option))"
            @click="selectOption(option)"
            :aria-label="getOptionLabel(option)"
          >
            <span aria-hidden="true" class="size-8 rounded-full border border-black/10 bg-current" />
            
            <!-- Hidden radio for accessibility -->
            <input 
              :id="groupId + '-' + index"
              :name="name"
              type="radio"
              :value="getOptionValue(option)"
              :checked="isSelected(option)"
              :disabled="isOptionDisabled(option) || disabled"
              class="sr-only"
              @change="selectOption(option)"
            />
          </div>
        </template>
      </div>
      
      <!-- Error message -->
      <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
    </fieldset>
  `
};
