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
      default: 'primary', // 'primary', 'secondary', 'danger', 'secondary-light', 'icon-light', 'tag-add'
      validator: (value) => [
          'primary',
          'secondary',
          'danger',
          'secondary-light',
          'icon-light',
          'tag-add'
      ].includes(value),
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
      let baseClasses = 'inline-flex items-center justify-center font-semibold shadow-xs transition-colors duration-150 focus:outline-none';
      let variantClasses = '';
      let sizeClasses = '';
      let stateClasses = this.disabled ? 'opacity-50 cursor-not-allowed' : ''; // Default disabled

      // Variant styles
      switch (this.variant) {
        case 'secondary':
          variantClasses = 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300';
          if (!this.disabled) stateClasses += ' hover:bg-gray-50';
          break;
        case 'danger': 
           variantClasses = 'bg-red-600 text-white';
           if (!this.disabled) stateClasses += ' hover:bg-red-500';
           break;
        case 'secondary-light': // For buttons on dark background (e.g., modal header)
            variantClasses = 'bg-white/10 text-white ring-1 ring-inset ring-white/30';
            if (!this.disabled) stateClasses += ' hover:bg-white/20';
            break;
        case 'icon-light': // For icon-only buttons on dark background
            variantClasses = 'text-white'; // Only text color
            if (!this.disabled) stateClasses += ' hover:bg-white/10';
            break;
        case 'tag-add': // Specific style for adding tags
            variantClasses = 'text-white border border-dashed border-white/50';
            if (!this.disabled) stateClasses += ' hover:border-white/80 hover:text-white/90';
            break;
        case 'primary':
        default:
          variantClasses = 'bg-blue-500 text-white';
          if (!this.disabled) stateClasses += ' hover:bg-blue-600';
          break;
      }
      
      // Size styles - Use consistent rounding for now
      let roundedClasses = 'rounded-md'; // Default
      switch (this.size) {
        case 'xs': sizeClasses = 'px-2 py-1 text-xs'; break;
        case 'sm': sizeClasses = 'px-2 py-1 text-sm'; break;
        case 'md': sizeClasses = 'px-2.5 py-1.5 text-sm'; break; 
        case 'lg': sizeClasses = 'px-3 py-2 text-sm'; break; 
        case 'xl': sizeClasses = 'px-3.5 py-2.5 text-sm'; break;
      }

      // Apply specific rounding for icon buttons or specific variants if needed
      if (this.variant === 'icon-light') {
          roundedClasses = 'rounded-lg'; // Match previous template usage
          // Reset padding for icon-only if label is empty
          if (!this.label && !this.$slots.default) { 
              switch (this.size) {
                  case 'xs': sizeClasses = 'p-1'; break;
                  case 'sm': sizeClasses = 'p-1.5'; break;
                  case 'lg': sizeClasses = 'p-2.5'; break;
                  case 'xl': sizeClasses = 'p-3'; break;
                  case 'md': // Default
                  default: sizeClasses = 'p-2'; break;
              }
          }
      } else if (this.variant === 'tag-add') {
          roundedClasses = 'rounded-full';
          // Adjust padding for small tag add button
          if (this.size === 'xs') sizeClasses = 'px-1.5 py-0.5';
      } else if (this.variant === 'secondary-light') {
           roundedClasses = 'rounded-full'; // Match previous template usage
           if (this.size === 'sm') sizeClasses = 'px-3 py-1.5'; // Match previous template usage
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