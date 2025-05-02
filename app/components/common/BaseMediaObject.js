const { computed } = Vue;

export default {
  name: 'BaseMediaObject',
  props: {
    /**
     * Position of the media element relative to the content.
     */
    mediaPosition: {
      type: String,
      default: 'left',
      validator: (value) => ['left', 'right'].includes(value)
    },
    /**
     * Vertical alignment of the media element relative to the content.
     * 'stretch' makes the media element container try to match the height of the content.
     */
    mediaAlignment: {
      type: String,
      default: 'top',
      validator: (value) => ['top', 'center', 'bottom', 'stretch'].includes(value)
    },
    /**
     * Responsive behavior.
     * - 'none': Stays side-by-side on all screen sizes.
     * - 'basic': Stacks media above content on small screens.
     * - 'wide': Stacks media above (full width) on small screens.
     */
    responsive: {
      type: String,
      default: 'none',
      validator: (value) => ['none', 'basic', 'wide'].includes(value)
    },
    /**
     * Tailwind width class for the media container (e.g., 'w-16', 'w-32').
     * Ignored if responsive='wide'.
     */
    mediaWidth: {
      type: String,
      default: 'w-16'
    },
    /**
     * Tailwind margin class for spacing between media and content (e.g., 'mr-4', 'ml-4').
     * Automatically determined based on mediaPosition if not provided.
     */
    spacingClass: {
      type: String,
      default: null
    },
    /**
     * Default spacing value if spacingClass is not provided (Tailwind unit, e.g., 4).
     */
    defaultSpacing: {
        type: [String, Number],
        default: 4
    },
    /**
     * Custom classes for the root container element.
     */
    containerClass: {
      type: String,
      default: ''
    },
    /**
     * Custom classes for the media container element.
     */
    mediaContainerClass: {
        type: String,
        default: ''
    },
    /**
     * Custom classes for the main content container element.
     */
    contentContainerClass: {
         type: String,
         default: ''
    }
  },
  setup(props, { slots }) {

    const rootClasses = computed(() => {
      const classes = ['base-media-object'];
      if (props.responsive === 'none') {
          classes.push('flex');
      } else {
          classes.push('sm:flex'); // Apply flex only on sm+ for responsive variants
      }
      // Apply alignment
      switch(props.mediaAlignment) {
          case 'center': classes.push('items-center'); break;
          case 'bottom': classes.push('items-end'); break;
          case 'stretch': classes.push('items-stretch'); break;
          case 'top': // Default alignment is top (items-start is default for flex)
          default: break; 
      }
      if (props.containerClass) classes.push(props.containerClass);
      return classes.join(' ');
    });

    const effectiveSpacingClass = computed(() => {
       if (props.spacingClass) return props.spacingClass;
       // Determine margin direction and value based on position
       const marginDirection = props.mediaPosition === 'left' ? 'mr' : 'ml';
       // Responsive margin handling
       if (props.responsive === 'basic' || props.responsive === 'wide') {
           return `mb-4 sm:mb-0 sm:${marginDirection}-${props.defaultSpacing}`;
       } else {
           return `${marginDirection}-${props.defaultSpacing}`;
       }
    });

    const mediaClasses = computed(() => {
      const classes = ['shrink-0', effectiveSpacingClass.value];
      if (props.responsive !== 'wide') {
          classes.push(props.mediaWidth);
      } else {
          // For 'wide' responsive, take full width on mobile
          classes.push(`w-full h-32 ${props.mediaWidth.startsWith('sm:') ? props.mediaWidth : `sm:${props.mediaWidth}`}`); 
      }
       if (props.mediaContainerClass) classes.push(props.mediaContainerClass);
      return classes.join(' ');
    });

    const contentClasses = computed(() => {
      // Add grow-1 to allow content to take remaining space
      const classes = ['flex-1 min-w-0']; 
      if (props.contentContainerClass) classes.push(props.contentContainerClass);
      return classes.join(' ');
    });

    return {
      rootClasses,
      mediaClasses,
      contentClasses
    };
  },
  template: `
    <div :class="rootClasses">
      <!-- Media on Left -->
      <template v-if="mediaPosition === 'left'">
        <div :class="mediaClasses">
          <slot name="media">
            <!-- Default Placeholder -->
            <svg :class="['border border-gray-300 bg-white text-gray-300', mediaAlignment === 'stretch' ? 'h-full w-full' : 'size-full']" preserveAspectRatio="none" stroke="currentColor" fill="none" viewBox="0 0 200 200" aria-hidden="true">
              <path vector-effect="non-scaling-stroke" stroke-width="1" d="M0 0l200 200M0 200L200 0" />
            </svg>
          </slot>
        </div>
        <div :class="contentClasses">
          <slot>
            <!-- Default Content -->
            <h4 class="text-lg font-bold">Default Title</h4>
            <p class="mt-1">Default content area.</p>
          </slot>
        </div>
      </template>

      <!-- Media on Right -->
      <template v-else>
        <div :class="contentClasses">
          <slot>
            <!-- Default Content -->
            <h4 class="text-lg font-bold">Default Title</h4>
            <p class="mt-1">Default content area.</p>
          </slot>
        </div>
        <div :class="mediaClasses">
          <slot name="media">
            <!-- Default Placeholder -->
            <svg :class="['border border-gray-300 bg-white text-gray-300', mediaAlignment === 'stretch' ? 'h-full w-full' : 'size-full']" preserveAspectRatio="none" stroke="currentColor" fill="none" viewBox="0 0 200 200" aria-hidden="true">
              <path vector-effect="non-scaling-stroke" stroke-width="1" d="M0 0l200 200M0 200L200 0" />
            </svg>
          </slot>
        </div>
      </template>
    </div>
  `
}; 