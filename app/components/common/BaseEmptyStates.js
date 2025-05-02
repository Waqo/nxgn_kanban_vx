const { computed } = Vue;

export default {
  name: 'BaseEmptyStates',
  props: {
    /**
     * Name/class of the primary icon (e.g., Font Awesome class like 'fas fa-folder-open').
     * Ignored if the #icon slot is used.
     */
    icon: {
      type: String,
      default: ''
    },
    /**
     * Additional CSS classes for the default icon element.
     */
    iconClass: {
      type: String,
      default: 'mx-auto size-12 text-gray-400'
    },
    /**
     * Main heading text.
     * Ignored if the #title slot is used.
     */
    title: {
      type: String,
      default: ''
    },
    /**
     * Title heading level (h2 or h3).
     */
    titleTag: {
        type: String,
        default: 'h3',
        validator: (val) => ['h2', 'h3'].includes(val)
    },
    /**
     * CSS classes for the default title element.
     */
    titleClass: {
        type: String,
        default: 'mt-2 text-sm font-semibold text-gray-900'
    },
    /**
     * Supporting description text.
     * Ignored if the #description slot is used.
     */
    description: {
      type: String,
      default: ''
    },
    /**
     * CSS classes for the default description element.
     */
    descriptionClass: {
        type: String,
        default: 'mt-1 text-sm text-gray-500'
    },
    /**
     * Overall layout variant.
     * - 'simple': Centered icon, title, description, actions.
     * - 'bordered-button': Wraps core content in a clickable button with border.
     * - 'content-focused': Top-aligned title/description, slots for actions/secondary content below.
     */
    variant: {
      type: String,
      default: 'simple',
      validator: (value) => [
        'simple',
        'bordered-button',
        'content-focused'
      ].includes(value)
    },
    /**
     * Border style for the 'bordered-button' variant.
     */
    borderStyle: {
      type: String,
      default: 'border-dashed' // e.g., border-solid, border-dotted
    },
    /**
     * Border color class for the 'bordered-button' variant.
     */
    borderColor: {
      type: String,
      default: 'border-gray-300'
    },
    /**
     * Border hover color class for the 'bordered-button' variant.
     */
    borderHoverColor: {
        type: String,
        default: 'hover:border-gray-400'
    },
     /**
     * Custom CSS classes for the root container element.
     */
    containerClass: {
        type: String,
        default: ''
    }
  },
  emits: ['button-click'], // Emitted by the bordered-button variant
  setup(props, { emit, slots }) {

    const rootClasses = computed(() => {
        const classes = ['base-empty-state'];
        if (props.variant === 'simple') {
            classes.push('text-center');
        }
        if (props.containerClass) {
            classes.push(props.containerClass);
        }
        return classes.join(' ');
    });

    const borderedButtonClasses = computed(() => {
        if (props.variant !== 'bordered-button') return [];
        return [
            'relative block w-full rounded-lg border-2 p-12 text-center',
            props.borderStyle,
            props.borderColor,
            props.borderHoverColor,
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2' // Standard focus
        ].join(' ');
    });

    const actionContainerClasses = computed(() => {
       return props.variant === 'simple' ? 'mt-6' : 'mt-4 flex'; // Adjust margin/layout for content-focused
    });
    
    const secondaryContentContainerClasses = computed(() => {
        return 'mt-6'; // Default margin for secondary content area
    });
    
    const handleButtonClick = () => {
        if (props.variant === 'bordered-button') {
            emit('button-click');
        }
    };

    return {
      rootClasses,
      borderedButtonClasses,
      actionContainerClasses,
      secondaryContentContainerClasses,
      handleButtonClick
    };
  },
  template: `
    <div :class="rootClasses">
      <!-- Variant: Bordered Button -->
      <button 
        v-if="variant === 'bordered-button'" 
        type="button" 
        :class="borderedButtonClasses"
        @click="handleButtonClick"
      >
        <slot name="icon">
          <i v-if="icon" :class="[icon, iconClass]" aria-hidden="true"></i>
           <!-- Default SVG Placeholder -->
           <svg v-else class="mx-auto size-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
             <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
           </svg>
        </slot>
        <slot name="title">
          <span v-if="title" :class="[titleClass, 'mt-2 block']">{{ title }}</span>
        </slot>
        <!-- Description and actions typically not used inside the button variant -->
      </button>

      <!-- Variants: Simple & Content Focused -->
      <template v-else>
        <slot name="icon">
          <i v-if="icon" :class="[icon, iconClass]" aria-hidden="true"></i>
          <!-- Default SVG Placeholder -->
          <svg v-else class="mx-auto size-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
             <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </slot>

        <slot name="title">
          <component :is="titleTag" v-if="title" :class="titleClass">{{ title }}</component>
        </slot>

        <slot name="description">
          <p v-if="description" :class="descriptionClass">{{ description }}</p>
        </slot>

        <div v-if="$slots.actions" :class="actionContainerClasses">
          <slot name="actions"></slot>
        </div>
        
        <div v-if="$slots.secondaryContent" :class="secondaryContentContainerClasses">
           <slot name="secondaryContent"></slot>
        </div>
      </template>
    </div>
  `
}; 