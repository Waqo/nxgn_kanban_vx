const { computed } = Vue;

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
        // Use a computed default ID inside setup if needed, or rely on attrs
        // default: () => `textarea-${Math.random().toString(36).substring(2, 9)}`
    },
    name: {
        type: String,
        default: 'textarea'
    },
    disabled: {
        type: Boolean,
        default: false
    },
    // New variant prop
    variant: {
        type: String,
        default: 'default', // 'default', 'underline', 'inline-actions'
        validator: (value) => ['default', 'underline', 'inline-actions'].includes(value)
    },
    // --- ADD error prop ---
    error: {
        type: String,
        default: null
    },
    // Allow passing extra attributes
    attrs: { type: Object, default: () => ({}) }
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots, attrs }) {
    const handleInput = (event) => {
      emit('update:modelValue', event.target.value);
    };

    // Compute ID if not provided via attrs
    const computedId = computed(() => props.id || attrs.id || `textarea-${Math.random().toString(36).substring(2, 9)}`);
    
    // --- UPDATE describedById to include error ---
    const describedByIds = computed(() => {
        const ids = [];
        if (slots.description) {
            ids.push(`${computedId.value}-description`);
        }
        if (props.error) {
             ids.push(`${computedId.value}-error`);
        }
        return ids.length > 0 ? ids.join(' ') : null;
    });
    const errorId = computed(() => props.error ? `${computedId.value}-error` : null);

    // Compute classes based on variant and error state
    const textareaContainerClasses = computed(() => {
        const classes = [];
        if (props.error) {
             // Error state overrides variant styling for border/outline
             classes.push('relative rounded-lg bg-white border border-red-300 outline-1 -outline-offset-1 outline-red-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-red-600');
        } else {
            switch (props.variant) {
                case 'underline':
                    classes.push('border-b border-gray-300 focus-within:border-indigo-600'); // Simplified underline
                    break;
                case 'inline-actions': // Added case for new variant
                case 'default':
                default:
                    // Use the same container styling for default and inline-actions when no error
                    classes.push('relative rounded-lg bg-white border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600');
                    break;
            }
        }
        return classes.join(' ');
    });

    const textareaClasses = computed(() => {
        const base = 'block w-full border-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 resize-none focus:outline-none';
        // Use bg-transparent for default/inline-actions to inherit container background
        const bg = props.disabled ? 'bg-gray-50' : (props.variant === 'underline' ? 'bg-white' : 'bg-transparent');
        const cursor = props.disabled ? 'cursor-not-allowed' : '';
        // Consistent padding for default and inline-actions
        const padding = props.variant === 'underline' ? 'px-0.5 py-1.5' : 'px-3 py-1.5';

        return [base, bg, cursor, padding].join(' ');
    });

    return {
        handleInput,
        computedId,
        textareaContainerClasses,
        textareaClasses,
        describedByIds, // Use plural name
        errorId
    };
  },
  template: `
    <div class="base-text-area flex items-start space-x-4">
        <!-- Leading Slot (e.g., for Avatar) -->
        <div v-if="$slots.leading" class="shrink-0 pt-1.5"> <!-- Adjust alignment if needed -->
            <slot name="leading"></slot>
        </div>
        
        <div class="min-w-0 flex-1 relative"> <!-- Add relative positioning here -->
             <!-- Label -->
             <label v-if="label && !$slots.label" :for="computedId" class="block text-sm font-medium leading-6 text-gray-900">{{ label }}</label>
             <!-- Label Slot -->
             <slot name="label"></slot>
        
             <!-- Container with Outline/Underline -->
             <div class="mt-1" :class="textareaContainerClasses">
               <!-- Description Slot (Inside container for default/inline-actions, outside for underline?) -->
               <div v-if="$slots.description && (variant === 'default' || variant === 'inline-actions')" :id="describedByIds ? describedByIds.split(' ')[0] : null" class="px-3 pt-1.5 text-sm text-gray-500">
                  <slot name="description"></slot>
               </div>

               <textarea 
                   :rows="rows" 
                   :name="name" 
                   :id="computedId" 
                   :class="textareaClasses" 
                   :placeholder="placeholder"
                   :value="modelValue"
                   @input="handleInput"
                   :disabled="disabled"
                   :aria-describedby="describedByIds"
                   :aria-invalid="error ? 'true' : 'false'"
                   v-bind="attrs" 
               />

                <!-- Spacer element for actions (only for default variant with absolute positioning) -->
                <div v-if="$slots.actions && variant === 'default'" class="py-2" aria-hidden="true">
                    <div class="py-px">
                        <div class="h-9" />
                    </div>
                </div>

                <!-- Actions Slot (Rendered inline for 'inline-actions' variant) -->
                <div v-if="$slots.actions && variant === 'inline-actions'" class="border-t border-gray-200">
                    <div class="px-2 py-2 sm:px-3">
                        <slot name="actions"></slot>
                    </div>
                </div>
             </div>

             <!-- Actions Slot (Positioned Absolutely only for default variant) -->
             <div v-if="$slots.actions && variant === 'default'" class="absolute inset-x-px bottom-0 border-t border-gray-200">
                 <div class="flex items-center justify-between space-x-3 px-2 py-2 sm:px-3">
                    <slot name="actions"></slot>
                 </div>
             </div>
             <!-- Actions Slot (Standard flow for underline variant - seems missing before, adding it here) -->
             <div v-if="$slots.actions && variant === 'underline'" class="mt-2 flex items-center justify-between space-x-3">
                 <slot name="actions"></slot>
             </div>

             <!-- ADD Error Message -->
             <p v-if="error" :id="errorId" class="mt-1 text-xs text-red-600">{{ error }}</p>
        </div>
    </div>
  `
}; 