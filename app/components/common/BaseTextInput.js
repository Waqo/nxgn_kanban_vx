export default {
  name: 'BaseTextInput',
  props: {
    modelValue: {
      type: [String, Number],
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
    type: {
        type: String,
        default: 'text' // text, email, password, number, etc.
    },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    trailingIconClass: {
        type: String,
        default: null
    },
    // Add props for leading/trailing icons, errors later if needed
  },
  emits: ['update:modelValue'],
  methods: {
    handleInput(event) {
      this.$emit('update:modelValue', event.target.value);
    }
  },
  computed: {
      inputPaddingClass() {
          return this.trailingIconClass ? 'pr-10' : 'pr-3';
      }
  },
  template: `
    <div class="base-text-input">
        <label v-if="label" :for="$attrs.id || 'input-' + $attrs.name" class="block text-sm font-medium leading-6 text-gray-900 mb-1">{{ label }}</label>
        <div class="relative rounded-md shadow-sm"> 
            <!-- Input field -->
            <input 
                :type="type" 
                :name="$attrs.name" 
                :id="$attrs.id || 'input-' + $attrs.name" 
                :value="modelValue" 
                @input="handleInput"
                :placeholder="placeholder"
                :required="required"
                :disabled="disabled"
                v-bind="$attrs" 
                :class="[
                    'block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-50 disabled:cursor-not-allowed',
                    inputPaddingClass,
                    label ? 'pl-3' : 'pl-3'
                ]"
            />
            <!-- Trailing icon container -->
            <div v-if="trailingIconClass" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                 <i :class="[trailingIconClass, 'h-5 w-5']" aria-hidden="true"></i>
            </div>
        </div>
        <!-- Add help/error text slot later -->
    </div>
  `
}; 