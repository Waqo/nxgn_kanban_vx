// app/components/common/BaseContainer.js

const { computed } = Vue;

export default {
  name: 'BaseContainer',
  props: {
    // Container type
    variant: {
      type: String,
      default: 'default',
      validator: value => ['default', 'constrained', 'breakpoint', 'constrained-breakpoint', 'narrow'].includes(value)
    },
    // Maximum width using Tailwind classes, e.g. 'max-w-7xl', 'max-w-5xl', etc.
    maxWidth: {
      type: String,
      default: '7xl'
    },
    // Inner max width (for narrow variant)
    innerMaxWidth: {
      type: String,
      default: '3xl'
    },
    // Whether to add padding on all screens (including mobile)
    paddedMobile: {
      type: Boolean,
      default: false
    },
    // Custom padding classes
    paddingX: {
      type: String,
      default: '4' // px-4 by default, responsive classes can override
    },
    paddingSm: {
      type: String,
      default: '6' // sm:px-6
    },
    paddingLg: {
      type: String,
      default: '8' // lg:px-8
    },
    // Additional classes
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const containerClasses = computed(() => {
      let classes = ['mx-auto'];
      
      // Determine container type and padding
      switch (props.variant) {
        case 'constrained':
          // Constrained with padding on all screens
          classes.push(`max-w-${props.maxWidth}`);
          classes.push(`px-${props.paddingX}`);
          classes.push(`sm:px-${props.paddingSm}`);
          classes.push(`lg:px-${props.paddingLg}`);
          break;
          
        case 'breakpoint':
          // Breakpoint-constrained container, no padding on mobile
          classes.push('container');
          classes.push(`sm:px-${props.paddingSm}`);
          classes.push(`lg:px-${props.paddingLg}`);
          break;
          
        case 'constrained-breakpoint':
          // Breakpoint-constrained with padding on all screens
          classes.push('container');
          classes.push(`px-${props.paddingX}`);
          classes.push(`sm:px-${props.paddingSm}`);
          classes.push(`lg:px-${props.paddingLg}`);
          break;
          
        case 'narrow':
          // Outer container with inner constrained width
          classes.push(`max-w-${props.maxWidth}`);
          classes.push(`px-${props.paddingX}`);
          classes.push(`sm:px-${props.paddingSm}`);
          classes.push(`lg:px-${props.paddingLg}`);
          // The inner container is handled in the template
          break;
          
        case 'default':
        default:
          // Full width on mobile, constrained above
          classes.push(`max-w-${props.maxWidth}`);
          
          if (props.paddedMobile) {
            classes.push(`px-${props.paddingX}`);
          }
          
          classes.push(`sm:px-${props.paddingSm}`);
          classes.push(`lg:px-${props.paddingLg}`);
          break;
      }
      
      // Add custom class if provided
      if (props.className) {
        classes.push(props.className);
      }
      
      return classes.join(' ');
    });
    
    return {
      containerClasses
    };
  },
  template: `
    <div :class="containerClasses">
      <!-- For narrow variant, add inner container -->
      <div v-if="variant === 'narrow'" :class="['mx-auto', 'max-w-' + innerMaxWidth]">
        <slot></slot>
      </div>
      
      <!-- For all other variants, use slot directly -->
      <slot v-else></slot>
    </div>
  `
};

