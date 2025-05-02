const { computed, ref } = Vue;

export default {
    name: 'BaseTable',
    props: {
      // Array of objects for table headers
      // Example: { key: 'name', label: 'Name', sortable: true, alignRight: false, hiddenOn: 'sm', visibleFrom: 'md' }
      headers: {
        type: Array,
        required: true,
        validator: (arr) => arr.every(h => typeof h === 'object' && h.key && h.label)
      },
      // Array of data objects corresponding to headers
      items: {
        type: Array,
        required: true
      },
      // Optional: Add title and description for the table section
      title: {
        type: String,
        default: ''
      },
      description: {
        type: String,
        default: ''
      },
      // Optional: Allow adding a button in the header
      showAddButton: {
          type: Boolean,
          default: false
      },
      addButtonLabel: {
          type: String,
          default: 'Add item'
      },
      // Sorting props
      sortBy: {
        type: String,
        default: ''
      },
      sortDirection: {
        type: String,
        default: 'asc',
        validator: val => ['asc', 'desc'].includes(val)
      },
      // Whether initial sorting should be applied to the displayed data
      applySort: {
        type: Boolean,
        default: true
      },
      // Item key for unique identification
      itemKey: {
        type: String,
        default: 'id'
      },
      // Loading state
      loading: {
        type: Boolean,
        default: false
      },
      // Empty state message
      emptyMessage: {
        type: String,
        default: 'No items to display'
      },
      // Styling variant
      variant: {
        type: String,
        default: 'default',
        validator: (value) => [
          'default',       // Standard table
          'card',          // Wrapped in a card with header bg
          'striped',       // Striped rows
          'bordered',      // Border around the table
          'condensed',     // Less padding
          'full-width',    // Specific padding for full width
          'full-constrained' // Specific padding/borders for full width constrained
        ].includes(value)
      },
      // Header style variant
      headerStyle: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'uppercase', 'light-gray'].includes(value)
      },
      // Vertical lines between columns
      verticalLines: {
        type: Boolean,
        default: false
      },
      // Sticky header
      stickyHeader: {
        type: Boolean,
        default: false
      }
    },
    emits: ['addItem', 'editItem', 'update:sortBy', 'update:sortDirection', 'rowClick'],
    setup(props, { emit }) {
      // Computed property for sorted items
      const sortedItems = computed(() => {
        if (!props.applySort || !props.sortBy) {
          return props.items;
        }
        
        return [...props.items].sort((a, b) => {
          const aValue = getItemValue(a, props.sortBy);
          const bValue = getItemValue(b, props.sortBy);
          
          // Default comparison
          const defaultCompare = () => {
            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            
            return String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
          };
          
          // Handle different data types
          let result;
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            result = aValue - bValue;
          } else if (aValue instanceof Date && bValue instanceof Date) {
            result = aValue.getTime() - bValue.getTime();
          } else {
            result = defaultCompare();
          }
          
          return props.sortDirection === 'desc' ? -result : result;
        });
      });
      
      // Function to get nested property value from an item
      const getItemValue = (item, key) => {
        // Allows nested keys like 'contact.name' using dot notation
        const keys = key.split('.');
        return keys.reduce((o, k) => (o || {})[k], item);
      };
      
      // Function to handle sort change
      const handleSort = (header) => {
        if (!header.sortable) return;
        
        if (props.sortBy === header.key) {
          // Toggle direction
          const newDirection = props.sortDirection === 'asc' ? 'desc' : 'asc';
          emit('update:sortDirection', newDirection);
        } else {
          // Change sort field
          emit('update:sortBy', header.key);
          emit('update:sortDirection', 'asc'); // Default to ascending
        }
      };
      
      // Get sort icon class based on current sort status
      const getSortIconClass = (header) => {
        if (!header.sortable) return '';
        
        if (props.sortBy === header.key) {
          return props.sortDirection === 'asc' 
            ? 'fas fa-sort-up text-blue-600' 
            : 'fas fa-sort-down text-blue-600';
        }
        
        return 'fas fa-sort text-gray-400';
      };
      
      // Handler for edit item
      const onEditItemClick = (item) => {
        emit('editItem', item);
      };
      
      // Handler for row click
      const onRowClick = (item, event) => {
        // Only emit if not clicking a button or link inside the row
        if (event.target.tagName !== 'BUTTON' && 
            event.target.tagName !== 'A' && 
            !event.target.closest('button') && 
            !event.target.closest('a')) {
          emit('rowClick', item);
        }
      };
      
      // Handler for add item
      const onAddItemClick = () => {
        emit('addItem');
      };

      // --- New Computed Classes for Styling --- 

      const wrapperClasses = computed(() => {
        const classes = ['flow-root'];
        if (props.variant === 'card') {
          classes.push('-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8');
        } else if (props.variant === 'bordered') {
          classes.push('-mx-4 ring-1 ring-gray-300 sm:mx-0 sm:rounded-lg');
        } else if (props.variant === 'full-constrained') {
           classes.push('flow-root overflow-hidden'); // Specific for this variant
        }
        return classes.join(' ');
      });

      const innerDivClasses = computed(() => {
          const classes = ['inline-block min-w-full align-middle'];
          if (props.variant === 'card' || props.variant === 'default') {
              classes.push('py-2 sm:px-6 lg:px-8');
          }
           if (props.variant === 'full-constrained') {
              classes.push('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'); 
          }
          return classes.join(' ');
      });

      const tableClasses = computed(() => {
          const classes = ['min-w-full'];
          if (props.variant !== 'card') { // Card handles its own border/divide
              classes.push('divide-y divide-gray-300');
          }
          if (props.stickyHeader) {
              classes.push('border-separate border-spacing-0'); // Needed for sticky header
          }
          if (props.variant === 'full-constrained') {
              classes.push('w-full text-left'); // Specific for this variant
          }
          return classes.join(' ');
      });

      const theadClasses = computed(() => {
          const classes = [];
          if (props.variant === 'card') {
              classes.push('bg-gray-50');
          } else if (props.variant === 'full-constrained') {
              classes.push('bg-white');
          }
          if (props.headerStyle === 'light-gray') {
              classes.push('bg-gray-50');
          }
          // Add other potential header bg styles based on props
          return classes.join(' ');
      });

      const tbodyClasses = computed(() => {
          const classes = ['divide-y'];
          if (props.variant === 'card') {
              classes.push('divide-gray-200 bg-white');
          }
          if (props.variant === 'full-constrained') {
              // Special border handling is done on cells for this variant
              classes.push('divide-none'); // Don't divide body itself
          } else {
              classes.push('divide-gray-200 bg-white');
          }
          // Add other potential body bg styles
          return classes.join(' ');
      });

      const thClasses = (header, index) => {
          const classes = [
              'py-3.5 text-left text-sm font-semibold text-gray-900',
              props.variant === 'condensed' ? 'px-2 py-2' : 'py-3.5', // Condensed padding
          ];
          
          // Padding based on position and variant
          if (props.verticalLines) {
              classes.push('px-4'); // Uniform padding for vertical lines
          } else if (props.variant === 'full-width') {
               classes.push(index === 0 ? 'pl-4 pr-3 sm:pl-6 lg:pl-8' : 'px-3');
          } else if (props.variant === 'full-constrained') {
               classes.push('relative isolate pr-3'); // Specific padding for full-constrained
          } else {
              classes.push(index === 0 ? 'pl-4 pr-3 sm:pl-0' : 'px-3');
          }

          if (header.alignRight) classes.push('text-right');
          if (header.sortable) classes.push('cursor-pointer group'); // Group for sort icon hover

          // Header styles
          if (props.headerStyle === 'uppercase') {
              classes.push('text-xs font-medium tracking-wide text-gray-500 uppercase');
          }

          // Sticky Header
          if (props.stickyHeader) {
              classes.push('sticky top-0 z-10 border-b border-gray-300 bg-white/75 backdrop-blur-sm backdrop-filter');
          }
          
          // Hidden columns
          if (header.hiddenOn) {
              classes.push(`hidden ${header.hiddenOn}:table-cell`);
          }
          if (header.visibleFrom) {
              classes.push(`hidden ${header.visibleFrom}:table-cell`);
          }
          
          return classes.join(' ');
      };

      const trClasses = (item, index) => {
          const classes = ['hover:bg-gray-50 cursor-pointer'];
          if (props.variant === 'striped') {
              classes.push('even:bg-gray-50');
          }
          if (props.verticalLines) {
              classes.push('divide-x divide-gray-200');
          }
           if (props.variant === 'full-constrained') {
               // No specific row classes needed, handled by cells
           }
          return classes.join(' ');
      };

      const tdClasses = (header, index, item, itemIndex) => {
          const classes = [
              'whitespace-nowrap text-sm text-gray-500',
              props.variant === 'condensed' ? 'px-2 py-2' : 'py-4',
          ];

           // Padding based on position and variant
          if (props.verticalLines) {
              classes.push('p-4'); // Uniform padding
          } else if (props.variant === 'full-width') {
               classes.push(index === 0 ? 'pl-4 pr-3 sm:pl-6 lg:pl-8' : 'px-3');
          } else if (props.variant === 'full-constrained') {
               classes.push('relative pr-3 py-4'); // Specific padding for full-constrained
          } else {
              classes.push(index === 0 ? 'pl-4 pr-3 font-medium text-gray-900 sm:pl-0' : 'px-3');
          }

          if (header.alignRight) classes.push('text-right');
          
           // Sticky header border logic (applied to cells)
           if (props.stickyHeader && itemIndex !== props.items.length - 1) {
               classes.push('border-b border-gray-200');
           }

          // Hidden columns
          if (header.hiddenOn) {
              classes.push(`hidden ${header.hiddenOn}:table-cell`);
          }
          if (header.visibleFrom) {
              classes.push(`hidden ${header.visibleFrom}:table-cell`);
          }
          
          return classes.join(' ');
      };
      
       const actionTdClasses = (itemIndex) => {
           const classes = [
               'relative whitespace-nowrap text-right text-sm font-medium',
               props.variant === 'condensed' ? 'px-2 py-2' : 'py-4 pl-3 pr-4 sm:pr-0',
           ];
           if (props.stickyHeader && itemIndex !== props.items.length - 1) {
                classes.push('border-b border-gray-200');
           }
           if (props.verticalLines) {
               classes.push('p-4'); // Match padding
           }
           return classes.join(' ');
       };

       // Specific classes for full-constrained variant borders
       const fullConstrainedThBorderClass = 'absolute inset-y-0 right-full -z-10 w-screen border-b border-b-gray-200';
       const fullConstrainedThLeftBorderClass = 'absolute inset-y-0 left-0 -z-10 w-screen border-b border-b-gray-200';
       const fullConstrainedTdRightBorderClass = 'absolute right-full bottom-0 h-px w-screen bg-gray-100';
       const fullConstrainedTdLeftBorderClass = 'absolute bottom-0 left-0 h-px w-screen bg-gray-100';
      
      return {
        sortedItems,
        handleSort,
        getSortIconClass,
        getItemValue,
        onEditItemClick,
        onRowClick,
        onAddItemClick,
        // New computed classes
        wrapperClasses,
        innerDivClasses,
        tableClasses,
        theadClasses,
        tbodyClasses,
        thClasses,
        trClasses,
        tdClasses,
        actionTdClasses,
        fullConstrainedThBorderClass,
        fullConstrainedThLeftBorderClass,
        fullConstrainedTdRightBorderClass,
        fullConstrainedTdLeftBorderClass
      };
    },
    template: `
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="sm:flex sm:items-center mb-8">
          <div class="sm:flex-auto">
            <h1 v-if="title" class="text-base font-semibold leading-6 text-gray-900">{{ title }}</h1>
            <p v-if="description" class="mt-2 text-sm text-gray-700">{{ description }}</p>
          </div>
          <div v-if="showAddButton" class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <base-button 
                  variant="primary" 
                  size="md" 
                  :label="addButtonLabel"
                  @click="onAddItemClick"
              />
          </div>
        </div>
        <div :class="wrapperClasses">
          <div :class="innerDivClasses">
            <div :class="[variant === 'card' ? 'overflow-hidden shadow-sm ring-1 ring-black/5 sm:rounded-lg' : '']">
              <table :class="tableClasses">
                <thead :class="theadClasses">
                  <tr :class="[verticalLines ? 'divide-x divide-gray-200' : '']">
                    <th 
                      v-for="(header, index) in headers" 
                        :key="header.key" 
                        scope="col" 
                      :class="thClasses(header, index)"
                      @click="header.sortable && handleSort(header)"
                    >
                      <!-- Full constrained border elements -->
                      <div v-if="variant === 'full-constrained'" :class="fullConstrainedThBorderClass"></div>
                      <div v-if="variant === 'full-constrained' && index === 0" :class="fullConstrainedThLeftBorderClass"></div>
                      
                      <div :class="[header.sortable ? 'inline-flex items-center gap-1' : '']">
                        {{ header.label }}
                        <i 
                          v-if="header.sortable" 
                          :class="[getSortIconClass(header), 'ml-1']" 
                          aria-hidden="true"
                        ></i>
                         <!-- Example for sortable hover icon (more complex logic needed) -->
                         <!-- 
                         <span :class="['invisible ml-2 flex-none rounded-sm text-gray-400 group-hover:visible group-focus:visible']">
                            <i class="fas fa-chevron-down size-5"></i>
                         </span>
                         -->
                      </div>
                    </th>
                    
                    <!-- Optional: Slot for action header -->
                    <th v-if="$slots.actionsHeader" scope="col" :class="[stickyHeader ? 'sticky top-0 z-10 border-b border-gray-300 bg-white/75 backdrop-blur-sm backdrop-filter' : '', 'relative py-3.5 pl-3 pr-4 sm:pr-0']">
                      <slot name="actionsHeader"><span class="sr-only">Actions</span></slot>
                    </th>
                    <th v-else-if="$listeners && $listeners.editItem" scope="col" :class="[stickyHeader ? 'sticky top-0 z-10 border-b border-gray-300 bg-white/75 backdrop-blur-sm backdrop-filter' : '', 'relative py-3.5 pl-3 pr-4 sm:pr-0']">
                         <span class="sr-only">Edit</span>
                     </th>
                  </tr>
                </thead>
                <tbody :class="tbodyClasses">
                  <!-- Loading state -->
                  <tr v-if="loading">
                    <td :colspan="headers.length + ($slots.actionsHeader || ($listeners && $listeners.editItem) ? 1 : 0)" class="px-3 py-4 text-center text-sm text-gray-500">
                      <div class="flex justify-center items-center space-x-2">
                        <i class="fas fa-circle-notch fa-spin text-blue-500"></i>
                        <span>Loading data...</span>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Data rows -->
                  <template v-else>
                    <tr 
                      v-for="(item, itemIndex) in sortedItems" 
                      :key="item[itemKey] || item.id" 
                      :class="trClasses(item, itemIndex)"
                      @click="onRowClick(item, $event)"
                    >
                      <td 
                        v-for="(header, hIndex) in headers" 
                        :key="header.key" 
                        :class="tdClasses(header, hIndex, item, itemIndex)"
                      >
                         <!-- Full constrained border elements -->
                         <div v-if="variant === 'full-constrained'" :class="fullConstrainedTdRightBorderClass"></div>
                         <div v-if="variant === 'full-constrained' && hIndex === 0" :class="fullConstrainedTdLeftBorderClass"></div>
                        
                        <!-- Default rendering -->
                        <slot :name="'cell(' + header.key + ')'" :item="item" :value="getItemValue(item, header.key)">
                          {{ getItemValue(item, header.key) }}
                        </slot>
                    </td>
                      
                    <!-- Optional: Slot for action buttons/links -->
                      <td v-if="$slots.actions || ($listeners && $listeners.editItem)" :class="actionTdClasses(itemIndex)">
                         <slot name="actions" :item="item">
                             <!-- Default Edit action if handler exists -->
                             <a v-if="$listeners && $listeners.editItem" href="#" @click.prevent="onEditItemClick(item)" class="text-blue-600 hover:text-blue-900">
                              Edit<span class="sr-only">, {{ getItemValue(item, headers[0].key) }}</span>
                             </a>
                         </slot>
                     </td>
                  </tr>
                    
                  <!-- Empty state row -->
                    <tr v-if="sortedItems.length === 0">
                      <td :colspan="headers.length + ($slots.actionsHeader || ($listeners && $listeners.editItem) ? 1 : 0)" class="px-3 py-4 text-center text-sm text-gray-500">
                        <slot name="empty">{{ emptyMessage }}</slot>
                       </td>
                   </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `
  }; 