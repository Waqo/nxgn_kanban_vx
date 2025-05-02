const { computed } = Vue;

export default {
  name: 'BaseFeed',
  props: {
    /**
     * Array of items to display in the feed.
     * The structure of each item is determined by the parent component using the slot.
     */
    items: {
      type: Array,
      required: true,
      default: () => []
    },
    /**
     * Unique key property for each item in the `items` array.
     */
    itemKey: {
      type: String,
      default: 'id'
    },
    /**
     * Styling variant for the feed layout.
     * - 'simple': Default vertical feed with icons offset to the left.
     * - 'compact': A more compact feed, often used for comments or simpler events.
     */
    variant: {
        type: String,
        default: 'simple',
        validator: (value) => ['simple', 'compact'].includes(value)
    },
    /**
     * Whether to show the vertical connecting line between items.
     */
    showLine: {
      type: Boolean,
      default: true
    },
    /**
     * Tailwind background color class for the connecting line.
     */
    lineColor: {
        type: String,
        default: 'bg-gray-200'
    },
    /**
     * Tailwind width class for the connecting line.
     */
    lineWidth: {
        type: String,
        default: 'w-0.5'
    },
    /**
     * Tailwind classes for positioning the top of the connecting line relative to the item's icon/marker.
     * Adjust based on icon/marker size and desired alignment.
     * e.g., 'top-4 left-4 -ml-px' for simple variant with size-8 icons.
     * e.g., 'top-0 left-0 flex w-6 justify-center' for compact variant with size-6 icons.
     */
    lineOffset: {
        type: String,
        // Default will be set based on variant in computed properties
        default: null
    },
    /**
     * Custom CSS class(es) to apply to the root `ul` element.
     */
    listClass: {
      type: String,
      default: ''
    },
    /**
     * Custom CSS class(es) to apply to each `li` element.
     */
    itemClass: {
      type: String,
      default: ''
    },
    /**
     * Message to display when the `items` array is empty.
     */
    emptyMessage: {
      type: String,
      default: 'No feed items to display.'
    }
  },
  setup(props) {
    const hasItems = computed(() => props.items && props.items.length > 0);

    const listContainerClasses = computed(() => {
        const classes = [];
        if (props.variant === 'simple') {
            classes.push('-mb-8'); // Negative margin for simple feed line overlap
        } else if (props.variant === 'compact') {
            classes.push('space-y-6'); // Spacing for comment-like feeds
        }
        if (props.listClass) {
            classes.push(props.listClass);
        }
        return classes.join(' ');
    });

    const listItemClasses = computed(() => {
        const classes = ['relative']; // Base relative positioning for line
        if (props.variant === 'simple') {
            classes.push('pb-8'); // Padding at the bottom for simple feed line
        } else if (props.variant === 'compact') {
            classes.push('flex gap-x-4'); // Flex layout for compact variant
        }
        if (props.itemClass) {
            classes.push(props.itemClass);
        }
        return classes.join(' ');
    });

    const effectiveLineOffset = computed(() => {
        if (props.lineOffset) return props.lineOffset;
        // Provide defaults based on variant if no specific offset is given
        return props.variant === 'compact'
            ? 'absolute top-0 left-0 flex w-6 justify-center'
            : 'absolute top-4 left-4 -ml-px'; // Default for 'simple'
    });

    const lineClasses = computed(() => {
      const classes = [effectiveLineOffset.value];
      if (props.variant === 'simple') {
          classes.push('h-full', props.lineWidth, props.lineColor);
      } else if (props.variant === 'compact') {
          // For compact, the parent div provides the height, we just need width/color
          classes.push(props.lineWidth, props.lineColor);
      }
      return classes.join(' ');
    });

    // Specific classes for the compact variant's line container div
    const compactLineContainerClasses = computed(() => {
        return 'absolute top-0 left-0 flex w-6 justify-center -bottom-6';
    });

    return {
      hasItems,
      listContainerClasses,
      listItemClasses,
      lineClasses,
      compactLineContainerClasses,
    };
  },
  template: `
    <div class="base-feed flow-root">
      <!-- Empty State -->
      <div v-if="!hasItems" class="text-center py-6 text-gray-500">
        <slot name="empty">
          {{ emptyMessage }}
        </slot>
      </div>

      <!-- Feed List -->
      <ul v-else role="list" :class="listContainerClasses">
        <li v-for="(item, index) in items" :key="item[itemKey] || index" :class="listItemClasses">
          
          <!-- Connecting Line (handled differently based on variant) -->
          <template v-if="showLine && index !== items.length - 1">
             <!-- Simple Variant Line -->
             <span v-if="variant === 'simple'" :class="lineClasses" aria-hidden="true"></span>
             <!-- Compact Variant Line (inside a container div) -->
             <div v-else-if="variant === 'compact'" :class="compactLineContainerClasses">
                 <div :class="lineClasses"></div>
             </div>
          </template>

          <!-- Scoped Slot for Item Content -->
          <!-- Parent component defines the rendering here -->
          <slot name="item" :item="item" :index="index" :is-last="index === items.length - 1">
            <!-- Default Fallback Content (Simple Structure) -->
            <div class="relative flex space-x-3">
              <!-- Icon Placeholder -->
              <div>
                <span class="flex size-8 items-center justify-center rounded-full bg-gray-400 ring-8 ring-white">
                  <i class="fas fa-info-circle size-5 text-white"></i>
                </span>
              </div>
              <!-- Content Placeholder -->
              <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                <div>
                  <p class="text-sm text-gray-500">
                    Default Slot: Item {{ item[itemKey] || index }}
                  </p>
                </div>
                <div class="text-right text-sm whitespace-nowrap text-gray-500">
                  <time v-if="item.datetime || item.date">{{ item.date || 'No date' }}</time>
                </div>
              </div>
            </div>
          </slot>
        </li>
      </ul>

      <!-- Footer Slot (e.g., for comment form) -->
      <div v-if="$slots.footer" class="mt-6">
        <slot name="footer"></slot>
      </div>
    </div>
  `
}; 