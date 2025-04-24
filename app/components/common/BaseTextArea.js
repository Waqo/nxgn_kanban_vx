export default {
  name: 'BaseTextArea',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    rows: {
      type: Number,
      default: 4
    },
    id: {
        type: String,
        default: () => `textarea-${Math.random().toString(36).substring(2, 9)}`
    },
    name: {
        type: String,
        default: 'textarea'
    },
    disabled: {
        type: Boolean,
        default: false
    }
  },
  emits: ['update:modelValue'],
  methods: {
    handleInput(event) {
      this.$emit('update:modelValue', event.target.value);
    }
  },
  template: `
    <div>
      <label v-if="label" :for="id" class="block text-sm font-medium leading-6 text-gray-900">{{ label }}</label>
      <div class="mt-1">
        <textarea 
            :rows="rows" 
            :name="name" 
            :id="id" 
            :class="[
                'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400',
                'focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6',
                disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500 ring-gray-200' : 'bg-white'
            ]" 
            :placeholder="placeholder"
            :value="modelValue"
            @input="handleInput"
            :disabled="disabled"
        />
      </div>
    </div>
  `
}; 