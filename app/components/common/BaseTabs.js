export default {
  name: 'BaseTabs',
  props: {
    // Array of tab objects, e.g., [{ name: 'Tab 1', id: 'tab1' }, { name: 'Tab 2', id: 'tab2' }]
    tabs: {
      type: Array,
      required: true,
      validator: (arr) => arr.every(t => typeof t === 'object' && t.name && t.id)
    },
    // Use v-model:modelValue="currentTabVariable" in parent
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue'],
  methods: {
    changeTab(tabId) {
      this.$emit('update:modelValue', tabId);
    }
  },
  template: `
    <div>
      <!-- Mobile Select (Hidden on sm and up) -->
      <div class="sm:hidden">
        <label for="tabs" class="sr-only">Select a tab</label>
        <select 
          id="tabs" 
          name="tabs" 
          class="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
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
      </div>

      <!-- Desktop Tabs (Hidden below sm) -->
      <div class="hidden sm:block">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-4" aria-label="Tabs">
            <a v-for="tab in tabs" 
               :key="tab.id" 
               href="#" 
               :class="[
                 tab.id === modelValue 
                   ? 'border-blue-500 text-blue-600' 
                   : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700', 
                 'whitespace-nowrap border-b-2 py-4 px-1 text-xs font-medium'
               ]" 
               :aria-current="tab.id === modelValue ? 'page' : undefined"
               @click.prevent="changeTab(tab.id)"
               >
              {{ tab.name }}
              <!-- Optional slot for count/badge -->
              <slot :name="'tab-label-' + tab.id" :tab="tab"></slot>
            </a>
          </nav>
        </div>
      </div>
      
      <!-- Slot for tab content -->
      <div class="tab-content">
        <slot></slot>
      </div>
    </div>
  `
}; 