const { computed } = Vue;

export default {
  name: 'BaseActionPanel',
  props: {
    /**
     * Main title text for the panel.
     */
    title: {
      type: String,
      default: ''
    },
    /**
     * Description text below the title.
     */
    description: {
      type: String,
      default: ''
    },
    /**
     * Layout variant determining action placement.
     * - 'default': Action appears below the description.
     * - 'action-right': Action appears inline to the right of the text (on wider screens).
     * - 'action-top-right': Action appears at the top right, opposite the title.
     * - 'input-group': Specific layout for an input and button combo.
     * - 'well': Uses a different background color (e.g., gray-50).
     */
    variant: {
      type: String,
      default: 'default',
      validator: (value) => [
        'default',
        'action-right',
        'action-top-right',
        'input-group',
        'well'
      ].includes(value)
    },
    /**
     * Background color class (e.g., 'bg-white', 'bg-gray-50').
     */
    bgColor: {
      type: String,
      default: null // Default determined by variant
    },
    /**
     * Rounding utility class (e.g., 'sm:rounded-lg', 'rounded-md').
     */
    rounded: {
      type: String,
      default: 'sm:rounded-lg'
    },
    /**
     * Shadow utility class (e.g., 'shadow-sm', 'shadow-md').
     */
    shadow: {
      type: String,
      default: 'shadow-sm'
    },
    /**
     * Padding utility class(es) (e.g., 'px-4 py-5 sm:p-6').
     */
    padding: {
      type: String,
      default: 'px-4 py-5 sm:p-6'
    },
    /**
     * Additional custom classes for the root element.
     */
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {

    const effectiveBgColor = computed(() => {
      if (props.bgColor) return props.bgColor;
      return props.variant === 'well' ? 'bg-gray-50' : 'bg-white';
    });

    const containerClasses = computed(() => {
      return [
        effectiveBgColor.value,
        props.shadow,
        props.rounded,
        props.className
      ].filter(Boolean).join(' ');
    });

    const contentWrapperClasses = computed(() => {
      const classes = [props.padding];
      // Specific structure for top-right actions
      if (props.variant === 'action-top-right') {
        classes.push('sm:flex sm:items-start sm:justify-between');
      }
      return classes.join(' ');
    });

    const mainContentClasses = computed(() => {
      const classes = [];
      if (props.variant === 'action-right') {
        classes.push('sm:flex sm:items-start sm:justify-between');
      }
      return classes.join(' ');
    });

    const textContentClasses = computed(() => {
        const classes = ['max-w-xl']; // Limit width by default
        if (props.variant === 'action-right') {
           // No specific classes needed here for text side, handled by parent flex
        } else if (props.variant === 'action-top-right') {
            // No specific classes needed here for text side
        }
        return classes.join(' ');
    });

    const actionContainerClasses = computed(() => {
      const classes = [];
      switch (props.variant) {
        case 'default':
        case 'well':
          classes.push('mt-5');
          break;
        case 'action-right':
          classes.push('mt-5 sm:mt-0 sm:ml-6 sm:flex sm:shrink-0 sm:items-center');
          break;
        case 'action-top-right':
          classes.push('mt-5 sm:mt-0 sm:ml-6 sm:flex sm:shrink-0 sm:items-center');
          break;
        case 'input-group':
          classes.push('mt-5 sm:flex sm:items-center'); // Form tag likely needed around input+button in slot
          break;
        default:
            classes.push('mt-5');
            break;
      }
      return classes.join(' ');
    });

    return {
      containerClasses,
      contentWrapperClasses,
      mainContentClasses,
      textContentClasses,
      actionContainerClasses,
    };
  },
  template: `
    <div :class="containerClasses">
      <div :class="contentWrapperClasses">
        <!-- Layout for variants where action is NOT top-right -->
        <div v-if="variant !== 'action-top-right'" :class="mainContentClasses">
            <!-- Text Content Area -->
            <div :class="textContentClasses">
                <slot name="title">
                    <h3 v-if="title" class="text-base font-semibold text-gray-900">{{ title }}</h3>
                </slot>
                <div v-if="description || $slots.description" class="mt-2 text-sm text-gray-500">
                    <slot name="description">
                        <p>{{ description }}</p>
                    </slot>
                </div>
                <slot name="content"></slot> <!-- General content slot -->
            </div>

            <!-- Action Slot (Positioned based on variant) -->
            <div v-if="$slots.action" :class="actionContainerClasses">
                <slot name="action"></slot>
            </div>
        </div>

        <!-- Layout for variant where action IS top-right -->
        <div v-else :class="mainContentClasses"> <!-- Variant is 'action-top-right' -->
             <!-- Text Content Area -->
             <div :class="textContentClasses">
                <slot name="title">
                     <h3 v-if="title" class="text-base font-semibold text-gray-900">{{ title }}</h3>
                 </slot>
                 <div v-if="description || $slots.description" class="mt-2 max-w-xl text-sm text-gray-500">
                     <slot name="description">
                         <p>{{ description }}</p>
                     </slot>
                 </div>
                 <slot name="content"></slot> <!-- General content slot -->
             </div>
             <!-- Action Slot (Positioned based on variant) -->
             <div v-if="$slots.action" :class="actionContainerClasses">
                 <slot name="action"></slot>
             </div>
        </div>
      </div>
    </div>
  `
}; 