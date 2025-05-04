// app/components/common/BaseButton.js

const { computed } = Vue;

export default {
  name: 'BaseButton',
  props: {
    tag: { 
        type: String, 
        default: 'button' 
    }, // Allow rendering as 'a' or other tags
    variant: {
      type: String,
      default: 'primary', // primary, secondary, danger, success, warning, info, light, dark, link
    },
    size: {
      type: String,
      default: 'md', // xs, sm, md, lg, xl
    },
    label: { 
        type: String, 
        default: '' 
    },
    leadingIcon: { 
        type: String, 
        default: '' 
    }, // e.g., 'fas fa-plus'
    trailingIcon: { 
        type: String, 
        default: '' 
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    // For link buttons
    href: { 
        type: String, 
        default: '#' 
    },
    // --- Remove Focus Ring Props ---
    // --- End Focus Ring Props ---
    // Allow passing attributes like type, name
    attrs: { type: Object, default: () => ({}) }
  },
  emits: ['click'], // Emit click event
  setup(props, { emit, slots }) {
    // Button classes based on variant and size
    const buttonClasses = computed(() => {
      const base = ['inline-flex', 'items-center', 'justify-center', 'border', 'border-transparent', 'font-semibold', 'focus:outline-none', 'transition-colors', 'duration-150'];
      const variantClasses = [];
      const sizeClasses = [];

      // Remove focus ring classes logic
      // if (props.showFocusRing) {
      //     base.push('focus:ring-2', 'focus:ring-offset-2', props.focusRingColorClass);
      // }

      // Variant styles (Remove specific focus:ring-* colors here)
      switch (props.variant) {
        case 'secondary':
          variantClasses.push('bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-xs ring-1 ring-inset ring-gray-300');
          break;
        case 'danger':
          variantClasses.push('bg-red-600 text-white hover:bg-red-700');
          break;
        case 'success':
          variantClasses.push('bg-green-600 text-white hover:bg-green-700');
          break;
         case 'warning':
           variantClasses.push('bg-yellow-500 text-white hover:bg-yellow-600');
           break;
         case 'info': // Already blue, default focus ring works
           variantClasses.push('bg-blue-500 text-white hover:bg-blue-600');
           break;
        case 'light':
          variantClasses.push('bg-gray-100 text-gray-700 hover:bg-gray-200');
          break;
        case 'dark':
          variantClasses.push('bg-gray-800 text-white hover:bg-gray-700');
          break;
        case 'link':
          variantClasses.push('text-blue-600 hover:text-blue-700 border-none shadow-none bg-transparent');
          break;
        case 'icon-ghost':
            variantClasses.push('bg-transparent border-transparent shadow-none hover:bg-gray-100'); // Inherit text color, subtle hover
            break;
        case 'primary':
        default:
          variantClasses.push('bg-blue-600 text-white hover:bg-blue-700 shadow-xs');
          break;
      }

      // Size styles (adjust padding and text size)
      switch (props.size) {
        case 'xs':
          sizeClasses.push('px-2.5 py-1.5 text-xs rounded');
          break;
        case 'sm':
          sizeClasses.push('px-3 py-2 text-sm leading-4 rounded-md');
          break;
        case 'lg':
          sizeClasses.push('px-4 py-2 text-base rounded-md');
          break;
        case 'xl':
          sizeClasses.push('px-6 py-3 text-base rounded-md');
          break;
        case 'md':
        default:
          sizeClasses.push('px-4 py-2 text-sm rounded-md');
          break;
      }

      // Disabled/loading styles
      const stateClasses = [];
      if (props.disabled || props.loading) {
        stateClasses.push('opacity-60 cursor-not-allowed');
      }

      return [...base, ...variantClasses, ...sizeClasses, ...stateClasses].join(' ');
    });

    // Icon size classes based on button size
    const iconSizeClasses = computed(() => {
      switch (props.size) {
        case 'xs':
        case 'sm':
          return 'h-4 w-4';
        case 'lg':
        case 'xl':
          return 'h-5 w-5';
        case 'md':
        default:
          return 'h-5 w-5';
      }
    });

    // Margin for icons based on presence of label/slot
    const leadingIconMarginClass = computed(() => {
        // Check if the default slot has actual content (not just whitespace)
        const hasSlotContent = slots.default && slots.default().some(vnode => vnode.type !== Comment && (typeof vnode.children === 'string' ? vnode.children.trim() !== '' : true));
        return (props.label || hasSlotContent) ? '-ml-1 mr-2' : '';
    });

    const trailingIconMarginClass = computed(() => {
        const hasSlotContent = slots.default && slots.default().some(vnode => vnode.type !== Comment && (typeof vnode.children === 'string' ? vnode.children.trim() !== '' : true));
        return (props.label || hasSlotContent) ? 'ml-2 -mr-1' : '';
    });
    
    // Click handler
    const handleClick = (event) => {
        if (!props.disabled && !props.loading) {
            emit('click', event);
        }
    };
    
    // Determine final tag (button or a)
    const componentTag = computed(() => {
        return props.tag === 'a' ? 'a' : 'button';
    });

    // Determine button type attribute
    const buttonType = computed(() => {
        return componentTag.value === 'button' ? (props.attrs.type || 'button') : null;
    });
    
     // Combine props.attrs with necessary bindings
    const bindings = computed(() => {
      const base = { ...props.attrs };
      if (componentTag.value === 'a') {
        base.href = props.href;
        base.role = 'button';
         // If disabled/loading for an 'a' tag, prevent click and add aria-disabled
        if (props.disabled || props.loading) {
            base['aria-disabled'] = 'true';
            base.tabindex = '-1';
             // Prevent click event default behavior for disabled links
            // Note: This might not work perfectly in all browsers for <a> tags
             base.onclick = (e) => e.preventDefault(); 
        } 
      } else {
        base.type = buttonType.value;
        base.disabled = props.disabled || props.loading;
      }
      return base;
    });

    return {
        buttonClasses,
        iconSizeClasses,
        leadingIconMarginClass,
        trailingIconMarginClass,
        handleClick,
        componentTag,
        bindings
    };
  },
  template: `
    <component 
        :is="componentTag" 
        :class="buttonClasses" 
        @click="handleClick" 
        v-bind="bindings"
    >
      <!-- Loading Spinner -->
      <svg v-if="loading" class="animate-spin h-5 w-5" :class="(label || $slots.default) ? 'mr-2' : ''" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      
      <!-- Leading Icon -->
      <i v-if="leadingIcon && !loading" 
         :class="[leadingIcon, iconSizeClasses, leadingIconMarginClass]" 
         aria-hidden="true">
      </i>
      
      <!-- Label/Slot Content -->
      <slot>
         <span v-if="label && !loading">{{ label }}</span>
         <!-- Keep slot empty if loading and no label, spinner handles visual feedback -->
      </slot>
      
      <!-- Trailing Icon -->
      <i v-if="trailingIcon && !loading" 
         :class="[trailingIcon, iconSizeClasses, trailingIconMarginClass]" 
         aria-hidden="true">
      </i>
    </component>
  `
}; 