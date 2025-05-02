const { computed } = Vue;

export default {
  name: 'BaseTabs',
  props: {
    /**
     * Array of tab objects.
     * Expected shape: { id: string, name: string, href?: string, icon?: string, count?: string|number, current?: boolean (optional, controlled by modelValue) }
     */
    tabs: {
      type: Array,
      required: true,
      validator: (arr) => arr.every(t => typeof t === 'object' && t.name && t.id !== undefined)
    },
    /**
     * The id of the currently active tab. Use v-model:modelValue="currentTabId".
     */
    modelValue: {
      type: [String, Number],
      required: true
    },
    /**
     * Visual style variant for the tabs.
     * - 'underline': Default style with bottom border on active tab.
     * - 'pills': Rounded background on active tab.
     * - 'bar': Isolated bar with active underline indicator.
     * - 'full-width-underline': Underline style where tabs fill container width.
     */
    variant: {
        type: String,
        default: 'underline',
        validator: (value) => ['underline', 'pills', 'bar', 'full-width-underline'].includes(value)
    },
    /**
     * Color theme for the 'pills' variant's active state.
     * - 'gray': Uses gray background.
     * - 'brand': Uses brand color (e.g., indigo) background.
     */
    pillsColor: {
        type: String,
        default: 'gray',
        validator: (value) => ['gray', 'brand'].includes(value)
    },
     /**
     * Custom class for the container element.
     */
    className: {
        type: String,
        default: ''
    }
  },
  emits: ['update:modelValue', 'tab-click'],
  setup(props, { emit }) {

    const changeTab = (tabId) => {
      emit('update:modelValue', tabId);
      // Find the tab object to emit it as well
      const tab = props.tabs.find(t => t.id === tabId);
      if (tab) {
          emit('tab-click', tab);
      }
    };

    // --- Computed classes --- 

    const navContainerClasses = computed(() => {
       const classes = ['hidden sm:block'];
       if (props.variant === 'underline' || props.variant === 'full-width-underline') {
           classes.push('border-b border-gray-200');
       }
       if (props.className) {
           classes.push(props.className);
       }
       return classes.join(' ');
    });
    
    const navListClasses = computed(() => {
        const classes = ['flex', 'overflow-x-auto', 'scrollbar-hide'];
        if (props.variant === 'underline') {
            classes.push('-mb-px', 'space-x-6');
        } else if (props.variant === 'pills') {
             classes.push('space-x-4');
        } else if (props.variant === 'bar') {
             classes.push('isolate', 'divide-x', 'divide-gray-200', 'rounded-lg', 'shadow-sm');
        } else if (props.variant === 'full-width-underline') {
             classes.push('-mb-px');
        }
        return classes.join(' ');
    });

    const getTabItemClasses = (tab) => {
        const isCurrent = tab.id === props.modelValue;
        const base = ['group relative text-xs font-medium focus:z-10'];
        const layout = [];
        const colors = [];

        // Determine layout and base padding/structure
        if (props.variant === 'underline') {
            layout.push('inline-flex items-center border-b-2 px-1 py-4');
        } else if (props.variant === 'pills') {
            layout.push('inline-flex items-center rounded-md px-3 py-2');
        } else if (props.variant === 'bar') {
            layout.push('relative min-w-0 flex-1 overflow-hidden px-4 py-4 text-center focus:z-10');
            // Add rounding for first/last items in bar
            const tabIndex = props.tabs.findIndex(t => t.id === tab.id);
            if (tabIndex === 0) layout.push('rounded-l-lg');
            if (tabIndex === props.tabs.length - 1) layout.push('rounded-r-lg');
        } else if (props.variant === 'full-width-underline') {
            layout.push('flex-1 border-b-2 px-1 py-4 text-center'); // Use flex-1 for distribution
        }
        
        // Determine colors and active state styling
        if (props.variant === 'underline' || props.variant === 'full-width-underline') {
            if (isCurrent) {
                colors.push('border-blue-500 text-blue-600');
            } else {
                colors.push('border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700');
            }
        } else if (props.variant === 'pills') {
             if (isCurrent) {
                 colors.push(props.pillsColor === 'brand' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700');
             } else {
                 colors.push('text-gray-500 hover:text-gray-700');
             }
        } else if (props.variant === 'bar') {
             base.push('bg-white'); // Bar items always have white background
             if (isCurrent) {
                 colors.push('text-gray-900'); // Active text color for bar
             } else {
                 colors.push('text-gray-500 hover:text-gray-700 hover:bg-gray-50');
             }
        }

        return [...base, ...layout, ...colors].join(' ');
    };

    // Specific classes for the active underline span in the 'bar' variant
    const getBarUnderlineClasses = (tab) => {
        if (props.variant !== 'bar') return [];
        const isCurrent = tab.id === props.modelValue;
        return [
            'absolute inset-x-0 bottom-0 h-0.5',
            isCurrent ? 'bg-blue-500' : 'bg-transparent'
        ].join(' ');
    };
    
    // Icon classes (adjust size/margin as needed)
    const getIconClasses = (tab) => {
       const isCurrent = tab.id === props.modelValue;
       const base = ['fas', tab.icon, 'mr-2 -ml-0.5 size-5']; // Assuming Font Awesome
       if (props.variant === 'underline' || props.variant === 'full-width-underline') {
           if (isCurrent) {
               base.push('text-blue-500');
           } else {
               base.push('text-gray-400 group-hover:text-gray-500');
           }
       } else {
           // Adjust icon color for other variants if needed
           base.push(isCurrent ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500');
       }
       return base.join(' ');
    };
    
    // Badge classes
    const getBadgeClasses = (tab) => {
         const isCurrent = tab.id === props.modelValue;
          // Example classes - adjust as needed based on your BaseBadge or direct styling
         const base = ['ml-3 hidden rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block'];
         if (isCurrent) {
             base.push('bg-blue-100 text-blue-600');
         } else {
             base.push('bg-gray-100 text-gray-900');
         }
         return base.join(' ');
    };

    return {
      changeTab,
      navContainerClasses,
      navListClasses,
      getTabItemClasses,
      getBarUnderlineClasses,
      getIconClasses,
      getBadgeClasses
    };
  },
  template: `
    <div>
      <!-- Mobile Select -->
      <div class="grid grid-cols-1 sm:hidden">
        <label for="tabs" class="sr-only">Select a tab</label>
        <!-- Use an "onChange" listener to redirect the user OR update modelValue -->
        <select 
          id="tabs" 
          name="tabs" 
          class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600" 
          @change="changeTab($event.target.value)"
          >
          <option 
            v-for="tab in tabs" 
            :key="tab.id" 
            :value="tab.id"
            :selected="tab.id === modelValue">
            {{ tab.name }}
            </option>
        </select>
        <i class="fas fa-chevron-down pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500" aria-hidden="true"></i>
      </div>

      <!-- Desktop Tabs -->
      <div :class="navContainerClasses">
        <nav :class="navListClasses" aria-label="Tabs">
          <a v-for="(tab, tabIdx) in tabs" 
               :key="tab.id" 
             :href="tab.href || '#'" 
             :class="getTabItemClasses(tab)"
               :aria-current="tab.id === modelValue ? 'page' : undefined"
               @click.prevent="changeTab(tab.id)"
               >
            <!-- Icon (if provided) -->
            <i v-if="tab.icon" :class="getIconClasses(tab)" aria-hidden="true"></i>
            <!-- Label -->
            <span>{{ tab.name }}</span>
            <!-- Count/Badge (if provided) -->
            <span v-if="tab.count != null" :class="getBadgeClasses(tab)">
              {{ tab.count }}
            </span>
            <!-- Underline span for 'bar' variant -->
            <span v-if="variant === 'bar'" aria-hidden="true" :class="getBarUnderlineClasses(tab)" />
            <!-- Optional slot for further customization -->
              <slot :name="'tab-label-' + tab.id" :tab="tab"></slot>
            </a>
          </nav>
      </div>
      
      <!-- Slot for tab content -->
      <div class="tab-content">
        <slot></slot>
      </div>
    </div>
  `
}; 