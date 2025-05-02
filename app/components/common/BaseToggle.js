const { computed } = Vue;

export default {
  name: 'BaseToggle',
  props: {
    modelValue: { // Used for v-model
      type: Boolean,
      default: false,
    },
    variant: {
      type: String,
      default: 'default', // 'default', 'short'
      validator: (value) => ['default', 'short'].includes(value)
    },
    // Optional: Add props for labels, disabled state, custom colors etc. later
    label: { type: String, default: 'Use setting' }, // Added default label
    disabled: { type: Boolean, default: false },
    onColor: { type: String, default: 'bg-blue-600' },
    offColor: { type: String, default: 'bg-gray-200' },
    // Aria label for accessibility
    ariaLabel: { type: String, default: null }
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const toggle = () => {
      if (props.disabled) return;
      emit('update:modelValue', !props.modelValue);
    };

    const buttonClasses = computed(() => {
      const base = [
        'relative', 'inline-flex', 'shrink-0', 'cursor-pointer', 'rounded-full',
        'border-2', 'border-transparent', 'transition-colors', 'duration-200', 'ease-in-out',
        'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-blue-600'
      ];
      const colors = props.modelValue ? props.onColor : props.offColor;
      const size = props.variant === 'short' ? ['h-5', 'w-10', 'items-center', 'justify-center'] : ['h-6', 'w-11'];
      const state = props.disabled ? ['cursor-not-allowed', 'opacity-50'] : [];

      if (props.variant === 'short') {
        // Specific wrapper styles for short variant
        base.push('group'); 
      }

      return [...base, colors, ...size, ...state].join(' ');
    });

    const spanWrapperClasses = computed(() => {
      if (props.variant === 'short') return []; // No extra wrapper span for short
      return [
        props.modelValue ? 'translate-x-5' : 'translate-x-0',
        'pointer-events-none', 'relative', 'inline-block', 
        'h-5', 'w-5',
        'transform', 'rounded-full',
        'bg-white', 'shadow-sm', 'ring-0', 'transition', 'duration-200', 'ease-in-out'
      ].join(' ');
    });

    const shortBackgroundSpanClasses = computed(() => {
      if (props.variant !== 'short') return [];
      return [
          'pointer-events-none', 'absolute', 'size-full', 'rounded-md', 'bg-white'
      ].join(' ');
    });
    
    const shortTrackSpanClasses = computed(() => {
       if (props.variant !== 'short') return [];
       return [
         props.modelValue ? props.onColor : props.offColor,
         'pointer-events-none', 'absolute', 'mx-auto', 'h-4', 'w-9', 'rounded-full', 
         'transition-colors', 'duration-200', 'ease-in-out'
       ].join(' ');
    });

    const knobClasses = computed(() => {
      const base = ['pointer-events-none'];
      const size = props.variant === 'short' ? ['absolute', 'left-0', 'inline-block', 'size-5'] : ['inline-block', 'size-5']; // Default variant uses size-5 on outer span
      const transform = props.variant === 'short'
          ? [props.modelValue ? 'translate-x-5' : 'translate-x-0', 'transform', 'border', 'border-gray-200'] 
          : []; // Default variant transform is on wrapper span
      const visual = ['rounded-full', 'bg-white', 'shadow-sm', 'ring-0', 'transition', 'duration-200', 'ease-in-out'];
      
       if (props.variant === 'short') {
            visual.push('shadow-sm') // Add shadow directly to knob for short
       } else {
           visual.push('relative'); // For icon positioning in default
       }

      return [...base, ...size, ...transform, ...visual].join(' ');
    });

    // Icon visibility classes (only for default variant)
    const offIconContainerClasses = computed(() => {
      if (props.variant === 'short') return ''; // Icons not typical in short variant structure
      return [
        props.modelValue ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in',
        'absolute', 'inset-0', 'flex', 'size-full', 'items-center', 'justify-center', 'transition-opacity'
      ].join(' ');
    });

    const onIconContainerClasses = computed(() => {
       if (props.variant === 'short') return '';
      return [
        props.modelValue ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out',
        'absolute', 'inset-0', 'flex', 'size-full', 'items-center', 'justify-center', 'transition-opacity'
      ].join(' ');
    });

    return {
      toggle,
      buttonClasses,
      spanWrapperClasses,
      knobClasses,
      offIconContainerClasses,
      onIconContainerClasses,
      shortBackgroundSpanClasses,
      shortTrackSpanClasses
    };
  },
  template: `
    <button
      type="button"
      @click="toggle"
      :class="buttonClasses"
      role="switch"
      :aria-checked="modelValue.toString()"
      :aria-label="ariaLabel || label"
      :disabled="disabled"
    >
      <span class="sr-only">{{ label }}</span>
      
      <!-- Structure for Default Variant -->
      <template v-if="variant === 'default'">
        <span :class="spanWrapperClasses">
          <!-- Off Icon Slot -->
          <span :class="offIconContainerClasses" aria-hidden="true">
            <slot name="icon-off">
              <!-- REMOVED Default off icon -->
              <!-- 
              <svg class="size-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
               -->
            </slot>
          </span>
          <!-- On Icon Slot -->
          <span :class="onIconContainerClasses" aria-hidden="true">
            <slot name="icon-on">
               <!-- REMOVED Default on icon -->
               <!-- 
               <svg class="size-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                 <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
               </svg>
               -->
            </slot>
          </span>
        </span>
      </template>
      
      <!-- Structure for Short Variant -->
      <template v-else-if="variant === 'short'">
         <span aria-hidden="true" :class="shortBackgroundSpanClasses" />
         <span aria-hidden="true" :class="shortTrackSpanClasses" />
         <span aria-hidden="true" :class="knobClasses" />
      </template>
      
    </button>
  `
};

// Remove global exposure
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseToggle = BaseToggle; 

// Add default export
