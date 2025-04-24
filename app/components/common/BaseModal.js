// app/components/common/BaseModal.js

export default {
  name: 'BaseModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    title: {
        type: String,
        default: 'Modal Title' // Default title, though usually overridden by slot
    },
    // Optional props for size, persistent (prevent close on overlay click)
    size: { 
        type: String, 
        default: 'md', // Default size
        validator: (value) => [
            'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full'
        ].includes(value)
    },
    persistent: { // Add prop to prevent closing on overlay click
        type: Boolean,
        default: false
    }
  },
  emits: ['close'],
  computed: {
      modalSizeClasses() {
          // Adjusted to match Tailwind's max-w classes better
          switch(this.size) {
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
      }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    // Close modal if overlay is clicked, unless persistent
    handleOverlayClick(event) {
        if (!this.persistent && event.target === this.$refs.modalOverlay) {
            this.closeModal();
        }
    },
    // Handle Escape key press
    handleEscapeKey(event) {
        if (this.show && event.key === 'Escape') {
            this.closeModal();
        }
    }
  },
  // --- Remove external template reference ---
  // template: '#base-modal-template'

  // --- ADD Inline Template ---
  template: `
    <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
    >
      <!-- Main container, only renders when show is true -->
      <div 
          v-if="show" 
          class="fixed inset-0 z-50 overflow-hidden"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
          @keydown.esc="handleEscapeKey" 
      >
          <!-- Overlay Background -->
          <div 
              class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              @click="handleOverlayClick" 
              ref="modalOverlay"
          ></div>

          <!-- Positioning Container (No longer centering via flex) -->
          <div class="fixed inset-0 pointer-events-none p-4"> 
             <!-- Sizing and Main Structure Div (Applying inline styles) -->
             <div 
                 :class="[
                    'absolute w-full pointer-events-auto flex flex-col overflow-y-auto scrollbar-hide rounded-lg bg-white shadow-xl', // Use absolute, removed h-[96%], added overflow-y-auto, removed overflow-hidden
                    modalSizeClasses // Apply max-width here
                 ]" 
                 :style="{ top: '2%', left: '50%', transform: 'translateX(-50%)', height: '96%' }" // Added inline styles
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
                        <!-- Header Slot -->
                        <div class="modal-header px-1 pt-0 border-b border-gray-200 flex-shrink-0">
                            <slot name="header">
                                <!-- Default Header -->
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        {{ title }}
                                    </h3>
                                    <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
                                        <span class="sr-only">Close</span>
                                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </slot>
                        </div>
                        <!-- Body Slot (Scrollable) -->
                        <div class="modal-body pt-1 px-0 pb-5">
                            <slot></slot> 
                        </div>
                        <!-- Footer Slot -->
                        <div class="modal-footer bg-gray-50 px-4 py-3 sm:px-6 flex-shrink-0 border-t border-gray-200">
                            <slot name="footer">
                                <!-- Default Footer -->
                                <div class="flex justify-end">
                                    <button @click="closeModal" type="button" class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm">
                                        Close
                                    </button>
                                </div>
                            </slot>
                        </div>
                    </div> 
                </transition>
            </div>
         </div>

      </div> 
    </transition>
  `,

  // Lifecycle hooks for adding/removing escape key listener
  mounted() {
    document.addEventListener('keydown', this.handleEscapeKey);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleEscapeKey);
  }
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseModal = BaseModal; 