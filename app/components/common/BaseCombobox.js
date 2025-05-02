// app/components/common/BaseCombobox.js

const { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } = Vue;

export default {
  name: 'BaseCombobox',
  props: {
    modelValue: {
      // For multi-select, expect an array of selected option *objects* or primitives
      type: Array,
      default: () => []
    },
    options: {
      type: Array,
      default: () => [] // Expect array of objects or primitives
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Select an option...'
    },
    // --- Renamed for clarity: these define the keys WITHIN option objects ---
    valueKey: { // Use this key to get the unique value for comparison/emit
      type: String,
      default: 'value' // Changed default to 'value' often used
    },
    labelKey: { // Use this key to get the display label
      type: String,
      default: 'label' // Changed default to 'label' often used
    },
    // For display customization within dropdown options
    displayWithImage: Boolean,
    displayWithStatus: Boolean,
    displayWithSecondaryText: Boolean,
    secondaryTextKey: {
      type: String,
      default: 'description'
    },
    statusKey: {
      type: String,
      default: 'online'
    },
    imageUrlKey: {
      type: String,
      default: 'imageUrl'
    },
    // --- REMOVED checkPosition - Checkmark is always on the right for multi-select ---
    // checkPosition: { ... },
    disabled: Boolean,
    attrs: { type: Object, default: () => ({}) }, // Allow passing extra attributes like id, class
    multiple: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: false
    },
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const query = ref('');
    const inputElement = ref(null);
    const optionsElement = ref(null);
    const comboboxElement = ref(null);
    const isOpen = ref(false);
    const activeOptionIndex = ref(-1); // Start at -1 (no active option)
    const touched = ref(false); // Track if user interacted, useful for initial value setting

    // Helper to consistently get the value from an option
    const getOptionValue = (option) => {
        return typeof option === 'object' && option !== null ? option[props.valueKey] : option;
    };

    // Helper to consistently get the label from an option
    const getOptionLabel = (option) => {
        if (typeof option === 'object' && option !== null) {
            return option[props.labelKey] || ''; // Fallback to empty string if labelKey missing
        }
        return String(option); // Convert primitives to string
    };

    // Filtered options based on query
    const filteredOptions = computed(() => {
      if (!Array.isArray(props.options)) return []; // Ensure options is an array

      const lowerCaseQuery = query.value.toLowerCase();

      if (lowerCaseQuery === '') {
          return props.options;
      }

      return props.options.filter(option => {
        const label = String(getOptionLabel(option) || '').toLowerCase(); // Ensure label is string
        return label.includes(lowerCaseQuery);
      });
    });

    // --- Revised: displayValue computed is mainly for single select's input text ---
    const displayValue = computed(() => {
        if (props.multiple || !props.modelValue || props.modelValue.length === 0) {
            // In multi-select, the input shows the query, not the selection
            // If single-select has no value, show query or empty
            return query.value;
        }
        // Single select mode with a value selected
        // Find the option object corresponding to the modelValue
        const selectedValue = getOptionValue(props.modelValue);
        const matchingOption = props.options.find(opt => getOptionValue(opt) === selectedValue);
        return matchingOption ? getOptionLabel(matchingOption) : query.value; // Show label or current query if no match found
    });

    // --- Helper to check if an option is selected ---
    const isSelected = (option) => {
        const optionValue = getOptionValue(option);
        if (props.multiple) {
            // Ensure modelValue is an array before using .some
            return Array.isArray(props.modelValue) && props.modelValue.some(item => getOptionValue(item) === optionValue);
        } else {
            return props.modelValue !== null && props.modelValue !== undefined && getOptionValue(props.modelValue) === optionValue;
        }
    };


    // --- Handlers ---
    const handleInputChange = (event) => {
      query.value = event.target.value;
      isOpen.value = true;
      touched.value = true;
      activeOptionIndex.value = 0; // Reset active index on new input
    };

    const handleInputFocus = () => {
      // Open if not already open and there are options to show
      if (!isOpen.value && filteredOptions.value.length > 0) {
          isOpen.value = true;
          activeOptionIndex.value = 0; // Reset active index on focus
      }
      // Always emit focus event if needed by parent
      // emit('focus');
    };

    const handleInputBlur = () => {
      // Use setTimeout to allow click on option to register before closing
      setTimeout(() => {
          if (isOpen.value) {
              isOpen.value = false;
              activeOptionIndex.value = -1; // Reset active index when closed
          }
          // Optionally reset query if nothing was selected (depends on desired UX)
          // if (query.value && (props.multiple ? !props.modelValue.length : !props.modelValue)) {
          //   query.value = '';
          // }
      }, 150); // Slightly longer timeout might be needed
      // Always emit blur event if needed by parent
      // emit('blur');
    };

    // --- IMPROVED: selectOption handles both single and multi (with toggle) ---
    const selectOption = (option) => {
      if (props.disabled) return;

      touched.value = true; // Mark as interacted
      const optionValue = getOptionValue(option); // Get the value to work with

      if (props.multiple) {
          const currentModelValue = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
          let newValue;

          if (isSelected(option)) {
              // Deselect: filter out the option
              newValue = currentModelValue.filter(item => getOptionValue(item) !== optionValue);
          } else {
              // Select: add the option (emit the full option object)
              newValue = [...currentModelValue, option];
          }

          emit('update:modelValue', newValue);
          query.value = ''; // Clear input after selection/deselection in multi-mode
          // Keep dropdown open for multi-select? Optional, depends on UX.
          // isOpen.value = true; // Keep open
          // Refocus input immediately
          inputElement.value?.focus();

      } else {
          // Single select mode
          emit('update:modelValue', option); // Emit the full option object
          query.value = getOptionLabel(option); // Set input text to selected label
          isOpen.value = false; // Close dropdown on single select
          activeOptionIndex.value = -1; // Reset index
          // inputElement.value?.focus(); // Optional: refocus after single select
      }
    };

    const toggleDropdown = () => {
      if (props.disabled) return;
      isOpen.value = !isOpen.value;
       if (isOpen.value) {
           activeOptionIndex.value = 0; // Reset index when opening
           nextTick(() => {
               inputElement.value?.focus(); // Focus input when opening via button
           });
       } else {
           activeOptionIndex.value = -1; // Reset index when closing
       }
    };

    // --- Keyboard Navigation ---
    const handleKeyDown = (event) => {
      if (props.disabled) return;
      const optionsCount = filteredOptions.value.length;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen.value && optionsCount > 0) {
              isOpen.value = true; // Open dropdown if closed
              activeOptionIndex.value = 0; // Start at the top
          } else if (isOpen.value && optionsCount > 0) {
              activeOptionIndex.value = (activeOptionIndex.value + 1) % optionsCount;
              scrollActiveOptionIntoView();
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (isOpen.value && optionsCount > 0) {
              activeOptionIndex.value = (activeOptionIndex.value - 1 + optionsCount) % optionsCount;
              scrollActiveOptionIntoView();
          }
          break;

        case 'Enter':
          if (isOpen.value && filteredOptions.value.length > 0 && activeOptionIndex.value >= 0) {
            event.preventDefault();
            const selected = filteredOptions.value[activeOptionIndex.value];
            selectOption(selected);
            // Ensure dropdown closes after selection via Enter key
            isOpen.value = false; 
          }
          break;

        case 'Escape':
          if (isOpen.value) {
            event.preventDefault();
            isOpen.value = false;
            activeOptionIndex.value = -1;
            // Maybe reset query? Depends on UX preference.
            // query.value = '';
          }
          break;

        case 'Backspace':
          // Remove last selected item in multi-select mode if query is empty
          if (props.multiple && query.value === '' && Array.isArray(props.modelValue) && props.modelValue.length > 0) {
            event.preventDefault();
            removeOption(props.modelValue[props.modelValue.length - 1]);
          }
          break;

        case 'Tab':
          // Allow default tab behavior, which will blur the input.
          // handleInputBlur will take care of closing the dropdown.
          if (isOpen.value) {
             // If an option is active, select it before tabbing away? Optional UX decision.
             // if (activeOptionIndex.value >= 0 && activeOptionIndex.value < optionsCount) {
             //   selectOption(filteredOptions.value[activeOptionIndex.value]);
             // }
             isOpen.value = false;
             activeOptionIndex.value = -1;
          }
          break;
      }
    };

    const scrollActiveOptionIntoView = () => {
      nextTick(() => {
        const container = optionsElement.value;
        const activeItem = container?.children[activeOptionIndex.value];
        if (container && activeItem) {
            const containerRect = container.getBoundingClientRect();
            const itemRect = activeItem.getBoundingClientRect();

            if (itemRect.bottom > containerRect.bottom) {
                container.scrollTop += itemRect.bottom - containerRect.bottom;
            } else if (itemRect.top < containerRect.top) {
                container.scrollTop -= containerRect.top - itemRect.top;
            }
        }
      });
    };

    // --- Click Outside ---
    const handleClickOutside = (event) => {
      if (comboboxElement.value && !comboboxElement.value.contains(event.target)) {
        if (isOpen.value) {
            isOpen.value = false;
            activeOptionIndex.value = -1;
        }
      }
    };

    // --- Lifecycle Hooks ---
    onMounted(() => {
      document.addEventListener('click', handleClickOutside, true); // Use capture phase
       // Set initial query for single select mode if modelValue exists and not touched
       if (!props.multiple && props.modelValue && !touched.value) {
           const initialOption = props.options.find(opt => getOptionValue(opt) === getOptionValue(props.modelValue));
           if (initialOption) {
               query.value = getOptionLabel(initialOption);
           }
       }
    });

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside, true);
    });

    // --- Watcher for external modelValue changes ---
    watch(() => props.modelValue, (newValue, oldValue) => {
        // Don't sync query input based on model changes in multi-select mode
        // as the input is primarily for filtering/typing.
        if (props.multiple) {
            return;
        }

        // Single Select Mode:
        if (!newValue) {
            // If model is cleared externally, clear the query input
            if (!isOpen.value) { // Avoid clearing query if user is actively typing
                 query.value = '';
            }
        } else {
             // If model is set externally, update query *if* not focused/open
             if (!isOpen.value && document.activeElement !== inputElement.value) {
                 const matchingOption = props.options.find(opt => getOptionValue(opt) === getOptionValue(newValue));
                 query.value = matchingOption ? getOptionLabel(matchingOption) : '';
             }
        }
    }, { deep: true }); // Use deep watch if options can be complex objects

    // --- Remove a selected option (called by pill button) ---
    const removeOption = (optionToRemove) => {
        if (props.disabled || !props.multiple) return;

        const valueToRemove = getOptionValue(optionToRemove);
        const currentModelValue = Array.isArray(props.modelValue) ? props.modelValue : []; // Ensure it's an array

        const newValue = currentModelValue.filter(selectedOption => {
            return getOptionValue(selectedOption) !== valueToRemove;
        });

        emit('update:modelValue', newValue);

        // Return focus to input after removing
        nextTick(() => {
            inputElement.value?.focus();
        });
    };

    // --- Clear all selections ---
    const clearAll = () => {
        if (props.disabled || !props.clearable) return;
        emit('update:modelValue', props.multiple ? [] : null); // Emit empty array for multi, null for single
        query.value = ''; // Clear query input
        isOpen.value = false; // Close dropdown
        activeOptionIndex.value = -1;
        nextTick(() => {
            inputElement.value?.focus();
        });
    };

    return {
      query,
      inputElement,
      optionsElement,
      comboboxElement,
      isOpen,
      activeOptionIndex,
      filteredOptions,
      // displayValue, // Primarily internal now for single-select watch
      handleInputChange,
      handleInputFocus,
      handleInputBlur,
      selectOption,
      toggleDropdown,
      handleKeyDown,
      removeOption,
      clearAll,
      // Helpers exposed for template:
      getOptionLabel,
      getOptionValue,
      isSelected,
    };
  },
  // --- TEMPLATE ---
  template: `
    <div ref="comboboxElement" class="base-combobox">
      <label v-if="label" :for="attrs.id || 'combobox-input'" class="block text-sm font-medium leading-6 text-gray-900 mb-1">{{ label }}</label>
      <div
        class="relative border border-gray-300 rounded-md shadow-sm flex flex-wrap items-center gap-1 p-1 pr-10 transition duration-150 ease-in-out"
        :class="{
            'ring-2 ring-blue-600 border-blue-600': isOpen,
            'bg-gray-50 cursor-not-allowed': disabled,
            'focus-within:ring-0 focus-within:border-blue-600': !disabled && !isOpen
        }"
        @click="() => !disabled && inputElement?.focus()"
      >
        <template v-if="multiple && Array.isArray(modelValue) && modelValue.length > 0">
          <span
            v-for="selectedOption in modelValue"
            :key="getOptionValue(selectedOption)"
            class="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
          >
            {{ getOptionLabel(selectedOption) }}
            <button
              type="button"
              @click.stop="!disabled && removeOption(selectedOption)"
              :disabled="disabled"
              class="text-blue-500 hover:text-blue-700 focus:outline-none focus:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              :aria-label="'Remove ' + getOptionLabel(selectedOption)"
            >
              <svg class="h-2.5 w-2.5" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                <path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6L1 7" />
              </svg>
            </button>
          </span>
        </template>

        <input
          ref="inputElement"
          type="text"
          :value="query"
          @input="handleInputChange"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
          @keydown="handleKeyDown"
          class="flex-grow p-0.5 border-0 focus:ring-0 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed bg-transparent"
          :style="{ minWidth: '60px' }"
          :placeholder="multiple && Array.isArray(modelValue) && modelValue.length > 0 ? '' : placeholder"
          role="combobox"
          :aria-expanded="isOpen"
          :aria-controls="isOpen ? 'combobox-options' : undefined"
          aria-haspopup="listbox"
          autocomplete="off"
          :id="attrs.id || 'combobox-input'"
          :disabled="disabled"
          v-bind="attrs"
        />

        <div class="absolute inset-y-0 right-0 flex items-center pr-1">
            <div v-if="loading" class="px-2 animate-spin">
                 <i class="fas fa-spinner text-gray-400"></i>
            </div>
            <button
              v-if="clearable && (query || (Array.isArray(modelValue) ? modelValue.length > 0 : modelValue !== null)) && !loading"
              type="button"
              @click.stop="clearAll"
              :disabled="disabled"
              class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
              aria-label="Clear selection"
            >
                <i class="fas fa-times-circle h-4 w-4"></i>
            </button>
            <button
              type="button"
              @click.stop="toggleDropdown"
              :disabled="disabled"
              class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
              aria-label="Toggle dropdown"
            >
              <i class="fas fa-chevron-down h-4 w-4" aria-hidden="true"></i>
            </button>
        </div>

        <ul
          v-if="isOpen && filteredOptions.length > 0"
          ref="optionsElement"
          id="combobox-options"
          class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          role="listbox"
          :aria-labelledby="attrs.id || 'combobox-input'"
        >
          <li
            v-for="(option, index) in filteredOptions"
            :key="getOptionValue(option)"
            :id="'combobox-option-' + index"
            :class="[
              'relative cursor-default select-none py-2 pl-3 pr-9', // Always reserve space for checkmark on right
              index === activeOptionIndex ? 'bg-blue-100 text-blue-900' : 'text-gray-900',
            ]"
            role="option"
            :aria-selected="isSelected(option)"
            @click="selectOption(option)"
            @mouseenter="activeOptionIndex = index"
            @mouseleave="activeOptionIndex = -1"
          >
             <span :class="[
                'block truncate',
                isSelected(option) ? 'font-semibold' : 'font-normal'
             ]">

                 <template v-if="displayWithImage && typeof option === 'object' && option[imageUrlKey]">
                      <img :src="option[imageUrlKey]" alt="" class="h-6 w-6 flex-shrink-0 rounded-full inline-block mr-2" />
                      {{ getOptionLabel(option) }}
                 </template>
                 <template v-else>
                      {{ getOptionLabel(option) }}
                 </template>
                 </span>

            <span
              v-if="isSelected(option)"
              :class="[
                'absolute inset-y-0 right-0 flex items-center pr-4',
                index === activeOptionIndex ? 'text-blue-700' : 'text-blue-600' // Slightly different check color if active
              ]">
              <i class="fas fa-check h-5 w-5" aria-hidden="true"></i>
            </span>
          </li>
        </ul>

        <div
          v-else-if="isOpen && query && filteredOptions.length === 0 && !loading"
          class="absolute z-10 mt-1 w-full p-3 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 text-sm text-gray-500"
        >
          No results found matching "{{ query }}".
        </div>
         <div
            v-else-if="isOpen && loading"
            class="absolute z-10 mt-1 w-full p-3 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 text-sm text-gray-500 text-center"
          >
            Loading...
         </div>
      </div>
    </div>
  `
};