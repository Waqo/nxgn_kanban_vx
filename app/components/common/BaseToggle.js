export default {
  name: 'BaseToggle',
  props: {
    modelValue: { // Used for v-model
      type: Boolean,
      default: false,
    },
    // Optional: Add props for labels, disabled state, custom colors etc. later
    // label: { type: String, default: '' },
    // disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  methods: {
    toggle() {
      // Emit the inverse of the current value
      this.$emit('update:modelValue', !this.modelValue);
    },
  },
  // Define the template inline
  template: `
      <button
        type="button"
        @click="toggle"
        :class="[modelValue ? 'bg-blue-600' : 'bg-gray-200', 'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2']"
        role="switch"
        :aria-checked="modelValue.toString()"
      >
        <span class="sr-only">Use setting</span>
        <span
          aria-hidden="true"
          :class="[modelValue ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out']"
        ></span>
      </button>
    `
};

// Remove global exposure
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseToggle = BaseToggle; 

// Add default export
