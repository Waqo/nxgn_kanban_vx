// app/components/common/BaseNotification.js

const { computed, ref, onMounted, onBeforeUnmount, watch } = Vue;

// Mapping from color prop to icon classes
const AlertIconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-times-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle',
};

export default {
  name: 'BaseNotification',
  props: {
      // Unique ID for the notification (important for managing list)
      id: {
          type: [String, Number],
          required: true
      },
      type: { 
          type: String, 
          default: 'info', // success, error, warning, info
          validator: (value) => Object.keys(AlertIconMap).includes(value)
      }, 
      title: { type: String, default: '' },
      duration: { type: Number, default: 5000 }, // Duration in ms, 0 for persistent
      dismissible: { type: Boolean, default: true },
      // --- Add props for specific layout needs if variants aren't enough ---
      // e.g., showAvatar: { type: Boolean, default: false }, avatarSrc: { type: String, default: ''}
  },
  emits: ['dismiss'],
  setup(props, { emit, slots }) {
      const timeoutId = ref(null);

      const iconName = computed(() => AlertIconMap[props.type] || AlertIconMap.info);

      // --- Style Computations --- 
      // These are provided to slots for convenience, but slots can override
      const iconColorClass = computed(() => {
           switch(props.type?.toLowerCase()) {
              case 'success': return 'text-green-400'; 
              case 'error': return 'text-red-400'; 
              case 'warning': return 'text-yellow-400'; 
              case 'info': 
              default: return 'text-blue-400'; 
          }
      });
      
      const titleColorClass = computed(() => {
           switch(props.type?.toLowerCase()) {
              case 'success': return 'text-green-800'; 
              case 'error': return 'text-red-800'; 
              case 'warning': return 'text-yellow-800'; 
              case 'info': 
              default: return 'text-blue-800'; // Or maybe gray-900 for info?
          }
      });
      
       const contentColorClass = computed(() => {
           switch(props.type?.toLowerCase()) {
              case 'success': return 'text-green-700'; 
              case 'error': return 'text-red-700'; 
              case 'warning': return 'text-yellow-700'; 
              case 'info': 
              default: return 'text-blue-700'; // Or maybe gray-500 for info?
          }
      });
      
       const dismissButtonClasses = computed(() => {
           // Base styling for the default dismiss button
           return 'inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none';
       });

      // --- Methods --- 
      const handleDismiss = () => {
          clearTimeout(timeoutId.value);
          emit('dismiss', props.id); // Emit the ID for removal
      };

      const setAutoClose = () => {
          clearTimeout(timeoutId.value);
          // console.log(`BaseNotification (${props.id}): Checking duration in setAutoClose:`, props.duration, typeof props.duration);
          if (props.duration > 0) {
              // console.log(`BaseNotification (${props.id}): Setting timeout for ${props.duration}ms`);
              timeoutId.value = setTimeout(() => {
                  // console.log(`BaseNotification (${props.id}): Timeout expired, dismissing.`);
                  handleDismiss();
              }, props.duration);
          } else {
               // console.log(`BaseNotification (${props.id}): Duration is not > 0, not setting timeout.`);
          }
      };

      onMounted(() => {
          // console.log(`BaseNotification (${props.id}): Mounted with duration:`, props.duration, typeof props.duration);
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
          iconName,
          iconColorClass,
          titleColorClass,
          contentColorClass,
          dismissButtonClasses,
          handleDismiss
      };
  },
  // Template renders only the notification panel itself
  template: `
    <div class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
      <div class="p-4">
        <div class="flex items-start">
           <!-- Leading Slot (Icon/Avatar) -->
           <div class="shrink-0">
              <slot name="leading" :iconName="iconName" :iconColorClass="iconColorClass">
                <!-- Default Icon -->
                <i :class="[iconName, iconColorClass, 'h-6 w-6']" aria-hidden="true"></i>
              </slot>
           </div>
           
           <!-- Main Content Area -->
           <div class="ml-3 w-0 flex-1 pt-0.5">
                <slot name="content" :title="title" :titleColorClass="titleColorClass" :contentColorClass="contentColorClass">
                    <!-- Default Title -->
                    <p v-if="title" :class="['text-sm font-medium', titleColorClass]">{{ title }}</p>
                    <!-- Default Slot for message -->
                    <div :class="['text-sm', contentColorClass, title ? 'mt-1' : '']">
                        <slot></slot>
                    </div>
                </slot>
                <!-- Actions Slot (Below Content) -->
                <div v-if="$slots.actions" class="mt-3 flex space-x-7">
                     <slot name="actions"></slot>
                </div>
           </div>
           
           <!-- Trailing Actions / Close Button -->
           <div class="ml-4 flex shrink-0">
              <slot name="trailing-actions">
                 <!-- Default Close Button -->
                 <slot name="close" :dismissFn="handleDismiss">
                     <button v-if="dismissible" 
                             type="button" 
                             @click="handleDismiss" 
                             :class="dismissButtonClasses">
                       <span class="sr-only">Close</span>
                       <i class="fas fa-times h-5 w-5" aria-hidden="true"></i>
                     </button>
                 </slot>
              </slot>
           </div>
        </div>
      </div>
    </div>
  `
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseNotification = BaseNotification; 