const { computed, ref, onMounted, onBeforeUnmount, watch } = Vue;

// Mapping from type prop to icon classes (can be customized)
const AlertIconMap = {
    'Task Assignment': 'fas fa-clipboard-list text-blue-500',
    'Note Mention': 'far fa-comment-dots text-purple-500',
    'Issue Mention': 'fas fa-exclamation-circle text-red-500',
    'Replied to Note': 'fas fa-reply text-green-500',
    'default': 'far fa-bell text-gray-500' // Fallback
};

export default {
  name: 'NewNotificationAlert',
  props: {
      // Unique ID for the alert (important for managing list)
      id: {
          type: [String, Number],
          required: true
      },
      // Use Notification_Type directly or map it if needed
      type: {
          type: String,
          default: 'default'
      },
      title: { type: String, default: '' }, // Optional title
      message: { type: String, required: true },
      duration: { type: Number, default: 6000 }, // Duration in ms, 0 for persistent
      dismissible: { type: Boolean, default: true }
  },
  emits: ['dismiss'],
  setup(props, { emit }) {
      const timeoutId = ref(null);

      const iconClass = computed(() => {
           return AlertIconMap[props.type] || AlertIconMap.default;
      });

      // --- Methods ---
      const handleDismiss = () => {
          clearTimeout(timeoutId.value);
          emit('dismiss', props.id); // Emit the ID for removal
      };

      const setAutoClose = () => {
          clearTimeout(timeoutId.value);
          if (props.duration > 0) {
              timeoutId.value = setTimeout(handleDismiss, props.duration);
          }
      };

      onMounted(() => {
          setAutoClose();
      });

      onBeforeUnmount(() => {
          clearTimeout(timeoutId.value);
      });

      // Watch duration changes to reset timer
      watch(() => props.duration, () => {
         setAutoClose();
      });

      return {
          iconClass,
          handleDismiss
      };
  },
  // Simple template for the alert card
  template: `
    <div class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
      <div class="p-4">
        <div class="flex items-start">
           <!-- Icon -->
           <div class="shrink-0 pt-0.5">
              <i :class="[iconClass, 'h-6 w-6']" aria-hidden="true"></i>
           </div>

           <!-- Message Content -->
           <div class="ml-3 w-0 flex-1">
                <p v-if="title" class="text-sm font-medium text-gray-900">{{ title }}</p>
                <p :class="['text-sm text-gray-600', title ? 'mt-1' : '']">{{ message }}</p>
           </div>

           <!-- Close Button -->
           <div class="ml-4 flex shrink-0">
               <button v-if="dismissible"
                       type="button"
                       @click="handleDismiss"
                       class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none">
                 <span class="sr-only">Close</span>
                 <i class="fas fa-times h-5 w-5" aria-hidden="true"></i>
               </button>
           </div>
        </div>
      </div>
    </div>
  `
}; 