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
        default: 'Modal Title'
    },
    // Optional props for size, persistent (prevent close on overlay click)
    size: { type: String, default: 'md' } // e.g., sm, md, lg, xl, full
  },
  emits: ['close'],
  computed: {
      modalSizeClasses() {
          switch(this.size) {
              case 'sm': return 'sm:max-w-sm';
              case 'lg': return 'sm:max-w-lg';
              case 'xl': return 'sm:max-w-xl';
              case '2xl': return 'sm:max-w-2xl';
              case '3xl': return 'sm:max-w-3xl';
              case '4xl': return 'sm:max-w-4xl';
              case 'full': return 'sm:max-w-full h-full'; // Special case for full screen?
              case 'md': // Default
              default: return 'sm:max-w-md';
          }
      }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    // Close modal if overlay is clicked
    // Add `preventCloseOnOverlay` prop later if needed
    handleOverlayClick(event) {
        if (event.target === this.$refs.modalOverlay) {
            this.closeModal();
        }
    }
  },
  // Template defined in widget.html
  template: '#base-modal-template'
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseModal = BaseModal; 