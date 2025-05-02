const { computed } = Vue;

export default {
  name: 'BaseStackedList',
  props: {
    // Array of items to display
    items: {
      type: Array,
      default: () => []
    },
    // Unique identifier key for items
    itemKey: {
      type: String,
      default: 'id'
    },
    // Visual variant
    variant: {
      type: String,
      default: 'simple',
      validator: (value) => [
        'simple',         // Basic list with items
        'dark',           // Dark theme version
        'with-links',     // Items with clickable areas
        'with-badges',    // Items with status badges
        'card',           // Card-like appearance with shadow
        'narrow',         // Compact layout
        'two-column',     // Two column layout
        'full-width',     // Full width items
        'with-avatars',   // With avatar images
        'with-actions'    // With action buttons
      ].includes(value)
    },
    // Whether to show dividers between items
    dividers: {
      type: Boolean,
      default: true
    },
    // Column configuration for grid layouts
    columns: {
      type: [Number, String],
      default: 3
    },
    // Avatar configuration
    avatarSize: {
      type: String,
      default: '12', // size-12 = 3rem
      validator: (value) => ['6', '8', '10', '12', '14', '16'].includes(value)
    },
    // Background style
    bgColor: {
      type: String,
      default: 'white'
    },
    // Whether items should be clickable
    clickable: {
      type: Boolean,
      default: false
    },
    // Whether to apply hover effect on items
    hoverEffect: {
      type: Boolean,
      default: false
    },
    // Empty state message
    emptyMessage: {
      type: String,
      default: 'No items to display'
    }
  },
  setup(props) {
    // Container classes
    const listClasses = computed(() => {
      const classes = ['role="list"'];
      
      // Add divider classes if enabled
      if (props.dividers) {
        if (props.variant === 'dark') {
          classes.push('divide-y divide-gray-800');
        } else {
          classes.push('divide-y divide-gray-100');
        }
      }
      
      // Add card styling if needed
      if (props.variant === 'card') {
        classes.push('overflow-hidden bg-white shadow-xs ring-1 ring-gray-900/5 sm:rounded-xl');
      }
      
      return classes.join(' ');
    });
    
    // Compute classes for list items based on variant
    const getItemClasses = (item, index) => {
      const classes = [];
      
      // Base layout classes
      if (props.variant === 'simple' || props.variant === 'dark' || props.variant === 'with-actions') {
        classes.push('flex justify-between gap-x-6 py-5');
      } else if (props.variant === 'with-links' || props.variant === 'card') {
        classes.push('relative flex justify-between gap-x-6 py-5');
        
        if (props.variant === 'card') {
          classes.push('px-4 sm:px-6');
        }
        
        if (props.hoverEffect) {
          classes.push('hover:bg-gray-50');
        }
      } else if (props.variant === 'with-badges') {
        classes.push('flex items-center justify-between gap-x-6 py-5');
      } else if (props.variant === 'two-column') {
        classes.push('relative flex justify-between py-5');
      } else if (props.variant === 'full-width') {
        classes.push('relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6 lg:px-8');
      } else if (props.variant === 'narrow') {
        classes.push('flex gap-x-4 py-5');
      }
      
      // Add striped background for even rows if needed
      if (props.variant === 'striped' && index % 2 === 1) {
        classes.push('bg-gray-50');
      }
      
      // Add text colors for dark variant
      if (props.variant === 'dark') {
        classes.push('text-white');
      }
      
      return classes.join(' ');
    };
    
    // Helper function to determine if the items are people-like objects
    const hasPeopleProps = (item) => {
      return item && (item.name || item.email || item.imageUrl || item.role);
    };
    
    // Helper function to determine if the items are discussion-like objects
    const hasDiscussionProps = (item) => {
      return item && (item.title || item.author || item.commenters || item.totalComments);
    };
    
    // Helper function to determine if the items are project-like objects
    const hasProjectProps = (item) => {
      return item && (item.name && item.status && item.dueDate);
    };
    
    return {
      listClasses,
      getItemClasses,
      hasPeopleProps,
      hasDiscussionProps,
      hasProjectProps
    };
  },
  template: `
    <!-- Container -->
    <div>
      <!-- Main List -->
      <ul :class="listClasses">
        <!-- Empty state -->
        <li v-if="items.length === 0" class="px-4 py-6 text-center text-sm text-gray-500">
          {{ emptyMessage }}
        </li>
        
        <!-- Iterate through items -->
        <li 
          v-for="(item, index) in items" 
          :key="item[itemKey] || index" 
          :class="getItemClasses(item, index)"
        >
          <!-- Default slot with item context, allows full customization -->
          <slot :item="item" :index="index">
            <!-- Simple people list (default fallback template) -->
            <template v-if="hasPeopleProps(item)">
              <!-- Left side with avatar and info -->
              <div class="flex min-w-0 gap-x-4">
                <img v-if="item.imageUrl" class="size-12 flex-none rounded-full bg-gray-50" :src="item.imageUrl" alt="" />
                <div class="min-w-0 flex-auto">
                  <p class="text-sm/6 font-semibold" :class="variant === 'dark' ? 'text-white' : 'text-gray-900'">{{ item.name }}</p>
                  <p class="mt-1 truncate text-xs/5" :class="variant === 'dark' ? 'text-gray-400' : 'text-gray-500'">{{ item.email }}</p>
                </div>
              </div>
              
              <!-- Right side with role and status -->
              <div class="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                <p class="text-sm/6" :class="variant === 'dark' ? 'text-white' : 'text-gray-900'">{{ item.role }}</p>
                <p v-if="item.lastSeen" class="mt-1 text-xs/5" :class="variant === 'dark' ? 'text-gray-400' : 'text-gray-500'">
                  Last seen <time :datetime="item.lastSeenDateTime">{{ item.lastSeen }}</time>
                </p>
                <div v-else-if="item.lastSeen === null" class="mt-1 flex items-center gap-x-1.5">
                  <div class="flex-none rounded-full bg-emerald-500/20 p-1">
                    <div class="size-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p class="text-xs/5" :class="variant === 'dark' ? 'text-gray-400' : 'text-gray-500'">Online</p>
                </div>
              </div>
            </template>
            
            <!-- Project list fallback -->
            <template v-else-if="hasProjectProps(item)">
              <!-- Left side with project name and badge -->
              <div class="min-w-0">
                <div class="flex items-start gap-x-3">
                  <p class="text-sm/6 font-semibold text-gray-900">{{ item.name }}</p>
                  <p v-if="item.status" class="mt-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset" 
                     :class="{
                       'text-green-700 bg-green-50 ring-green-600/20': item.status === 'Complete',
                       'text-gray-600 bg-gray-50 ring-gray-500/10': item.status === 'In progress',
                       'text-yellow-800 bg-yellow-50 ring-yellow-600/20': item.status === 'Archived',
                     }">
                    {{ item.status }}
                  </p>
                </div>
                <div class="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500">
                  <p class="whitespace-nowrap">
                    Due on <time :datetime="item.dueDateTime">{{ item.dueDate }}</time>
                  </p>
                  <svg viewBox="0 0 2 2" class="size-0.5 fill-current">
                    <circle cx="1" cy="1" r="1" />
                  </svg>
                  <p class="truncate">Created by {{ item.createdBy }}</p>
                </div>
              </div>
              
              <!-- Right side with actions -->
              <div class="flex flex-none items-center gap-x-4">
                <a v-if="item.href" href="#" class="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:block">
                  View project<span class="sr-only">, {{ item.name }}</span>
                </a>
              </div>
            </template>
            
            <!-- Discussion list fallback -->
            <template v-else-if="hasDiscussionProps(item)">
              <div>
                <p class="text-sm/6 font-semibold text-gray-900">
                  <a v-if="item.href" :href="item.href" class="hover:underline">{{ item.title }}</a>
                  <span v-else>{{ item.title }}</span>
                </p>
                <div class="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500">
                  <p>
                    <a v-if="item.author?.href" :href="item.author.href" class="hover:underline">{{ item.author.name }}</a>
                    <span v-else>{{ item.author?.name }}</span>
                  </p>
                  <svg viewBox="0 0 2 2" class="size-0.5 fill-current">
                    <circle cx="1" cy="1" r="1" />
                  </svg>
                  <p>
                    <time :datetime="item.dateTime">{{ item.date }}</time>
                  </p>
                </div>
              </div>
              
              <!-- Avatar group and comment count if available -->
              <div v-if="item.commenters" class="flex w-full flex-none justify-between gap-x-8 sm:w-auto">
                <div class="flex -space-x-0.5">
                  <div v-for="commenter in item.commenters" :key="commenter.id">
                    <img class="size-6 rounded-full bg-gray-50 ring-2 ring-white" :src="commenter.imageUrl" :alt="commenter.name" />
                  </div>
                </div>
              </div>
            </template>
            
            <!-- Simple key-value fallback for other data types -->
            <template v-else>
              <div v-for="(value, key) in item" :key="key" class="py-1">
                <span class="font-medium text-gray-900">{{ key }}: </span>
                <span class="text-gray-500">{{ value }}</span>
              </div>
            </template>
          </slot>
      </li>
    </ul>
      
      <!-- Optional footer slot -->
      <slot name="footer"></slot>
    </div>
  `
};