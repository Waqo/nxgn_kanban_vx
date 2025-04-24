// app/components/common/BaseButton.js

export default {
  name: 'BaseButton',
  props: {
    label: {
      type: String,
      // Make label optional if we want to support icon-only buttons via slots later
      // required: true, 
      default: ''
    },
    variant: {
      type: String,
      default: 'primary', // 'primary', 'secondary'
      validator: (value) => ['primary', 'secondary', 'danger'].includes(value), // Added danger back
    },
    size: {
      type: String,
      default: 'md', // 'xs', 'sm', 'md', 'lg', 'xl'
      validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: 'button', // 'button', 'submit', 'reset'
      validator: (value) => ['button', 'submit', 'reset'].includes(value),
    },
    // Add other props as needed, e.g., for icons
  },
  emits: ['click'], // Declare the emitted event
  computed: {
    buttonClasses() {
      let baseClasses = 'inline-flex items-center justify-center font-semibold shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors duration-150';
      let variantClasses = '';
      let sizeClasses = '';
      let stateClasses = this.disabled ? 'opacity-50 cursor-not-allowed' : ''; // Default disabled

      // Variant styles
      switch (this.variant) {
        case 'secondary':
          variantClasses = 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300';
          stateClasses = this.disabled ? stateClasses + ' bg-gray-50' : stateClasses + ' hover:bg-gray-50';
          break;
        case 'danger': 
           variantClasses = 'bg-red-600 text-white focus-visible:outline-red-600';
           stateClasses = this.disabled ? stateClasses : stateClasses + ' hover:bg-red-500';
           break;
        case 'primary':
        default:
          variantClasses = 'bg-blue-500 text-white focus-visible:outline-blue-500';
          stateClasses = this.disabled ? stateClasses : stateClasses + ' hover:bg-indigo-500';
          break;
      }
      
      // Size styles - Use consistent rounding for now
      let roundedClasses = 'rounded-md'; 
      switch (this.size) {
        case 'xs': sizeClasses = 'px-2 py-1 text-xs'; roundedClasses = 'rounded'; break; // Use rounded for smaller sizes? 
        case 'sm': sizeClasses = 'px-2 py-1 text-sm'; roundedClasses = 'rounded'; break; 
        case 'md': sizeClasses = 'px-2.5 py-1.5 text-sm'; break; 
        case 'lg': sizeClasses = 'px-3 py-2 text-sm'; break; 
        case 'xl': sizeClasses = 'px-3.5 py-2.5 text-sm'; break;
      }

      return `${baseClasses} ${variantClasses} ${sizeClasses} ${roundedClasses} ${stateClasses}`;
    },
  },
  methods: {
    handleClick(event) {
      if (!this.disabled) {
        this.$emit('click', event); // Emit click event if not disabled
      }
    },
  },
  template: `
    <button 
      :type="type" 
      :class="buttonClasses" 
      :disabled="disabled"
      @click="handleClick"
      v-bind="$attrs" 
    >
      <!-- Slot for potential icons or complex content -->
      <slot>
          <!-- Default content is the label -->
          {{ label }}
      </slot>
    </button>
  `,
}; 