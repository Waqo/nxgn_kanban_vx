const { ref, computed, watch, onMounted, onBeforeUnmount } = Vue;

export default {
  name: 'BaseDrawer',
  props: {
    /**
     * Controls the visibility of the drawer.
     * Use v-model:show="yourVisibilityVariable".
     */
    show: {
      type: Boolean,
      default: false,
    },
    /**
     * Title displayed in the drawer header.
     * Ignored if the #header or #title slot is used.
     */
    title: {
      type: String,
      default: 'Drawer Title'
    },
    /**
     * Position of the drawer on the screen.
     */
    position: {
      type: String,
      default: 'right',
      validator: (value) => ['left', 'right'].includes(value)
    },
    /**
     * Max width of the drawer panel (Tailwind class, e.g., 'md', 'lg', 'xl', '2xl').
     */
    width: {
      type: String,
      default: 'md', // Corresponds to max-w-md
      validator: (value) => ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'].includes(value)
    },
    /**
     * Show the semi-transparent background overlay.
     */
    withOverlay: {
      type: Boolean,
      default: true
    },
    /**
     * Allow closing the drawer by clicking the overlay.
     */
    closeOnOverlayClick: {
      type: Boolean,
      default: true
    },
    /**
     * Allow closing the drawer by pressing the Escape key.
     */
    closeOnEsc: {
      type: Boolean,
      default: true
    },
    /**
     * Hide the default close button (X).
     */
    hideCloseButton: {
      type: Boolean,
      default: false
    },
    /**
     * Position the close button outside the main panel content.
     */
    closeButtonOutside: {
        type: Boolean,
        default: false
    },
    /**
     * Style variant for the header section.
     * - 'default': Standard padding and background.
     * - 'branded': Colored background (e.g., indigo).
     * - 'none': No specific header styling (useful with #header slot).
     */
    headerVariant: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'branded', 'none'].includes(value)
    },
    /**
     * Make the footer sticky at the bottom.
     */
    stickyFooter: {
        type: Boolean,
        default: false
    },
    /**
     * Base z-index for the drawer components.
     */
    zIndex: {
      type: Number,
      default: 40 // Typically below modals (z-50)
    },
    /**
     * Transition duration class(es).
     */
    transitionDuration: {
      type: String,
      default: 'duration-500 sm:duration-700'
    }
  },
  emits: ['update:show', 'close', 'closed', 'opened'],
  setup(props, { emit, slots }) {
    const drawerRef = ref(null);
    const panelRef = ref(null);
    const isClosing = ref(false);
    const hasEmittedOpened = ref(false);
    const originalOverflow = ref('');

    const close = () => {
      if (isClosing.value) return;
      isClosing.value = true;
      emit('close');
      emit('update:show', false);
       // Use timeout based on prop duration (needs parsing or fixed value)
       // For simplicity, using a fixed timeout matching common duration
       setTimeout(() => {
         isClosing.value = false;
         emit('closed');
       }, 700); 
    };

    const handleOverlayClick = () => {
      if (props.closeOnOverlayClick) {
        close();
      }
    };

    const handleEscapeKey = (event) => {
      if (props.show && props.closeOnEsc && event.key === 'Escape') {
        close();
      }
    };

     // Lock body scroll when drawer is open
    const lockBodyScroll = () => {
      originalOverflow.value = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    };

    // Restore body scroll when drawer is closed
    const unlockBodyScroll = () => {
      document.body.style.overflow = originalOverflow.value;
    };

    watch(() => props.show, (newVal) => {
      if (newVal) {
        lockBodyScroll();
        // Emit opened slightly after transition starts
        setTimeout(() => {
          if (!hasEmittedOpened.value) {
             emit('opened');
             hasEmittedOpened.value = true;
          }
        }, 50); // Adjust delay as needed
      } else {
         unlockBodyScroll();
         hasEmittedOpened.value = false;
      }
    });

    onMounted(() => {
      document.addEventListener('keydown', handleEscapeKey);
      if (props.show) lockBodyScroll();
    });

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleEscapeKey);
      unlockBodyScroll(); // Ensure unlock on unmount
    });

    // --- Computed Classes --- 

    const overlayTransitionClasses = computed(() => ({
      enter: `ease-in-out ${props.transitionDuration}`,
      enterFrom: 'opacity-0',
      enterTo: 'opacity-100',
      leave: `ease-in-out ${props.transitionDuration}`,
      leaveFrom: 'opacity-100',
      leaveTo: 'opacity-0'
    }));
    
    const panelContainerClasses = computed(() => {
        const base = 'pointer-events-none fixed inset-y-0 flex max-w-full';
        return props.position === 'right' ? `${base} right-0 pl-10 sm:pl-16` : `${base} left-0 pr-10 sm:pr-16`;
    });

    const panelTransitionClasses = computed(() => ({
      enter: `transform transition ease-in-out ${props.transitionDuration}`,
      enterFrom: props.position === 'right' ? 'translate-x-full' : '-translate-x-full',
      enterTo: 'translate-x-0',
      leave: `transform transition ease-in-out ${props.transitionDuration}`,
      leaveFrom: 'translate-x-0',
      leaveTo: props.position === 'right' ? 'translate-x-full' : '-translate-x-full'
    }));

    const panelClasses = computed(() => {
      return [
          'pointer-events-auto w-screen',
          `max-w-${props.width}`
      ].join(' ');
    });
    
     const panelInnerClasses = computed(() => {
         return 'flex h-full flex-col overflow-y-scroll bg-white shadow-xl';
     });

    const closeButtonOutsideContainerClasses = computed(() => {
        const base = 'absolute top-0 flex pt-4 pr-2 sm:pr-4';
        return props.position === 'right' ? `${base} left-0 -ml-8 sm:-ml-10` : `${base} right-0 -mr-8 sm:-mr-10`;
    });
    
    const headerContainerClasses = computed(() => {
        const classes = ['px-4 sm:px-6'];
        if (props.headerVariant === 'branded') {
            classes.push('py-6 bg-indigo-700');
        } else if (props.headerVariant === 'default') {
             classes.push('py-6'); // Default padding
        } else { 
             // 'none' or other variants might have no padding here
        }
        // Remove padding if noHeaderPadding is true
        if (props.noHeaderPadding) {
           return props.headerVariant === 'branded' ? 'bg-indigo-700' : ''; // Keep bg if branded
        }
        return classes.join(' ');
    });
    
     const headerFlexClasses = computed(() => {
        return 'flex items-start justify-between'; // Default uses start alignment
    });

    const titleClasses = computed(() => {
        const base = 'text-base font-semibold';
        const color = props.headerVariant === 'branded' ? 'text-white' : 'text-gray-900';
        return [base, color].join(' ');
    });

     const descriptionClasses = computed(() => {
         const base = 'text-sm';
         const color = props.headerVariant === 'branded' ? 'text-indigo-300' : 'text-gray-500';
         return [base, color, 'mt-1'].join(' ');
     });

    const closeButtonContainerClasses = computed(() => {
      return 'ml-3 flex h-7 items-center';
    });

    const closeButtonClasses = computed(() => {
        const base = 'relative rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500';
        let colors = '';
        if (props.closeButtonOutside) {
             colors = 'text-gray-300 hover:text-white';
        } else if (props.headerVariant === 'branded') {
            colors = 'bg-indigo-700 text-indigo-200 hover:text-white focus:ring-white';
        } else {
             colors = 'bg-white text-gray-400 hover:text-gray-500 focus:ring-offset-2';
        }
        return [base, colors].join(' ');
    });

    const contentContainerClasses = computed(() => {
      const classes = ['relative flex-1'];
      // Only add padding if the header has padding (or no header)
      if (props.headerVariant !== 'none' && !props.noHeaderPadding) {
          classes.push('mt-6 px-4 sm:px-6');
      } else {
           classes.push('px-4 sm:px-6'); // Add padding if header has none
      }
      return classes.join(' ');
    });
    
     const footerContainerClasses = computed(() => {
         const classes = ['flex shrink-0 justify-end px-4 py-4'];
         if (props.stickyFooter) {
             classes.push('border-t border-gray-200'); // Add border if sticky
         }
         return classes.join(' ');
     });

    return {
      drawerRef,
      panelRef,
      close,
      handleOverlayClick,
      // transitions
      overlayTransitionClasses,
      panelTransitionClasses,
      // classes
      panelContainerClasses,
      panelClasses,
      panelInnerClasses,
      closeButtonOutsideContainerClasses,
      headerContainerClasses,
      headerFlexClasses,
      titleClasses,
      descriptionClasses,
      closeButtonContainerClasses,
      closeButtonClasses,
      contentContainerClasses,
      footerContainerClasses,
    };
  },
  template: `
    <TransitionRoot as="template" :show="show">
      <Dialog class="relative" :style="{ zIndex: zIndex }" @close="handleOverlayClick">
        <!-- Overlay -->
        <TransitionChild as="template" v-bind="overlayTransitionClasses">
          <div v-if="withOverlay" class="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-hidden">
          <div class="absolute inset-0 overflow-hidden">
            <div :class="panelContainerClasses">
              <TransitionChild as="template" v-bind="panelTransitionClasses">
                <DialogPanel :class="panelClasses" ref="panelRef">
                   <!-- Optional Close Button Outside -->
                   <TransitionChild v-if="closeButtonOutside && !hideCloseButton" as="template" enter="ease-in-out duration-500" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in-out duration-500" leave-from="opacity-100" leave-to="opacity-0">
                      <div :class="closeButtonOutsideContainerClasses">
                          <slot name="close-button" :closeFn="close">
                            <button type="button" :class="closeButtonClasses" @click="close">
                              <span class="absolute -inset-2.5" />
                              <span class="sr-only">Close panel</span>
                              <i class="fas fa-times size-6" aria-hidden="true"></i>
                            </button>
                          </slot>
                      </div>
                   </TransitionChild>
                   
                   <!-- Main Panel Content -->
                   <div :class="[panelInnerClasses, stickyFooter ? 'divide-y divide-gray-200' : '']">
                       <!-- Header Area -->
                       <div v-if="headerVariant !== 'none' || $slots.header" :class="[headerContainerClasses, stickyFooter ? '' : 'flex-shrink-0']">
                          <slot name="header">
                             <div :class="headerFlexClasses">
                                <slot name="title">
                                    <DialogTitle :class="titleClasses">{{ title }}</DialogTitle>
                                    <!-- Optional description in header -->
                                    <p v-if="$slots.headerDescription" :class="descriptionClasses"><slot name="headerDescription"></slot></p>
                                </slot>
                                <div v-if="!hideCloseButton && !closeButtonOutside" :class="closeButtonContainerClasses">
                                  <slot name="close-button" :closeFn="close">
                                     <button type="button" :class="closeButtonClasses" @click="close">
                                         <span class="absolute -inset-2.5" />
                                         <span class="sr-only">Close panel</span>
                                         <i class="fas fa-times size-6" aria-hidden="true"></i>
                                     </button>
                                  </slot>
                                </div>
                             </div>
                          </slot>
                       </div>
                       
                       <!-- Body / Default Slot -->
                       <div :class="[contentContainerClasses, stickyFooter ? 'flex-1 overflow-y-auto' : 'flex-1']">
                           <slot></slot> 
                       </div>
                       
                       <!-- Footer Slot -->
                       <div v-if="$slots.footer" :class="[footerContainerClasses, stickyFooter ? 'flex-shrink-0' : '']">
                           <slot name="footer"></slot>
                       </div>
                   </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  `
}; 