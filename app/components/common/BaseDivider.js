const { computed } = Vue;

export default {
  name: 'BaseDivider',
  props: {
    /**
     * Text label or title to display on the divider line.
     * Ignored if the #default slot is used or if `icon` is provided.
     */
    label: {
      type: String,
      default: ''
    },
    /**
     * Font Awesome icon class (e.g., 'fas fa-plus') to display on the divider line.
     * Takes precedence over `label`. Ignored if the #default slot is used.
     */
    icon: {
      type: String,
      default: ''
    },
    /**
     * Position of the label, icon, or slotted content.
     */
    contentPosition: {
      type: String,
      default: 'center',
      validator: (value) => ['center', 'left'].includes(value)
    },
    /**
     * Style of the label text.
     * - 'label': Standard small text.
     * - 'title': Larger, semi-bold text.
     */
    labelType: {
      type: String,
      default: 'label',
      validator: (value) => ['label', 'title'].includes(value)
    },
    /**
     * Tailwind border color class for the line (e.g., 'border-gray-300').
     */
    lineColor: {
      type: String,
      default: 'border-gray-300'
    },
    /**
     * Tailwind border style class for the line (e.g., 'border-solid', 'border-dashed').
     */
    lineStyle: {
      type: String,
      default: 'border-solid'
    },
    /**
     * Tailwind background color class for the content span (to mask the line).
     * Should match the background the divider is placed on.
     */
    bgColor: {
      type: String,
      default: 'bg-white'
    },
    /**
     * Custom CSS classes for the root container element.
     */
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {

    const hasContent = computed(() => {
        return !!slots.default || props.label || props.icon;
    });

    const rootClasses = computed(() => {
      return ['relative', props.className].filter(Boolean).join(' ');
    });

    const lineClasses = computed(() => {
      return ['w-full border-t', props.lineColor, props.lineStyle].join(' ');
    });

    const contentContainerClasses = computed(() => {
      return [
        'relative flex',
        props.contentPosition === 'left' ? 'justify-start' : 'justify-center'
      ].join(' ');
    });

    const contentSpanClasses = computed(() => {
      const classes = [props.bgColor];
      // Add padding based on content type for visual spacing
      if (slots.default) {
          // Minimal padding if slot content (like buttons) likely has its own
          classes.push('px-1'); 
      } else if (props.icon) {
          classes.push('px-2');
      } else if (props.labelType === 'title') {
          classes.push('px-3');
      } else { // label
          classes.push('px-2');
      }
      
      // Add text styling if label/title prop is used
      if (!slots.default && !props.icon && props.label) {
          if (props.labelType === 'title') {
             classes.push('text-base font-semibold text-gray-900');
          } else {
             classes.push('text-sm text-gray-500');
          }
      }
       // Add icon text color if icon prop is used
       else if (!slots.default && props.icon) {
           classes.push('text-gray-500'); // Default icon color
       }
       
      return classes.join(' ');
    });

    const iconClasses = computed(() => {
        // Adjust size based on common use cases (e.g., matching button icons)
        return ['size-5', props.icon]; 
    });

    return {
      hasContent,
      rootClasses,
      lineClasses,
      contentContainerClasses,
      contentSpanClasses,
      iconClasses,
    };
  },
  template: `
    <div :class="rootClasses">
      <div class="absolute inset-0 flex items-center" aria-hidden="true">
        <div :class="lineClasses" />
      </div>
      <div :class="contentContainerClasses">
        <span v-if="hasContent" :class="contentSpanClasses">
            <slot>
                <i v-if="icon" :class="iconClasses" aria-hidden="true"></i>
                <template v-else-if="label">{{ label }}</template>
            </slot>
        </span>
        <!-- Render a minimal gap even if no content is provided to slightly break the line visually -->
         <span v-else :class="[bgColor, 'w-4 h-px']"></span>
      </div>
    </div>
  `
}; 