export default {
    name: 'BaseTable',
    props: {
      // Array of objects for table headers, e.g., [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }]
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
      }
    },
    emits: ['addItem', 'editItem'], // Add 'editItem' later if needed
    methods: {
      getItemValue(item, header) {
        // Allows nested keys like 'contact.name' using dot notation
        const keys = header.key.split('.');
        const value = keys.reduce((o, k) => (o || {})[k], item);
        // Add log to see what's happening
  
        return value;
      },
      onAddItemClick() {
          this.$emit('addItem');
      },
      onEditItemClick(item) {
          // Pass the whole item when emitting edit
          this.$emit('editItem', item);
      }
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
        <div class="flow-root">
          <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table class="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th v-for="header in headers" 
                        :key="header.key" 
                        scope="col" 
                        :class="['py-3.5 text-left text-sm font-semibold text-gray-900', header.key === headers[0].key ? 'pl-4 sm:pl-0' : 'px-3']">
                        {{ header.label }}
                    </th>
                    <!-- Optional: Slot for action header -->
                    <th v-if="$slots.actionsHeader" scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <slot name="actionsHeader"><span class="sr-only">Actions</span></slot>
                    </th>
                     <th v-else-if="$listeners && $listeners.editItem" scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-0">
                         <span class="sr-only">Edit</span>
                     </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="(item, index) in items" :key="item.id || index">
                    <td v-for="(header, hIndex) in headers" 
                        :key="header.key" 
                        :class="['whitespace-nowrap py-4 text-sm text-gray-500', header.key === headers[0].key ? 'pl-4 pr-3 font-medium text-gray-900 sm:pl-0' : 'px-3']">
                        <!-- Default rendering -->
                        <slot :name="'cell(' + header.key + ')'" :item="item" :value="getItemValue(item, header)">
                            {{ getItemValue(item, header) }}
                        </slot>
                    </td>
                    <!-- Optional: Slot for action buttons/links -->
                     <td v-if="$slots.actions || ($listeners && $listeners.editItem)" class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                         <slot name="actions" :item="item">
                             <!-- Default Edit action if handler exists -->
                             <a v-if="$listeners && $listeners.editItem" href="#" @click.prevent="onEditItemClick(item)" class="text-blue-600 hover:text-blue-900">
                                 Edit<span class="sr-only">, {{ getItemValue(item, headers[0]) }}</span>
                             </a>
                         </slot>
                     </td>
                  </tr>
                  <!-- Empty state row -->
                  <tr v-if="items.length === 0">
                      <td :colspan="headers.length + (($slots.actions || ($listeners && $listeners.editItem)) ? 1 : 0)" class="px-3 py-4 text-center text-sm text-gray-500">
                           <slot name="empty">No items to display.</slot>
                       </td>
                   </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `
  }; 