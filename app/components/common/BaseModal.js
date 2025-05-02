// app/components/common/BaseModal.js

const { ref, computed, watch, onMounted, onBeforeUnmount } = Vue;

export default {
  name: 'BaseModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    title: {
        type: String,
      default: 'Modal Title'
    },
    size: { 
        type: String, 
      default: 'md',
        validator: (value) => [
            'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full'
        ].includes(value)
    },
    persistent: {
      type: Boolean,
      default: false
    },
    // New props for better scroll and z-index management
    scrollBehavior: {
      type: String,
      default: 'inside', // 'inside' = scroll inside modal body, 'outside' = scroll whole modal
      validator: val => ['inside', 'outside'].includes(val)
    },
    maxHeight: {
      type: String,
      default: '96%'
    },
    zIndex: {
      type: Number,
      default: 50
    },
    hideCloseButton: {
      type: Boolean,
      default: false
    },
    closeOnEsc: {
      type: Boolean,
      default: true
    },
    // New prop to enable vertical centering
    centered: {
      type: Boolean,
      default: false
    },
    // New prop to hide scrollbars while maintaining scroll functionality
    hideScrollbar: {
        type: Boolean,
        default: false
    },
    // New prop to control header padding
    noHeaderPadding: {
        type: Boolean,
        default: false
    }
  },
  emits: ['close', 'closed', 'opened'],
  setup(props, { emit }) {
    const modalRef = ref(null);
    const modalOverlayRef = ref(null);
    const modalBodyRef = ref(null);
    const isClosing = ref(false);
    const originalOverflow = ref('');
    
    // Track if we've already emitted the opened event
    const hasEmittedOpened = ref(false);
    
    // Computed class for modal size
    const modalSizeClasses = computed(() => {
      switch(props.size) {
              case 'sm': return 'max-w-sm';
              case 'lg': return 'max-w-lg';
              case 'xl': return 'max-w-xl';
              case '2xl': return 'max-w-2xl';
              case '3xl': return 'max-w-3xl';
              case '4xl': return 'max-w-4xl';
              case '5xl': return 'max-w-5xl';
              case '6xl': return 'max-w-6xl';
              case '7xl': return 'max-w-7xl';
              case 'full': return 'max-w-full h-full';
              case 'md': // Default
              default: return 'max-w-md';
          }
    });
    
    // Computed style for z-index and maxHeight
    const modalContainerStyle = computed(() => {
      return { zIndex: props.zIndex };
    });
    
    const modalContentStyle = computed(() => {
      const style = { maxHeight: props.maxHeight };
      
      if (props.centered) {
        // When centered, use 50% positioning with transform
        style.top = '50%';
        style.left = '50%';
        style.transform = 'translate(-50%, -50%)';
      } else {
        // Original top positioning
        style.top = '2%';
        style.left = '50%';
        style.transform = 'translateX(-50%)';
      }
      
      return style;
    });
    
    // CSS for hiding scrollbars while maintaining functionality
    const scrollbarHideClasses = computed(() => {
      if (!props.hideScrollbar) return '';
      
      return [
        '-ms-overflow-style: none', /* IE and Edge */
        'scrollbar-width: none', /* Firefox */
        /* Chrome, Safari and Opera handled via ::-webkit-scrollbar below */
      ];
    });
    
    // Computed class for scrolling behavior
    const modalBodyClasses = computed(() => {
      const classes = [
        'modal-body pt-1 px-0 pb-5',
      ];
      
      // Add scroll classes for inside behavior
      if (props.scrollBehavior === 'inside') {
        classes.push('overflow-y-auto');
        
        // Add either the regular scrollbar styling or the hidden scrollbar classes
        if (props.hideScrollbar) {
          classes.push('scrollbar-hide');
        } else {
          classes.push('scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100');
        }
      }
      
      return classes;
    });
    
    const modalContentClasses = computed(() => {
      const classes = [
        'absolute w-full pointer-events-auto flex flex-col bg-white shadow-xl rounded-lg',
        modalSizeClasses.value,
      ];
      
      // Add appropriate overflow classes based on scroll behavior
      if (props.scrollBehavior === 'outside') {
        classes.push('overflow-y-auto');
        
        // Add either the regular scrollbar styling or the hidden scrollbar classes
        if (props.hideScrollbar) {
          classes.push('scrollbar-hide');
        } else {
          classes.push('scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100');
        }
      } else {
        classes.push('overflow-hidden');
      }
      
      return classes;
    });
    
    // Methods
    const closeModal = () => {
      if (isClosing.value) return;
      
      isClosing.value = true;
      emit('close');
      
      setTimeout(() => {
        isClosing.value = false;
        emit('closed');
      }, 200); // Match the transition duration
    };
    
    const handleOverlayClick = (event) => {
      if (!props.persistent && event.target === modalOverlayRef.value) {
        closeModal();
      }
    };
    
    const handleEscapeKey = (event) => {
      if (props.show && props.closeOnEsc && event.key === 'Escape') {
        closeModal();
        }
    };
    
    // Lock body scroll when modal is open
    const lockBodyScroll = () => {
      originalOverflow.value = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    };
    
    // Restore body scroll when modal is closed
    const unlockBodyScroll = () => {
      document.body.style.overflow = originalOverflow.value;
    };
    
    // Watch for show prop changes
    watch(() => props.show, (newVal) => {
      if (newVal) {
        lockBodyScroll();
        
        // Emit opened event once the modal is visible and transition is done
        setTimeout(() => {
          if (!hasEmittedOpened.value) {
            emit('opened');
            hasEmittedOpened.value = true;
          }
        }, 300);
      } else {
        unlockBodyScroll();
        hasEmittedOpened.value = false;
      }
    }, { immediate: true });
    
    // Lifecycle hooks
    onMounted(() => {
      document.addEventListener('keydown', handleEscapeKey);
      if (props.show) {
        lockBodyScroll();
      }
    });
    
    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleEscapeKey);
      unlockBodyScroll();
    });
    
    return {
      modalRef,
      modalOverlayRef,
      modalBodyRef,
      closeModal,
      handleOverlayClick,
      modalSizeClasses,
      modalContainerStyle,
      modalContentStyle,
      modalBodyClasses,
      modalContentClasses
    };
  },
  template: `
    <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
    >
      <!-- Main container -->
      <div 
          v-if="show" 
        ref="modalRef"
        class="fixed inset-0 overflow-hidden"
        :style="modalContainerStyle"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
      >
          <!-- Overlay Background -->
          <div 
          ref="modalOverlayRef"
              class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              @click="handleOverlayClick" 
          ></div>

        <!-- Positioning Container -->
          <div class="fixed inset-0 pointer-events-none p-4"> 
          <!-- Content Container with Size and Scroll -->
             <div 
            :class="modalContentClasses" 
            :style="modalContentStyle"
            >
                 <!-- Modal Panel Transition -->
                <transition
                   enter-active-class="transition ease-out duration-300"
                   enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                   enter-to-class="opacity-100 translate-y-0 sm:scale-100"
                   leave-active-class="transition ease-in duration-200"
                   leave-from-class="opacity-100 translate-y-0 sm:scale-100"
                   leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                    <!-- Inner content wrapper -->
                    <div v-if="show" class="flex flex-col h-full w-full" @click.stop> 
                <!-- Header -->
                <div :class="['modal-header flex-shrink-0 border-b border-gray-200', { 'p-4': !noHeaderPadding }]" >
                            <slot name="header">
                                <!-- Default Header -->
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        {{ title }}
                                    </h3>
                      <button 
                        v-if="!hideCloseButton"
                        @click="closeModal" 
                        class="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                                        <span class="sr-only">Close</span>
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                                    </button>
                                </div>
                            </slot>
                        </div>
                
                <!-- Body with proper scroll handling -->
                <div ref="modalBodyRef" :class="modalBodyClasses">
                            <slot></slot> 
                        </div>
                
                <!-- Footer -->
                        <div v-if="$slots.footer" class="modal-footer bg-gray-50 px-4 py-3 sm:px-6 flex-shrink-0 border-t border-gray-200">
                            <slot name="footer"></slot>
                        </div>
                    </div> 
                </transition>
            </div>
         </div>
      </div> 
    </transition>
  `
};

// Define the CSS for scrollbar-hide as a global style if not already defined elsewhere
// This ensures the component is fully self-contained
const styleElement = document.createElement('style');
styleElement.textContent = `
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;     /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;             /* Chrome, Safari and Opera */
}
`;
document.head.appendChild(styleElement);

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseModal = BaseModal; 