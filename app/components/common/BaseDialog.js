import BaseButton from './BaseButton.js';

const { ref, computed, watch, onMounted, onBeforeUnmount } = Vue;

// Mapping from iconType prop to icon classes and colors
const DialogIconMap = {
    success: {
        iconClass: 'far fa-check-circle',
        bgClass: 'bg-green-100',
        textClass: 'text-green-600'
    },
    error: {
        iconClass: 'far fa-times-circle', // Or fas fa-exclamation-triangle
        bgClass: 'bg-red-100',
        textClass: 'text-red-600'
    },
    warning: {
        iconClass: 'fas fa-exclamation-triangle',
        bgClass: 'bg-yellow-100',
        textClass: 'text-yellow-600' 
    },
    info: {
        iconClass: 'fas fa-info-circle',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-600'
    },
    question: {
        iconClass: 'far fa-question-circle',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-600'
    }
};

export default {
    name: 'BaseDialog',
    components: {
        BaseButton
    },
    props: {
        show: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: 'Dialog Title'
        },
        iconType: {
            type: String,
            default: 'info', // success, error, warning, info, question
            validator: (value) => Object.keys(DialogIconMap).includes(value)
        },
        confirmButtonText: {
            type: String,
            default: 'Confirm'
        },
        cancelButtonText: {
            type: String,
            default: 'Cancel'
        },
        hideCancelButton: {
            type: Boolean,
            default: false
        },
        persistent: {
            type: Boolean,
            default: false
        },
        closeOnEsc: {
            type: Boolean,
            default: true
        },
        variant: {
            type: String,
            default: 'default', // 'default' (icon left), 'centered' (icon top)
            validator: (value) => ['default', 'centered'].includes(value)
        },
        textAlignment: {
            type: String,
            default: null, // 'left', 'center' - null allows variant default
            validator: (value) => ['left', 'center', null].includes(value)
        },
        buttonLayout: {
            type: String,
            default: 'default', // 'default' (right), 'wide-split', 'full-width', 'left-aligned'
            validator: (value) => ['default', 'wide-split', 'full-width', 'left-aligned'].includes(value)
        },
        showDismissButton: {
            type: Boolean,
            default: false
        },
        footerVariant: {
            type: String,
            default: 'default', // 'default', 'gray'
            validator: (value) => ['default', 'gray'].includes(value)
        },
        size: {
            type: String,
            default: 'lg', // Default size
            validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
        },
        zIndex: {
            type: Number,
            default: 50 // Match BaseModal default
        }
    },
    emits: ['confirm', 'cancel', 'close'],
    setup(props, { emit, slots }) {
        const dialogPanelRef = ref(null);
        const cancelButtonRef = ref(null); // For focusing
        const isClosing = ref(false);
        const originalOverflow = ref('');

        const iconDetails = computed(() => DialogIconMap[props.iconType] || DialogIconMap.info);
        
        // Determine text alignment based on prop or variant default
        const effectiveTextAlignment = computed(() => {
            if (props.textAlignment) return props.textAlignment;
            return props.variant === 'centered' ? 'center' : 'left';
        });

        const confirmButtonVariant = computed(() => {
            return props.iconType === 'error' ? 'danger' : 'primary';
        });
        
        const modalSizeClass = computed(() => `sm:max-w-${props.size}`);

        const close = () => {
            if (isClosing.value) return;
            isClosing.value = true;
            emit('close');
            // Wait for transition
            setTimeout(() => {
                isClosing.value = false;
            }, 300);
        };
        
        const handleConfirm = () => {
            emit('confirm');
            close(); // Close after confirm
        };

        const handleCancel = () => {
            emit('cancel');
            close(); // Close after cancel
        };

        const handleOverlayClick = (event) => {
             // Check if click is directly on the overlay background
            if (!props.persistent && event.target === event.currentTarget) {
                close();
            }
        };

        const handleEscapeKey = (event) => {
            if (props.show && props.closeOnEsc && event.key === 'Escape') {
                close();
            }
        };
        
        // Lock/Unlock Body Scroll
        const lockBodyScroll = () => {
          originalOverflow.value = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
        };
        const unlockBodyScroll = () => {
          document.body.style.overflow = originalOverflow.value;
        };

        watch(() => props.show, (newVal) => {
            if (newVal) {
                lockBodyScroll();
                // Focus cancel button on open if available
                nextTick(() => {
                    cancelButtonRef.value?.focus();
                });
            } else {
                unlockBodyScroll();
            }
        });

        onMounted(() => {
            document.addEventListener('keydown', handleEscapeKey);
             if (props.show) lockBodyScroll();
        });

        onBeforeUnmount(() => {
            document.removeEventListener('keydown', handleEscapeKey);
            unlockBodyScroll(); // Ensure unlock
        });
        
         // --- Computed classes --- 
        const containerClasses = computed(() => {
           return ['relative', `z-${props.zIndex}`];
        });
        
        const panelClasses = computed(() => {
            return [
                'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full',
                modalSizeClass.value
            ];
        });
        
        const mainContentClasses = computed(() => {
            const base = [];
            // Padding is different if footer has background
            if (props.footerVariant === 'gray') {
                base.push('bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4');
            } else {
                base.push('px-4 pt-5 pb-4 sm:p-6');
            }
             if (props.variant === 'default') {
                 base.push('sm:flex sm:items-start');
             }
            return base.join(' ');
        });
        
        const iconWrapperClasses = computed(() => {
            const base = ['mx-auto flex shrink-0 items-center justify-center rounded-full'];
            if (props.variant === 'centered') {
                base.push('size-12');
            } else { // default
                base.push('size-12 sm:mx-0 sm:size-10');
            }
            base.push(iconDetails.value.bgClass);
            return base.join(' ');
        });
        
        const iconClasses = computed(() => {
             return ['size-6', iconDetails.value.textClass, iconDetails.value.iconClass];
        });
        
        const textWrapperClasses = computed(() => {
            const base = ['mt-3'];
             if (props.variant === 'centered') {
                 base.push('text-center sm:mt-5');
             } else { // default
                 base.push('text-center sm:mt-0 sm:ml-4');
                 base.push(effectiveTextAlignment.value === 'center' ? 'sm:text-center' : 'sm:text-left');
             }
            return base.join(' ');
        });
        
         const titleClasses = computed(() => {
             return ['text-base font-semibold text-gray-900'];
         });
         
         const descriptionWrapperClasses = computed(() => {
             return ['mt-2'];
         });
         
         const descriptionClasses = computed(() => {
              return ['text-sm text-gray-500'];
         });
        
        const footerClasses = computed(() => {
            const base = ['mt-5 sm:mt-4 px-4 py-3 sm:px-6']; // Base padding
            if (props.footerVariant === 'gray') {
                base.push('bg-gray-50');
            } 
            
            // Layout based on buttonLayout
            if (props.buttonLayout === 'wide-split') {
                base.push('sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3');
            } else if (props.buttonLayout === 'left-aligned') {
                 base.push('sm:flex sm:ml-10 sm:pl-4'); // Needs specific alignment in template
            } else { // default and full-width (flex handles full-width button)
                 base.push('sm:flex sm:flex-row-reverse');
            }
            return base.join(' ');
        });
        
        const getButtonClasses = (type) => {
           const base = ['inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'];
            
           if (props.buttonLayout === 'wide-split') {
               if (type === 'confirm') base.push('sm:col-start-2');
               if (type === 'cancel') base.push('mt-3 sm:col-start-1 sm:mt-0');
           } else if (props.buttonLayout === 'left-aligned') {
               if (type === 'confirm') base.push('sm:w-auto'); 
               if (type === 'cancel') base.push('mt-3 sm:mt-0 sm:ml-3 sm:w-auto'); // Adjust margin for left
           } else { // default and full-width
              if (type === 'confirm') base.push('sm:ml-3 sm:w-auto');
              if (type === 'cancel') base.push('mt-3 sm:mt-0 sm:w-auto');
           }
           
           // Color Variants
           if (type === 'confirm') {
              const variant = confirmButtonVariant.value;
              if (variant === 'danger') base.push('bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600');
              else base.push('bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600');
           } else { // cancel
                base.push('bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50');
           }
           
           return base.join(' ');
        };
        
        const dismissButtonClasses = computed(() => {
           return 'absolute top-0 right-0 hidden pt-4 pr-4 sm:block';
        });

        return {
            dialogPanelRef,
            cancelButtonRef,
            iconDetails,
            effectiveTextAlignment,
            confirmButtonVariant,
            close,
            handleConfirm,
            handleCancel,
            handleOverlayClick,
            // classes
            containerClasses,
            panelClasses,
            mainContentClasses,
            iconWrapperClasses,
            iconClasses,
            textWrapperClasses,
            titleClasses,
            descriptionWrapperClasses,
            descriptionClasses,
            footerClasses,
            getButtonClasses,
            dismissButtonClasses
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
            <div v-if="show" :class="containerClasses" aria-labelledby="dialog-title" role="dialog" aria-modal="true">
                <!-- Overlay -->
                <div class="fixed inset-0 bg-gray-500/75 transition-opacity" @click="handleOverlayClick"></div>

                <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <transition
                            enter-active-class="transition ease-out duration-300"
                            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
                            leave-active-class="transition ease-in duration-200"
                            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
                            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <!-- Dialog Panel -->
                            <div v-if="show" :class="panelClasses" ref="dialogPanelRef">
                                 <!-- Optional Dismiss Button -->
                                <div v-if="showDismissButton" :class="dismissButtonClasses">
                                     <button type="button" class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" @click="close">
                                       <span class="sr-only">Close</span>
                                       <i class="fas fa-times h-6 w-6" aria-hidden="true"></i>
                                     </button>
                                </div>
                                
                                <div :class="mainContentClasses">
                                    <!-- Icon Area -->
                                    <div :class="iconWrapperClasses">
                                      <slot name="icon">
                                         <i :class="iconClasses" aria-hidden="true"></i>
                                       </slot>
                                    </div>
                                    <!-- Text Area -->
                                    <div :class="textWrapperClasses">
                                        <slot name="title">
                                             <h3 :class="titleClasses" id="dialog-title">{{ title }}</h3>
                                        </slot>
                                        <div :class="descriptionWrapperClasses">
                                             <div :class="descriptionClasses">
                                                <slot>Default dialog message.</slot>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Footer / Buttons -->
                                <div :class="footerClasses">
                                   <slot name="buttons">
                                      <button v-if="buttonLayout !== 'full-width'" 
                                              type="button" 
                                              :class="getButtonClasses('confirm')" 
                                              @click="handleConfirm">
                                          {{ confirmButtonText }}
                                      </button>
                                      <button v-if="!hideCancelButton && buttonLayout !== 'full-width'" 
                                              type="button" 
                                              :class="getButtonClasses('cancel')" 
                                              @click="handleCancel" 
                                              ref="cancelButtonRef">
                                           {{ cancelButtonText }}
                                       </button>
                                       <button v-if="buttonLayout === 'full-width'" 
                                              type="button" 
                                              :class="getButtonClasses('confirm')" 
                                              @click="handleConfirm">
                                          {{ confirmButtonText }}
                                      </button>
                                    </slot>
                                </div>
                            </div>
                         </transition>
                    </div>
                </div>
            </div>
        </transition>
    `
}; 