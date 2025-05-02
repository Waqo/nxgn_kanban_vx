// app/components/common/BaseList.js

const { computed } = Vue;

export default {
  name: 'BaseListContainer',
  props: {
    // List items (optional, can use slots instead)
    items: {
      type: Array,
      default: () => []
    },
    // Unique identifier key for items
    itemKey: {
      type: String,
      default: 'id'
    },
    // List variant
    variant: {
      type: String,
      default: 'simple',
      validator: value => [
        'simple', 
        'card', 
        'card-mobile', 
        'separate', 
        'separate-mobile', 
        'flat', 
        'simple-mobile'
      ].includes(value)
    },
    // Whether to show dividers between items
    dividers: {
      type: Boolean,
      default: true
    },
    // Spacing between separate cards
    cardSpacing: {
      type: String,
      default: '3' // space-y-3
    },
    // Padding values
    paddingX: {
      type: String,
      default: '6' // px-6 (for most variants)
    },
    paddingY: {
      type: String,
      default: '4' // py-4
    },
    mobilePaddingX: {
      type: String,
      default: '4' // px-4 (for mobile variants)
    },
    // Additional classes
    className: {
      type: String,
      default: ''
    },
    // Empty state message
    emptyMessage: {
      type: String,
      default: 'No items to display'
    }
  },
  setup(props, { slots }) {
    // Check if we have items or default slot
    const hasContent = computed(() => {
      return (props.items && props.items.length > 0) || !!slots.default;
    });
    
    // Classes for the container
    const containerClasses = computed(() => {
      const classes = [];
      
      switch (props.variant) {
        case 'card':
          classes.push('overflow-hidden rounded-md bg-white shadow-sm');
          break;
        case 'card-mobile':
          classes.push('overflow-hidden bg-white shadow-sm sm:rounded-md');
          break;
        case 'separate':
          classes.push(`space-y-${props.cardSpacing}`);
          break;
        case 'separate-mobile':
          classes.push(`space-y-${props.cardSpacing}`);
          break;
        case 'flat':
          classes.push('overflow-hidden rounded-md border border-gray-300 bg-white');
          break;
        default:
          // Simple and simple-mobile have no container classes
          break;
      }
      
      if (props.className) {
        classes.push(props.className);
      }
      
      return classes.join(' ');
    });
    
    // Classes for the list element
    const listClasses = computed(() => {
      const classes = ['role="list"'];
      
      // Add dividers if needed
      if (props.dividers) {
        classes.push(props.variant === 'flat' ? 'divide-y divide-gray-300' : 'divide-y divide-gray-200');
      }
      
      return classes.join(' ');
    });
    
    // Classes for the list items
    const itemClasses = computed(() => {
      const classes = [];
      
      switch(props.variant) {
        case 'card':
        case 'flat':
          classes.push(`px-${props.paddingX} py-${props.paddingY}`);
          break;
        case 'card-mobile':
          classes.push(`px-${props.mobilePaddingX} py-${props.paddingY} sm:px-${props.paddingX}`);
          break;
        case 'separate':
          classes.push(`overflow-hidden rounded-md bg-white px-${props.paddingX} py-${props.paddingY} shadow-sm`);
          break;
        case 'separate-mobile':
          classes.push(`overflow-hidden bg-white px-${props.mobilePaddingX} py-${props.paddingY} shadow-sm sm:rounded-md sm:px-${props.paddingX}`);
          break;
        case 'simple-mobile':
          classes.push(`px-${props.mobilePaddingX} py-${props.paddingY} sm:px-0`);
          break;
        case 'simple':
        default:
          classes.push(`py-${props.paddingY}`);
          break;
      }
      
      return classes.join(' ');
    });
    
    return {
      hasContent,
      containerClasses,
      listClasses,
      itemClasses
    };
  },
  template: `
    <!-- Container -->
    <div v-if="hasContent" :class="containerClasses">
      <!-- List -->
      <ul :class="listClasses">
        <!-- Using items prop -->
        <li v-if="items.length > 0" 
            v-for="item in items" 
            :key="item[itemKey]" 
            :class="itemClasses">
          <slot name="item" :item="item">
            <!-- Default render for items -->
            {{ JSON.stringify(item) }}
          </slot>
        </li>
        
        <!-- Using default slot -->
        <slot v-else></slot>
      </ul>
    </div>
    
    <!-- Empty state -->
    <div v-else class="text-center py-8 text-gray-500">
      <slot name="empty">
        {{ emptyMessage }}
      </slot>
    </div>
  `
};