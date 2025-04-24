export default {
  name: 'BaseStackedList',
  props: {
    // Expects array of objects like: [{ label: 'Label', value: 'Value' }]
    items: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  template: `
    <dl class="divide-y divide-gray-100">
      <div v-for="item in items" :key="item.label" class="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt class="text-sm font-medium leading-6 text-gray-900">{{ item.label }}</dt>
        <dd class="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">{{ item.value }}</dd>
      </div>
    </dl>
  `
}; 