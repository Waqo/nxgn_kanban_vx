const { computed, ref } = Vue;

export default {
  name: 'BaseSidebarNavigation',
  props: {
    /**
     * Array of primary navigation item objects.
     * Required shape: { id: string|number, name: string, href?: string, current: boolean }
     * Optional: { icon?: string (FA class), count?: string|number, children?: Array<NavItem> }
     */
    navigationItems: {
      type: Array,
      required: true,
      default: () => []
    },
    /**
     * Array of secondary navigation item objects (e.g., Teams, Projects).
     * Required shape: { id: string|number, name: string, href?: string, current: boolean }
     * Optional: { initial?: string }
     */
    secondaryNavigationItems: {
      type: Array,
      default: () => []
    },
    /**
     * Title for the secondary navigation section.
     * Ignored if the #secondary-title slot is used.
     */
    secondaryTitle: {
      type: String,
      default: ''
    },
    /**
     * Styling variant based on background color and text contrast.
     * - 'light': White background, gray border, dark text, indigo active state.
     * - 'dark': Dark gray background, light text, gray active state.
     * - 'brand': Brand color (e.g., indigo) background, white/light text.
     */
    variant: {
      type: String,
      default: 'light',
      validator: (value) => ['light', 'dark', 'brand'].includes(value)
    },
    /**
     * Source URL for the logo image.
     * Ignored if the #logo slot is used.
     */
    logoSrc: {
      type: String,
      default: ''
    },
    /**
     * Alt text for the logo image.
     */
    logoAlt: {
      type: String,
      default: 'Logo'
    },
    /**
     * Enable expandable sections for items with children.
     * Note: Requires specific data structure and slot implementation.
     */
    expandable: {
        type: Boolean,
        default: false
    },
    /**
     * Custom classes for the main outer container div.
     */
    containerClass: {
        type: String,
        default: ''
    },
    /**
     * Custom classes for the inner <nav> element.
     */
    navClass: {
        type: String,
        default: 'flex flex-1 flex-col'
    },
    /**
     * Custom classes for the logo container div.
     */
    logoContainerClass: {
        type: String,
        default: 'flex h-16 shrink-0 items-center'
    }
  },
  emits: ['item-click'],
  setup(props, { emit }) {
    const expandedSections = ref({}); // State for expandable sections

    // Toggle expansion state for an item
    const toggleExpand = (itemId) => {
        if (!props.expandable) return;
        expandedSections.value[itemId] = !expandedSections.value[itemId];
    };

    // --- Computed classes based on variant --- 

    const outerContainerClasses = computed(() => {
       const base = ['flex grow flex-col gap-y-5 overflow-y-auto px-6'];
       switch(props.variant) {
            case 'dark': base.push('bg-gray-900'); break;
            case 'brand': base.push('bg-indigo-600'); break;
            case 'light': 
            default: base.push('bg-white border-r border-gray-200'); break;
       }
       if (props.containerClass) base.push(props.containerClass);
       return base.join(' ');
    });

    const primaryItemClasses = (item) => {
        const base = 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold';
        let colors = '';
        if (item.current) {
            switch(props.variant) {
                case 'dark': colors = 'bg-gray-800 text-white'; break;
                case 'brand': colors = 'bg-indigo-700 text-white'; break;
                case 'light': 
                default: colors = 'bg-gray-50 text-indigo-600'; break;
            }
        } else {
             switch(props.variant) {
                case 'dark': colors = 'text-gray-400 hover:bg-gray-800 hover:text-white'; break;
                case 'brand': colors = 'text-indigo-200 hover:bg-indigo-700 hover:text-white'; break;
                case 'light': 
                default: colors = 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'; break;
            }
        }
        return [base, colors].join(' ');
    };
    
    const secondaryItemClasses = (item) => {
         const base = 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold';
         let colors = '';
         if (item.current) {
             switch(props.variant) {
                 case 'dark': colors = 'bg-gray-800 text-white'; break;
                 case 'brand': colors = 'bg-indigo-700 text-white'; break;
                 case 'light': 
                 default: colors = 'bg-gray-50 text-indigo-600'; break;
             }
         } else {
             switch(props.variant) {
                 case 'dark': colors = 'text-gray-400 hover:bg-gray-800 hover:text-white'; break;
                 case 'brand': colors = 'text-indigo-200 hover:bg-indigo-700 hover:text-white'; break;
                 case 'light': 
                 default: colors = 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'; break;
             }
         }
         return [base, colors].join(' ');
    };

    const iconClasses = (item) => {
      const base = 'size-6 shrink-0';
      let color = '';
      if (item.current) {
          color = props.variant === 'brand' || props.variant === 'dark' ? 'text-white' : 'text-indigo-600';
      } else {
          color = props.variant === 'brand' ? 'text-indigo-200 group-hover:text-white' : (props.variant === 'dark' ? 'text-gray-400 group-hover:text-white' : 'text-gray-400 group-hover:text-indigo-600');
      }
      return [base, color].join(' ');
    };

    const badgeClasses = (item) => {
      const base = 'ml-auto w-9 min-w-max rounded-full px-2.5 py-0.5 text-center text-xs/5 font-medium whitespace-nowrap';
      let colors = '';
       switch(props.variant) {
          case 'dark': colors = 'bg-gray-900 text-white ring-1 ring-gray-700 ring-inset'; break;
          case 'brand': colors = 'bg-indigo-600 text-white ring-1 ring-indigo-500 ring-inset'; break;
          case 'light': 
          default: colors = 'bg-white text-gray-600 ring-1 ring-gray-200 ring-inset'; break;
      }
      return [base, colors].join(' ');
    };
    
    const secondaryTitleClasses = computed(() => {
         const base = 'text-xs/6 font-semibold';
         const color = props.variant === 'brand' ? 'text-indigo-200' : 'text-gray-400';
         return [base, color].join(' ');
    });
    
    const initialBoxClasses = (item) => {
        const base = 'flex size-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium';
        let colors = '';
         if (item.current) {
             switch(props.variant) {
                 case 'dark': colors = 'border-gray-700 bg-gray-800 text-white'; break; // Adjusted for dark current
                 case 'brand': colors = 'border-indigo-400 bg-indigo-500 text-white'; break;
                 case 'light': 
                 default: colors = 'border-indigo-600 bg-white text-indigo-600'; break;
             }
         } else {
              switch(props.variant) {
                 case 'dark': colors = 'border-gray-700 bg-gray-800 text-gray-400 group-hover:text-white'; break;
                 case 'brand': colors = 'border-indigo-400 bg-indigo-500 text-indigo-200 group-hover:text-white'; break;
                 case 'light': 
                 default: colors = 'border-gray-200 bg-white text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600'; break;
             }
         }
        return [base, colors].join(' ');
    };
    
    // Expandable section icon class
    const expandIconClasses = (isOpen) => {
        return [
            'size-5 shrink-0 transition-transform duration-200 ease-in-out',
            isOpen ? 'rotate-90 text-gray-500' : 'text-gray-400',
            props.variant === 'dark' || props.variant === 'brand' ? (isOpen ? 'text-gray-300' : 'text-gray-400') : ''
        ].join(' ');
    };
    
    const subItemClasses = (subItem) => {
      const base = 'block rounded-md py-2 pr-2 pl-9 text-sm/6';
      let colors = '';
      if (subItem.current) {
          // Assuming sub-item current state doesn't change bg dramatically
          colors = props.variant === 'dark' || props.variant === 'brand' ? 'bg-gray-800/50 text-white' : 'bg-gray-50 text-gray-800';
      } else {
           colors = props.variant === 'dark' || props.variant === 'brand' ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white' : 'text-gray-700 hover:bg-gray-50';
      }
      return [base, colors].join(' ');
    };

    const handleItemClick = (item, event) => {
        if (props.expandable && item.children && item.children.length > 0) {
            event.preventDefault(); // Prevent navigation for expandable items
            toggleExpand(item.id || item.name);
        } else {
           emit('item-click', item);
        }
    };

    return {
      expandedSections,
      toggleExpand,
      outerContainerClasses,
      primaryItemClasses,
      secondaryItemClasses,
      iconClasses,
      badgeClasses,
      secondaryTitleClasses,
      initialBoxClasses,
      expandIconClasses,
      subItemClasses,
      handleItemClick
    };
  },
  template: `
    <div :class="outerContainerClasses">
      <!-- Logo Slot -->
      <div :class="logoContainerClass">
        <slot name="logo">
          <img v-if="logoSrc" class="h-8 w-auto" :src="logoSrc" :alt="logoAlt" />
          <!-- Default placeholder if no logoSrc -->
          <div v-else class="h-8 w-auto flex items-center justify-center text-lg font-bold" :class="variant === 'dark' || variant === 'brand' ? 'text-white' : 'text-gray-800'">Logo</div>
        </slot>
      </div>

      <!-- Navigation -->
      <nav :class="navClass" :aria-label="ariaLabel">
        <ul role="list" class="flex flex-1 flex-col gap-y-7">
          <!-- Primary Navigation Section -->
          <li>
            <ul role="list" class="-mx-2 space-y-1">
              <li v-for="item in navigationItems" :key="item.id || item.name">
                <!-- Non-expandable Item -->
                <a v-if="!expandable || !(item.children && item.children.length > 0)"
                   :href="item.href || '#'"
                   :class="primaryItemClasses(item)"
                   @click="handleItemClick(item, $event)"
                   :aria-current="item.current ? 'page' : undefined">
                     <slot name="primary-item-content" :item="item">
                        <i v-if="item.icon" :class="[item.icon, iconClasses(item)]" aria-hidden="true"></i>
                        <span class="truncate">{{ item.name }}</span>
                        <span v-if="item.count != null" :class="badgeClasses(item)" aria-hidden="true">
                          {{ item.count }}
                        </span>
                     </slot>
                </a>
                <!-- Expandable Item Button -->
                <button v-else
                    type="button"
                    :class="primaryItemClasses(item) + ' w-full text-left'"
                    @click="handleItemClick(item, $event)"
                    :aria-controls="'sub-menu-' + (item.id || item.name)"
                    :aria-expanded="expandedSections[item.id || item.name]">
                    <slot name="primary-item-content" :item="item">
                         <i v-if="item.icon" :class="[item.icon, iconClasses(item)]" aria-hidden="true"></i>
                         <span class="flex-1 truncate">{{ item.name }}</span>
                         <i class="fas fa-chevron-right" :class="expandIconClasses(expandedSections[item.id || item.name])" aria-hidden="true"></i>
                    </slot>
                </button>
                <!-- Expandable Item Panel -->
                <ul v-if="expandable && item.children && item.children.length > 0 && expandedSections[item.id || item.name]"
                    class="mt-1 px-2 space-y-1"
                    :id="'sub-menu-' + (item.id || item.name)">
                    <li v-for="subItem in item.children" :key="subItem.id || subItem.name">
                        <a :href="subItem.href || '#'"
                           :class="subItemClasses(subItem)"
                           @click="handleItemClick(subItem, $event)"
                           :aria-current="subItem.current ? 'page' : undefined">
                           {{ subItem.name }}
                        </a>
                    </li>
                </ul>
              </li>
            </ul>
          </li>

          <!-- Secondary Navigation Section -->
          <li v-if="secondaryNavigationItems.length > 0">
             <slot name="secondary-title" :title="secondaryTitle">
                 <div v-if="secondaryTitle" :class="secondaryTitleClasses">{{ secondaryTitle }}</div>
             </slot>
             <ul role="list" class="-mx-2 mt-2 space-y-1">
               <li v-for="item in secondaryNavigationItems" :key="item.id || item.name">
                 <slot name="item" :item="item" :depth="1">
                   <a :href="item.href || '#'"
                      :class="secondaryItemClasses(item)"
                      @click="handleItemClick(item, $event)"
                      :aria-current="item.current ? 'page' : undefined">
                      <slot name="secondary-item-content" :item="item">
                         <span v-if="item.initial" :class="initialBoxClasses(item)">{{ item.initial }}</span>
                         <span class="truncate">{{ item.name }}</span>
                      </slot>
                   </a>
                 </slot>
               </li>
             </ul>
          </li>
          
          <!-- Footer Slot -->
          <li class="mt-auto -mx-6" v-if="$slots.footer">
             <slot name="footer"></slot>
          </li>
        </ul>
      </nav>
    </div>
  `
}; 