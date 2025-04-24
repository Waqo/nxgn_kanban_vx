// app/components/common/BaseNotification.js

export default {
  name: 'BaseNotification',
  props: {
      // This component will likely get notifications from a global store (e.g., ui module)
      // rather than direct props, but we can define props for a single instance for now.
      type: { type: String, default: 'success' }, // success, error, warning, info
      title: { type: String, default: '' },
      message: { type: String, default: 'Notification message.' },
      duration: { type: Number, default: 5000 } // Duration in ms, 0 for persistent
  },
  emits: ['close'],
  data() {
    return {
        timeoutId: null
    };
  },
  computed: {
      iconComponent() {
          // Placeholder: In a real app, these would be actual SVG components or icons
          switch(this.type) {
              case 'success': return 'CheckCircleIcon'; 
              case 'error': return 'XCircleIcon'; 
              case 'warning': return 'ExclamationTriangleIcon'; 
              case 'info': return 'InformationCircleIcon'; 
              default: return 'InformationCircleIcon';
          }
      },
      iconColorClass() {
           switch(this.type) {
              case 'success': return 'text-green-400'; 
              case 'error': return 'text-red-400'; 
              case 'warning': return 'text-yellow-400'; 
              case 'info': return 'text-blue-400'; 
              default: return 'text-gray-400';
          }
      }
  },
  methods: {
    closeNotification() {
      clearTimeout(this.timeoutId);
      this.$emit('close');
    },
    setAutoClose() {
        clearTimeout(this.timeoutId);
        if (this.duration > 0) {
            this.timeoutId = setTimeout(() => {
                this.$emit('close');
            }, this.duration);
        }
    }
  },
  mounted() {
      this.setAutoClose();
  },
  beforeUnmount() {
      clearTimeout(this.timeoutId);
  },
  // Template defined in widget.html
  template: `
    <div class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
        <div class="p-4">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <!-- Placeholder for actual icon components -->
                     <span :class="iconColorClass" class="h-6 w-6">
                        <i v-if="type === 'success'" class="fas fa-check-circle"></i>
                        <i v-else-if="type === 'error'" class="fas fa-times-circle"></i>
                        <i v-else-if="type === 'warning'" class="fas fa-exclamation-triangle"></i>
                        <i v-else class="fas fa-info-circle"></i>
                     </span>
                </div>
                <div class="ml-3 w-0 flex-1 pt-0.5">
                    <p v-if="title" class="text-sm font-medium text-gray-900">{{ title }}</p>
                    <p class="mt-1 text-sm text-gray-500">{{ message }}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button @click="closeNotification" class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <span class="sr-only">Close</span>
                        <!-- Heroicon name: solid/x -->
                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
  `
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseNotification = BaseNotification; 