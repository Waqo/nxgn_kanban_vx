export default {
  name: 'BaseStackedList',
  props: {
    // Expects array of objects like: [{ label: 'Label', value: 'Value' }]
    items: {
      type: Array,
      required: true,
      default: () => []
    },
    itemKey: {
      type: String,
      required: true
    }
  },
  template: `
    <ul class="divide-y divide-gray-100">
      <li v-for="item in items" :key="item[itemKey]" class="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <slot :item="item"></slot>
      </li>
    </ul>
  `
};