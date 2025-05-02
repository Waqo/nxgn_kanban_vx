const { computed, ref } = Vue;

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
    error: {
        type: String,
        default: null
    },
    // New prop for clearable input
    clearable: {
      type: Boolean,
      default: false
    },
    // New prop for customizing clear button icon
    clearIconClass: {
      type: String,
      default: 'fas fa-times-circle'
    },
    // Add props for leading/trailing icons, errors later if needed
  },
  emits: ['update:modelValue', 'clear'],
  setup(props, { emit }) {
    const inputRef = ref(null);
    
    const handleInput = (event) => {
      emit('update:modelValue', event.target.value);
    };
    
    const clearInput = () => {
      emit('update:modelValue', '');
      emit('clear');
      
      // Focus the input after clearing
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus();
        }
      });
    };
    
    const showClearButton = computed(() => {
      return props.clearable && 
             (props.modelValue !== null && props.modelValue !== '') && 
             !props.disabled;
    });
    
    const inputPaddingClass = computed(() => {
      if (props.trailingIconClass && !showClearButton.value) {
        return 'pr-10';
      } else if (showClearButton.value) {
        return 'pr-10';
      }
      return 'pr-3';
    });
    
    const inputRingClasses = computed(() => {
      if (props.error) {
        return 'ring-red-300 focus:ring-red-500';
      } else {
        return 'ring-gray-300 focus:ring-indigo-600';
      }
    });
    
    return {
      inputRef,
      handleInput,
      clearInput,
      showClearButton,
      inputPaddingClass,
      inputRingClasses
    };
  },
  template: `
    <div class="base-text-input">
        <label v-if="label" :for="$attrs.id || 'input-' + $attrs.name" class="block text-sm font-medium leading-6 text-gray-900 mb-1">
          {{ label }}
          <span v-if="required" class="text-red-500 ml-0.5">*</span>
        </label>
        <div class="relative rounded-md shadow-sm"> 
            <!-- Input field -->
            <input 
                ref="inputRef"
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
                    'block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset placeholder:text-gray-400 focus:ring-1 focus:ring-inset sm:text-sm sm:leading-6 disabled:bg-gray-50 disabled:cursor-not-allowed',
                    inputRingClasses,
                    inputPaddingClass,
                    label ? 'pl-3' : 'pl-3'
                ]"
                :aria-invalid="error ? 'true' : 'false'"
                :aria-describedby="error ? ($attrs.id || 'input-' + $attrs.name) + '-error' : null"
            />
            
            <!-- Clear Button (only shown when clearable and has content) -->
            <button
                v-if="showClearButton"
                type="button"
                @click="clearInput"
                class="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                tabindex="-1"
                :aria-label="'Clear ' + (label || 'input')"
            >
                <i :class="[clearIconClass, 'h-5 w-5 text-gray-400 hover:text-gray-600']" aria-hidden="true"></i>
            </button>
            
            <!-- Trailing icon container (only shown when no clear button) -->
            <div v-else-if="trailingIconClass" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <i :class="[trailingIconClass, 'h-5 w-5', error ? 'text-red-500' : 'text-gray-400']" aria-hidden="true"></i>
            </div>
        </div>
        <p v-if="error" :id="($attrs.id || 'input-' + $attrs.name) + '-error'" class="mt-1 text-xs text-red-600">{{ error }}</p>
    </div>
  `
}; 