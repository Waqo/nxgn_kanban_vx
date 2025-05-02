// app/components/common/BaseButtonGroup.js

const { computed, ref } = Vue;

export default {
  name: 'BaseButtonGroup',
  props: {
    // Data & Model
    options: {
      type: Array,
      default: () => [],
      // Expects array of objects with value, label and optionally icon, iconPosition, stat, disabled properties
    },
    modelValue: {
      // Can be single value or array for multiple
      type: [String, Number, Array, null],
      default: null,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    // Option Keys (for object arrays)
    optionValueKey: { type: String, default: 'value' },
    optionLabelKey: { type: String, default: 'label' },
    optionIconKey: { type: String, default: 'icon' },
    optionIconPositionKey: { type: String, default: 'iconPosition' }, // 'left', 'right'
    optionStatKey: { type: String, default: 'stat' },
    optionDisabledKey: { type: String, default: 'disabled' },
    // Style Configuration
    buttonSize: { type: String, default: 'md' }, // xs, sm, md, lg, xl
    baseVariant: { type: String, default: 'secondary' }, // For non-selected state
    activeVariant: { type: String, default: 'primary' }, // For selected state
    iconOnly: { type: Boolean, default: false }, // For icon-only groups
    // Container Props
    tag: { type: String, default: 'span' },
    rounded: { type: String, default: 'md' },
    shadow: { type: String, default: 'xs' },
    isolated: { type: Boolean, default: true },
    // Dropdown (for the last button with dropdown)
    withDropdown: { type: Boolean, default: false },
    dropdownItems: { 
      type: Array, 
      default: () => [],
      // Format: [{ text, href, onClick }]
    },
    dropdownPlacement: { type: String, default: 'right' }
  },
  emits: ['update:modelValue', 'dropdown-select'],
  setup(props, { emit, slots }) {
    // Dropdown state
    const isDropdownOpen = ref(false);
    const dropdownRef = ref(null);
    
    // Helper to check if an option is selected
    const isSelected = computed(() => (optionValue) => {
      if (props.multiple) {
        return Array.isArray(props.modelValue) && props.modelValue.includes(optionValue);
      } else {
        return props.modelValue === optionValue;
      }
    });
    
    // Compute dynamic classes for the container
    const groupClasses = computed(() => {
      const classes = ['inline-flex'];
      if (props.isolated) classes.push('isolate');
      if (props.rounded && props.rounded !== 'none') classes.push(`rounded-${props.rounded}`);
      if (props.shadow && props.shadow !== 'none') classes.push(`shadow-${props.shadow}`);
      return classes.join(' ');
    });
    
    // Handle clicks on individual buttons
    const handleClick = (optionValue, isDisabled) => {
      if (isDisabled) return;
      
      let newValue;
      if (props.multiple) {
        const currentSelection = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
        const index = currentSelection.indexOf(optionValue);
        if (index > -1) {
          currentSelection.splice(index, 1); // Remove if exists
        } else {
          currentSelection.push(optionValue); // Add if not exists
        }
        newValue = currentSelection;
      } else {
        // Single selection: toggle off if clicking the same, otherwise set new
        newValue = props.modelValue === optionValue ? null : optionValue;
      }
      emit('update:modelValue', newValue);
    };
    
    // Helpers to get values from options
    const getOptionValue = (option) => {
      return typeof option === 'object' ? option[props.optionValueKey] : option;
    };
    
    const getOptionLabel = (option) => {
      return typeof option === 'object' ? option[props.optionLabelKey] : option;
    };
    
    const getOptionIcon = (option) => {
      return typeof option === 'object' ? option[props.optionIconKey] : null;
    };
    
    const getOptionIconPosition = (option) => {
      return typeof option === 'object' ? (option[props.optionIconPositionKey] || 'left') : 'left';
    };
    
    const getOptionStat = (option) => {
      return typeof option === 'object' ? option[props.optionStatKey] : null;
    };
    
    const getOptionDisabled = (option) => {
      return typeof option === 'object' ? !!option[props.optionDisabledKey] : false;
    };
    
    // Get button variant based on selection state
    const getButtonVariant = (optionValue) => {
      return isSelected.value(optionValue) ? props.activeVariant : props.baseVariant;
    };
    
    // Dynamic button size classes
    const buttonSizeClasses = computed(() => {
      if (props.iconOnly) {
        // Size classes for icon-only buttons
        switch(props.buttonSize) {
          case 'xs': return 'p-1 text-xs';
          case 'sm': return 'p-1.5 text-sm';
          case 'lg': return 'p-2.5 text-base';
          case 'xl': return 'p-3 text-lg';
          default: return 'p-2 text-sm'; // md default
        }
      } else {
        // Size classes for text buttons
        switch(props.buttonSize) {
          case 'xs': return 'px-2 py-1 text-xs';
          case 'sm': return 'px-2 py-1.5 text-sm';
          case 'lg': return 'px-3.5 py-2.5 text-sm';
          case 'xl': return 'px-4 py-3 text-base';
          default: return 'px-3 py-2 text-sm'; // md default
        }
      }
    });
    
    // Compute dynamic classes for each button, including positional styling
    const getButtonClasses = (option, index) => {
      const optionValue = getOptionValue(option);
      const variant = getButtonVariant(optionValue);
      const isDisabled = getOptionDisabled(option);
      const showFocusRing = true; // Button groups generally should show focus rings
      const focusRingColorClass = 'focus:ring-blue-500'; // Enforce blue focus ring
      
      const classes = [
        'relative', // Base for z-index
        'inline-flex items-center justify-center font-semibold', // Basic layout
        'focus:z-10 focus:outline-none', // Base focus styles
        buttonSizeClasses.value,
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer' // Disabled state
      ];
      
      // Add focus ring classes conditionally
      if (showFocusRing) {
        classes.push('focus:ring-2 focus:ring-offset-1', focusRingColorClass);
      }
      
      // Add negative margin for overlap (except first)
      if (index > 0) {
        classes.push('-ml-px');
      }
      
      // Add rounding based on position
      if (props.options.length === 1) {
        classes.push('rounded-md'); // Full rounding if only one button
      } else if (index === 0) {
        classes.push('rounded-l-md'); // Left rounding for first
      } else if (index === props.options.length - 1 && !props.withDropdown) {
        classes.push('rounded-r-md'); // Right rounding for last (unless has dropdown)
      } else if (index === props.options.length - 1 && props.withDropdown) {
        // No special rounding for the last button if it's part of dropdown group
      }
      
      // Apply variant classes
      if (variant === 'primary') {
        classes.push('bg-blue-500 text-white border border-blue-500 hover:bg-blue-600'); // Removed focus:ring
      } else { // Assuming secondary as default, also removed focus:ring
        classes.push('bg-white text-gray-700 border border-gray-300 hover:bg-gray-50');
      }
      
      return classes.join(' ');
    };
    
    // Dropdown handling
    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value;
    };
    
    const handleDropdownSelect = (item, index) => {
      emit('dropdown-select', item, index);
      isDropdownOpen.value = false;
    };
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        isDropdownOpen.value = false;
      }
    };
    
    // Lifecycle hooks for dropdown
    Vue.onMounted(() => {
      if (props.withDropdown) {
        document.addEventListener('click', handleClickOutside);
      }
    });
    
    Vue.onBeforeUnmount(() => {
      if (props.withDropdown) {
        document.removeEventListener('click', handleClickOutside);
      }
    });
    
    return {
      isSelected,
      groupClasses,
      handleClick,
      getOptionValue,
      getOptionLabel,
      getOptionIcon,
      getOptionIconPosition,
      getOptionStat,
      getOptionDisabled,
      getButtonClasses,
      isDropdownOpen,
      dropdownRef,
      toggleDropdown,
      handleDropdownSelect
    };
  },
  template: `
    <component :is="tag" :class="groupClasses">
      <!-- Regular buttons -->
      <button 
        v-for="(option, index) in options" 
        :key="getOptionValue(option)" 
        type="button"
        :class="getButtonClasses(option, index)"
        @click="handleClick(getOptionValue(option), getOptionDisabled(option))"
        :disabled="getOptionDisabled(option)"
      >
        <!-- Icon on left -->
        <i v-if="getOptionIcon(option) && getOptionIconPosition(option) === 'left'" 
           :class="['fas', getOptionIcon(option), iconOnly ? '' : '-ml-0.5 mr-1.5']"
           aria-hidden="true"></i>
           
        <!-- Screen reader text for icon-only buttons -->
        <span v-if="iconOnly" class="sr-only">{{ getOptionLabel(option) }}</span>
        
        <!-- Button text (hidden for icon-only buttons) -->
        <span v-else>{{ getOptionLabel(option) }}</span>
        
        <!-- Icon on right -->
        <i v-if="getOptionIcon(option) && getOptionIconPosition(option) === 'right'" 
           :class="['fas', getOptionIcon(option), iconOnly ? '' : 'ml-1.5 -mr-0.5']"
           aria-hidden="true"></i>
           
        <!-- Stat/counter -->
        <span v-if="getOptionStat(option)">{{ getOptionStat(option) }}</span>
      </button>
      
      <!-- Optional Dropdown Button -->
      <div v-if="withDropdown" ref="dropdownRef" class="relative -ml-px">
        <button 
          type="button"
          class="relative inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
          @click="toggleDropdown"
        >
          <span class="sr-only">Open options</span>
          <i class="fas fa-chevron-down h-5 w-5" aria-hidden="true"></i>
        </button>
        
        <!-- Dropdown Menu -->
        <transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <div v-if="isDropdownOpen" 
              class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div class="py-1">
              <a v-for="(item, itemIdx) in dropdownItems" 
                 :key="itemIdx"
                 :href="item.href || '#'"
                 :class="['block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900']"
                 @click.prevent="handleDropdownSelect(item, itemIdx)"
              >
                {{ item.text }}
              </a>
            </div>
          </div>
        </transition>
      </div>
      
      <!-- Slot for custom implementation -->
      <slot></slot>
    </component>
  `
};

