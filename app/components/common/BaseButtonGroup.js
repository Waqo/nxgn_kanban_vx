// app/components/common/BaseButtonGroup.js

export default {
  name: 'BaseButtonGroup',
  props: {
    // Data & Model
    options: {
      type: Array,
      default: () => [],
      // Expects array of objects or primitives
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
    // Styling Configuration
    buttonSize: { type: String, default: 'md' }, // xs, sm, md, lg, xl
    baseVariant: { type: String, default: 'secondary' }, // Default for non-selected
    activeVariant: { type: String, default: 'primary' }, // For selected
    // Container Props (Kept from original)
    tag: { type: String, default: 'div' },
    rounded: { type: String, default: 'md' },
    shadow: { type: String, default: 'xs' },
    isolated: { type: Boolean, default: true },
  },
  emits: ['update:modelValue'],
  computed: {
    groupClasses() {
      const classes = ['inline-flex'];
      if (this.isolated) classes.push('isolate');
      if (this.rounded && this.rounded !== 'none') classes.push(`rounded-${this.rounded}`);
      if (this.shadow && this.shadow !== 'none') classes.push(`shadow-${this.shadow}`);
      return classes.join(' ');
    },
    // Helper to check if an option is currently selected
    isSelected() {
        return (optionValue) => {
            if (this.multiple) {
                return Array.isArray(this.modelValue) && this.modelValue.includes(optionValue);
            } else {
                return this.modelValue === optionValue;
            }
        };
    }
  },
  methods: {
    // Handle clicks on individual buttons within the group
    handleClick(optionValue) {
      let newValue;
      if (this.multiple) {
        const currentSelection = Array.isArray(this.modelValue) ? [...this.modelValue] : [];
        const index = currentSelection.indexOf(optionValue);
        if (index > -1) {
          currentSelection.splice(index, 1); // Remove if exists
        } else {
          currentSelection.push(optionValue); // Add if not exists
        }
        newValue = currentSelection;
      } else {
        // Single selection: toggle off if clicking the same, otherwise set new
        newValue = this.modelValue === optionValue ? null : optionValue;
      }
      this.$emit('update:modelValue', newValue);
    },
    // Helpers to get value/label, handling object or primitive options
    getOptionValue(option) {
      return typeof option === 'object' ? option[this.optionValueKey] : option;
    },
    getOptionLabel(option) {
      return typeof option === 'object' ? option[this.optionLabelKey] : option;
    },
    // Get variant based on selection state
    getButtonVariant(optionValue) {
        return this.isSelected(optionValue) ? this.activeVariant : this.baseVariant;
    },
    // Compute dynamic classes for each button, including positional styling
    getButtonClasses(index) {
        const option = this.options[index];
        const optionValue = this.getOptionValue(option);
        const variant = this.getButtonVariant(optionValue);
      
        
        const classes = [
             'relative', // Base for z-index
             'inline-flex items-center justify-center font-semibold', // Basic layout
             'focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-1', // Focus styles
             // Size classes (simplified example, could be more detailed)
             this.buttonSize === 'sm' ? 'px-2 py-1 text-xs' : 
             this.buttonSize === 'xs' ? 'px-1.5 py-0.5 text-xs' : 
             'px-3 py-1.5 text-sm', // Default to md
        ];

        // Add negative margin for overlap (except first)
        if (index > 0) {
            classes.push('-ml-px');
        }

        // Add rounding based on position
        if (this.options.length === 1) {
            classes.push('rounded-md'); // Full rounding if only one button
        } else if (index === 0) {
            classes.push('rounded-l-md'); // Left rounding for first
        } else if (index === this.options.length - 1) {
            classes.push('rounded-r-md'); // Right rounding for last
        }
        
        // Apply variant classes
        if (variant === 'primary') {
            classes.push('bg-blue-500 text-white border border-blue-500 hover:bg-blue-600 focus:ring-blue-500');
        } else { // Assuming secondary as default
             classes.push('bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500');
        }
        
        
        return classes.join(' ');
    }
  },
  template: `
    <component :is="tag" :class="groupClasses">
      <button 
          v-for="(option, index) in options" 
          :key="getOptionValue(option)" 
          type="button"
          :class="getButtonClasses(index)"
          @click="handleClick(getOptionValue(option))"
      >
          {{ getOptionLabel(option) }}
      </button>
    </component>
  `
};

