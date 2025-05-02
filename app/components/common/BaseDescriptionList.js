// app/components/common/BaseDescriptionList.js

const { computed } = Vue;

export default {
  name: 'BaseDescriptionList',
  props: {
    // List items as array of { term, description } objects
    items: {
      type: Array,
      default: () => []
    },
    // Optional title for the list
    title: {
      type: String,
      default: ''
    },
    // Optional subtitle below title
    subtitle: {
      type: String,
      default: ''
    },
    // Layout variants
    variant: {
      type: String,
      default: 'default',
      validator: (val) => ['default', 'compact', 'bordered', 'stacked', 'striped', 'card', 'two-column'].includes(val)
    },
    // Column configuration
    columns: {
      type: [Number, String],
      default: 1,
      validator: (val) => [1, 2, 3, 4, 5, '1', '2', '3', '4', '5'].includes(val)
    },
    // Term and description styling 
    termClass: {
      type: String,
      default: ''
    },
    descriptionClass: {
      type: String,
      default: ''
    },
    // Background and border colors
    bgColor: {
      type: String,
      default: 'white'
    },
    // Divide lines between items
    dividers: {
      type: Boolean,
      default: true
    },
    // Item spacing
    spacing: {
      type: String,
      default: 'md',
      validator: (val) => ['sm', 'md', 'lg'].includes(val)
    },
    // Padding control
    paddingX: {
      type: String,
      default: '0',
      validator: (val) => ['0', '3', '4', '6'].includes(val)
    },
    // Whether to allow inline action buttons
    withActions: {
      type: Boolean,
      default: false
    },
    // Whether to hide term labels (for narrow view)
    hideLabels: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    // Convert columns to a number
    const numColumns = computed(() => Number(props.columns));
    
    // Classes for the container
    const containerClasses = computed(() => {
      const classes = ['bg-' + props.bgColor];
      
      if (props.variant === 'bordered' || props.variant === 'card') {
        classes.push('border border-gray-200 rounded-lg overflow-hidden shadow-sm');
      }
      
      if (props.variant === 'card') {
        classes.push('shadow-sm');
      }
      
      return classes.join(' ');
    });
    
    // Classes for the list element
    const listClasses = computed(() => {
      const classes = [];
      
      if (props.dividers && props.variant !== 'stacked' && props.variant !== 'striped') {
        classes.push('divide-y divide-gray-100');
      }
      
      if (numColumns.value > 1 && props.variant === 'two-column') {
        classes.push(`grid grid-cols-1 sm:grid-cols-${numColumns.value}`);
      }
      
      return classes.join(' ');
    });
    
    // Classes for each item
    const itemClasses = computed(() => {
      const classes = [];
      
      // Spacing based on prop
      switch (props.spacing) {
        case 'sm': classes.push('py-3'); break;
        case 'lg': classes.push('py-5'); break;
        case 'md': 
        default: classes.push('py-4'); break;
      }
      
      // Add horizontal padding if specified
      if (props.paddingX !== '0') {
        classes.push(`px-${props.paddingX}`);
      }
      
      // Variant-specific styling
      if (props.variant === 'default') {
        classes.push('sm:grid sm:grid-cols-3 sm:gap-4');
      } else if (props.variant === 'compact') {
        classes.push('flex');
      } else if (props.variant === 'stacked') {
        classes.push('mb-4 last:mb-0');
        if (props.dividers) {
          classes.push('pb-4 border-b border-gray-100 last:border-0');
        }
      } else if (props.variant === 'striped') {
        classes.push('sm:grid sm:grid-cols-3 sm:gap-4');
        // Will apply bg-gray-50 to even items in the template
      } else if (props.variant === 'two-column') {
        classes.push('border-t border-gray-100');
      } else if (props.variant === 'card') {
        classes.push('sm:grid sm:grid-cols-3 sm:gap-4');
      }
      
      return classes.join(' ');
    });
    
    // Classes for terms (left column/labels)
    const termClasses = computed(() => {
      const classes = ['text-sm font-medium text-gray-900'];
      
      if (props.hideLabels) {
        classes.push('sr-only');
      } else if (props.variant === 'default' || props.variant === 'striped' || props.variant === 'card') {
        // Default styling
      } else if (props.variant === 'compact') {
        classes.push('w-1/3 flex-shrink-0');
      } else if (props.variant === 'stacked') {
        classes.push('mb-1');
      } else if (props.variant === 'two-column') {
        classes.push('sm:mt-2');
      }
      
      if (props.termClass) {
        classes.push(props.termClass);
      }
      
      return classes.join(' ');
    });
    
    // Classes for descriptions (right column/values)
    const descriptionClasses = computed(() => {
      const classes = ['text-sm text-gray-500'];
      
      if (props.variant === 'default' || props.variant === 'striped' || props.variant === 'card') {
        classes.push('mt-1 sm:mt-0 sm:col-span-2');
      } else if (props.variant === 'compact') {
        classes.push('flex-1');
      } else if (props.variant === 'two-column') {
        classes.push('mt-1 sm:mt-2');
      }
      
      if (props.withActions) {
        classes.push('flex');
      }
      
      if (props.descriptionClass) {
        classes.push(props.descriptionClass);
      }
      
      return classes.join(' ');
    });
    
    // Special classes for the description content when actions are present
    const descriptionContentClasses = computed(() => {
      if (props.withActions) {
        return 'grow'; // Make content grow to fill available space
      }
      return '';
    });
    
    return {
      containerClasses,
      listClasses,
      itemClasses,
      termClasses,
      descriptionClasses,
      descriptionContentClasses
    };
  },
  template: `
    <div :class="containerClasses">
      <!-- Title and Subtitle -->
      <div v-if="title" class="px-4 py-5 sm:px-6">
        <h3 class="text-base font-semibold leading-6 text-gray-900">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 max-w-2xl text-sm text-gray-500">{{ subtitle }}</p>
        <slot name="subtitle"></slot>
      </div>
      
      <!-- Description List -->
      <dl :class="listClasses">
        <!-- Items from prop data -->
        <template v-if="items.length > 0">
          <div 
            v-for="(item, index) in items" 
            :key="index" 
            :class="[
              itemClasses, 
              variant === 'striped' ? (index % 2 === 0 ? 'bg-gray-50' : 'bg-white') : '',
              variant === 'card' ? 'sm:px-6' : ''
            ]"
          >
            <dt :class="termClasses">{{ item.term }}</dt>
            <dd :class="descriptionClasses">
              <span :class="descriptionContentClasses">{{ item.description }}</span>
              <slot v-if="withActions" name="actions" :item="item" :index="index">
                <span class="ml-4 shrink-0">
                  <button type="button" class="rounded-md bg-white font-medium text-indigo-600 hover:text-indigo-500">Update</button>
                </span>
              </slot>
            </dd>
          </div>
        </template>
        
        <!-- Items from slots -->
        <template v-else>
          <slot>
            <!-- Default item for reference -->
            <div :class="itemClasses">
              <dt :class="termClasses">Example Term</dt>
              <dd :class="descriptionClasses">
                <span :class="descriptionContentClasses">Example description of the term.</span>
                <slot v-if="withActions" name="actions" :item="{term: 'Example Term', description: 'Example description'}" :index="0">
                  <span class="ml-4 shrink-0">
                    <button type="button" class="rounded-md bg-white font-medium text-indigo-600 hover:text-indigo-500">Update</button>
                  </span>
                </slot>
              </dd>
            </div>
          </slot>
        </template>
      </dl>
      
      <!-- Footer slot -->
      <slot name="footer"></slot>
    </div>
  `
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseDescriptionList = BaseDescriptionList; 