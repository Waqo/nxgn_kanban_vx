const { computed } = Vue;

export default {
  name: 'BaseVerticalNavigation',
  props: {
    /**
     * Array of navigation item objects.
     * Required shape: { id: string|number, name: string, href: string, current: boolean }
     * Optional: { icon?: string (FA class), count?: string|number, children?: Array<NavItem> }
     * Child shape: { id: string|number, name: string, href: string, current: boolean, initial?: string }
     */
    navigationItems: {
      type: Array,
      required: true,
      default: () => []
    },
    /**
     * Styling variant based on background.
     * - 'light': Default, assumes light background (e.g., white).
     * - 'gray': Assumes gray background (e.g., bg-gray-50).
     */
    variant: {
      type: String,
      default: 'light',
      validator: (value) => ['light', 'gray'].includes(value)
    },
    /**
     * Optional title for a secondary navigation section, rendered before children.
     * Ignored if the #secondary-title slot is used.
     */
    secondaryTitle: {
        type: String,
        default: ''
    },
    /**
     * ARIA label for the <nav> element.
     */
    ariaLabel: {
        type: String,
        default: 'Sidebar'
    },
    /**
     * Custom classes for the root <nav> element.
     */
    className: {
        type: String,
        default: 'flex flex-1 flex-col' // Default from examples
    }
  },
  emits: ['item-click'], // Emit when an item is clicked
  setup(props, { emit }) {

    // Helper function to generate classes for primary navigation items
    const primaryItemClasses = (item) => {
      const base = 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold';
      let colors = '';
      if (item.current) {
        colors = props.variant === 'gray' ? 'bg-gray-100 text-indigo-600' : 'bg-gray-50 text-indigo-600';
      } else {
        colors = props.variant === 'gray' ? 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600';
      }
      return [base, colors].join(' ');
    };
    
    // Helper function to generate classes for secondary navigation items
    const secondaryItemClasses = (item) => {
       const base = 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold';
       let colors = '';
       if (item.current) {
           colors = props.variant === 'gray' ? 'bg-gray-100 text-indigo-600' : 'bg-gray-50 text-indigo-600';
       } else {
           colors = props.variant === 'gray' ? 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600';
       }
       return [base, colors].join(' ');
    };

    // Helper function for icon classes
    const iconClasses = (item) => {
      const base = 'size-6 shrink-0';
      const color = item.current ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600';
      return [base, color].join(' ');
    };

    // Helper function for badge classes
    const badgeClasses = (item) => {
      // Based on example: With icons and badges
      const base = 'ml-auto w-9 min-w-max rounded-full px-2.5 py-0.5 text-center text-xs/5 font-medium whitespace-nowrap';
      const colors = props.variant === 'gray' ? 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 ring-inset' : 'bg-white text-gray-600 ring-1 ring-gray-200 ring-inset';
      return [base, colors].join(' ');
    };
    
    // Classes for the secondary title
    const secondaryTitleClasses = computed(() => {
        return 'text-xs/6 font-semibold text-gray-400';
    });
    
     // Classes for the secondary item initial box
    const initialBoxClasses = (item) => {
        const base = 'flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium';
        const colors = item.current ? 'border-indigo-600 text-indigo-600' : 'border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600';
        return [base, colors].join(' ');
    };

    const handleItemClick = (item, event) => {
        // Prevent default if it's a real link, allow component/router logic
        // if (item.href && item.href !== '#') { 
        //   // Maybe let default browser navigation happen?
        // } else {
        //    event.preventDefault();
        // }
        emit('item-click', item);
    };

    return {
      primaryItemClasses,
      secondaryItemClasses,
      iconClasses,
      badgeClasses,
      secondaryTitleClasses,
      initialBoxClasses,
      handleItemClick
    };
  },
  template: `
    <nav :class="className" :aria-label="ariaLabel">
      <ul role="list" class="flex flex-1 flex-col gap-y-7">
        <!-- Top Level Items -->
        <li>
          <ul role="list" class="-mx-2 space-y-1">
            <li v-for="item in navigationItems" :key="item.id || item.name">
              <!-- Allow full item customization via slot -->
              <slot name="item" :item="item" :depth="0">
                  <a :href="item.href || '#'" 
                     :class="primaryItemClasses(item)"
                     @click="handleItemClick(item, $event)"
                     :aria-current="item.current ? 'page' : undefined"
                   >
                    <i v-if="item.icon" :class="[item.icon, iconClasses(item)]" aria-hidden="true"></i>
                    <span class="truncate">{{ item.name }}</span>
                    <slot name="badge" :count="item.count">
                      <span v-if="item.count != null" :class="badgeClasses(item)" aria-hidden="true">
                        {{ item.count }}
                      </span>
                    </slot>
                  </a>
              </slot>
            </li>
          </ul>
        </li>

        <!-- Secondary Navigation (Optional) -->
        <!-- Find first item with children to render secondary nav -->
        <li v-if="navigationItems.some(item => item.children && item.children.length > 0)">
          <slot name="secondary-title" :title="secondaryTitle">
              <div v-if="secondaryTitle" :class="secondaryTitleClasses">{{ secondaryTitle }}</div>
          </slot>
          <ul role="list" class="-mx-2 mt-2 space-y-1">
            <template v-for="parentItem in navigationItems" :key="parentItem.id || parentItem.name">
                <li v-for="childItem in parentItem.children" :key="childItem.id || childItem.name">
                    <slot name="item" :item="childItem" :depth="1">
                         <a :href="childItem.href || '#'" 
                            :class="secondaryItemClasses(childItem)"
                            @click="handleItemClick(childItem, $event)"
                            :aria-current="childItem.current ? 'page' : undefined">
                           <!-- Custom Prefix (e.g., Initial Box) -->
                           <slot name="secondary-item-prefix" :item="childItem">
                              <span v-if="childItem.initial" :class="initialBoxClasses(childItem)">
                                {{ childItem.initial }}
                              </span>
                              <!-- Add default icon support if needed for secondary -->
                              <i v-else-if="childItem.icon" :class="[childItem.icon, iconClasses(childItem)]" aria-hidden="true"></i>
                           </slot>
                           <span class="truncate">{{ childItem.name }}</span>
                         </a>
                    </slot>
                </li>
            </template>
          </ul>
        </li>
        
        <!-- Footer/Bottom Slot -->
        <li class="mt-auto" v-if="$slots.footer">
           <slot name="footer"></slot>
        </li>
      </ul>
    </nav>
  `
}; 