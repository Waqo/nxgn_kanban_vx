const { computed } = Vue;

export default {
  name: 'BasePagination',
  props: {
    /**
     * The current active page number (1-indexed).
     */
    currentPage: {
      type: Number,
      required: true,
      validator: (val) => val >= 1,
    },
    /**
     * The total number of pages.
     */
    totalPages: {
      type: Number,
      required: true,
      validator: (val) => val >= 1,
    },
    /**
     * Total number of items across all pages (optional, for results text).
     */
    totalItems: {
      type: Number,
      default: null,
      validator: (val) => val === null || val >= 0,
    },
    /**
     * Number of items displayed per page (optional, for results text).
     */
    itemsPerPage: {
      type: Number,
      default: 10, // Default assumption if totalItems is provided
      validator: (val) => val >= 1,
    },
    /**
     * The maximum number of page number links/buttons to display.
     * Should ideally be an odd number to keep the current page centered.
     */
    maxVisiblePages: {
      type: Number,
      default: 5,
      validator: (val) => val >= 1,
    },
    /**
     * Layout and styling variant.
     * - 'default': Buttons with ring/shadow, results text on left.
     * - 'centered': Centered page links with border-top, prev/next text buttons.
     * - 'simple': Simple prev/next text buttons with ring, results text on left.
     */
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'centered', 'simple'].includes(value),
    },
    /**
     * Text for the 'Previous' button.
     */
    prevText: {
      type: String,
      default: 'Previous',
    },
    /**
     * Text for the 'Next' button.
     */
    nextText: {
      type: String,
      default: 'Next',
    },
    /**
     * Custom CSS classes for the main container element.
     */
    containerClass: {
      type: String,
      default: 'border-t border-gray-200 bg-white px-4 py-3 sm:px-6',
    },
  },
  emits: ['update:currentPage'],
  setup(props, { emit }) {
    const isFirstPage = computed(() => props.currentPage === 1);
    const isLastPage = computed(() => props.currentPage === props.totalPages);

    // Calculate start and end item numbers for the results text
    const startItem = computed(() => {
      if (props.totalItems === null || props.totalItems === 0) return 0;
      return (props.currentPage - 1) * props.itemsPerPage + 1;
    });

    const endItem = computed(() => {
      if (props.totalItems === null || props.totalItems === 0) return 0;
      const end = props.currentPage * props.itemsPerPage;
      return Math.min(end, props.totalItems);
    });

    // Complex logic to determine which page numbers to show
    const visiblePages = computed(() => {
      const current = props.currentPage;
      const total = props.totalPages;
      const maxVisible = props.maxVisiblePages;
      const pages = [];

      if (total <= maxVisible) {
        // Show all pages if total is less than or equal to maxVisible
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        let startPage, endPage;
        const halfMax = Math.floor(maxVisible / 2);

        if (current <= halfMax) {
          // Near the beginning
          startPage = 1;
          endPage = maxVisible - 1; // Leave space for ellipsis and last page
          pages.push(...Array.from({ length: endPage }, (_, i) => i + 1));
          pages.push('...');
          pages.push(total);
        } else if (current + halfMax >= total) {
          // Near the end
          startPage = total - (maxVisible - 2); // Leave space for first page and ellipsis
          endPage = total;
          pages.push(1);
          pages.push('...');
          for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
          }
        } else {
          // In the middle
          startPage = current - Math.floor((maxVisible - 3) / 2);
          endPage = current + Math.ceil((maxVisible - 3) / 2);
          pages.push(1);
          pages.push('...');
          for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(total);
        }
      }
      return pages;
    });

    const goToPage = (page) => {
      if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
        emit('update:currentPage', page);
      }
    };

    const goToPrevious = () => {
      if (!isFirstPage.value) {
        goToPage(props.currentPage - 1);
      }
    };

    const goToNext = () => {
      if (!isLastPage.value) {
        goToPage(props.currentPage + 1);
      }
    };

    // --- CSS Class Computations based on Variant ---

    const containerClasses = computed(() => {
      const base = ['flex items-center justify-between'];
       if (props.variant !== 'centered') {
            base.push(props.containerClass); // Apply default padding/border unless centered
       } else {
            base.push('border-t border-gray-200 px-4 sm:px-0'); // Specific style for centered
       }
      return base.join(' ');
    });

    const resultsTextContainerClasses = computed(() => {
        return props.variant === 'centered' ? '-mt-px flex w-0 flex-1' : 'hidden sm:block';
    });

    const resultsTextClasses = computed(() => {
      return 'text-sm text-gray-700';
    });

    const mobileButtonContainerClasses = computed(() => {
        const base = ['flex flex-1 justify-between'];
        if(props.variant === 'default' || props.variant === 'simple') {
            base.push('sm:hidden');
        }
        if(props.variant === 'centered') {
             base.push('sm:hidden'); // Centered also hides this on sm+
             // For centered, prev/next text buttons are always shown, handled elsewhere
        }
        return base.join(' ');
    });

    const mobilePrevButtonClasses = computed(() => {
        return 'relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50';
    });

    const mobileNextButtonClasses = computed(() => {
        return 'relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50';
    });

    const desktopContainerClasses = computed(() => {
      if (props.variant === 'default') {
        return 'hidden sm:flex sm:flex-1 sm:items-center sm:justify-between';
      }
      if (props.variant === 'centered') {
        return 'hidden md:-mt-px md:flex'; // Uses md breakpoint
      }
      if (props.variant === 'simple') {
        return 'flex flex-1 justify-between sm:justify-end';
      }
      return '';
    });

    const desktopNavClasses = computed(() => {
        if (props.variant === 'default') {
            return 'isolate inline-flex -space-x-px rounded-md shadow-xs';
        }
        // Centered variant handles nav items directly
        return '';
    });

    const desktopPrevButtonClasses = computed(() => {
      if (props.variant === 'default') {
        return 'relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
      }
       if (props.variant === 'centered') {
           return 'inline-flex items-center border-t-2 border-transparent pt-4 pr-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed';
       }
       if (props.variant === 'simple') {
           return 'relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
       }
      return '';
    });

    const desktopNextButtonClasses = computed(() => {
      if (props.variant === 'default') {
        return 'relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
      }
      if (props.variant === 'centered') {
           return 'inline-flex items-center border-t-2 border-transparent pt-4 pl-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed';
       }
      if (props.variant === 'simple') {
           return 'relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
       }
      return '';
    });

    const desktopPageButtonClasses = (page, isCurrent) => {
      const base = ['relative', 'inline-flex', 'items-center', 'px-4', 'py-2', 'text-sm', 'font-semibold'];
      if (props.variant === 'default') {
        base.push('focus:z-20');
        if (isCurrent) {
          base.push('z-10', 'bg-indigo-600', 'text-white', 'focus-visible:outline', 'focus-visible:outline-2', 'focus-visible:outline-offset-2', 'focus-visible:outline-indigo-600');
        } else {
          base.push('text-gray-900', 'ring-1', 'ring-inset', 'ring-gray-300', 'hover:bg-gray-50', 'focus:outline-offset-0');
        }
      } else if (props.variant === 'centered') {
          base.push('border-t-2', 'pt-4');
          if (isCurrent) {
              base.push('border-indigo-500', 'text-indigo-600');
          } else {
              base.push('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
          }
      }
      return base.join(' ');
    };

    const ellipsisClasses = computed(() => {
      if (props.variant === 'default') {
          return 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-300 ring-inset focus:outline-offset-0';
      }
      if (props.variant === 'centered') {
          return 'inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500';
      }
      return ''; // No specific ellipsis style for simple
    });

    return {
      startItem,
      endItem,
      isFirstPage,
      isLastPage,
      visiblePages,
      goToPage,
      goToPrevious,
      goToNext,
      // Computed classes
      containerClasses,
      resultsTextContainerClasses,
      resultsTextClasses,
      mobileButtonContainerClasses,
      mobilePrevButtonClasses,
      mobileNextButtonClasses,
      desktopContainerClasses,
      desktopNavClasses,
      desktopPrevButtonClasses,
      desktopNextButtonClasses,
      desktopPageButtonClasses,
      ellipsisClasses
    };
  },
  template: `
    <div :class="containerClasses">
      <!-- Mobile View: Simple Prev/Next Buttons -->
      <div :class="mobileButtonContainerClasses">
        <button 
           @click="goToPrevious" 
           :disabled="isFirstPage"
           :class="mobilePrevButtonClasses"
           >
           {{ prevText }}
        </button>
        <button 
           @click="goToNext" 
           :disabled="isLastPage"
           :class="mobileNextButtonClasses"
           >
           {{ nextText }}
        </button>
      </div>

      <!-- Desktop View: Results Text and Button Group / Links -->
      <div :class="desktopContainerClasses">
        <!-- Results Text (Left side for default/simple) -->
        <div v-if="variant !== 'centered'">
          <p :class="resultsTextClasses">
            <slot name="results-text" :startItem="startItem" :endItem="endItem" :totalItems="totalItems">
                Showing
                <span class="font-medium">{{ startItem }}</span>
                to
                <span class="font-medium">{{ endItem }}</span>
                of
                <span class="font-medium">{{ totalItems }}</span>
                results
            </slot>
          </p>
        </div>
        
        <!-- Prev/Next Text Buttons (Centered Variant - Left) -->
         <div v-if="variant === 'centered'" class="-mt-px flex w-0 flex-1">
            <button @click="goToPrevious" :disabled="isFirstPage" :class="desktopPrevButtonClasses">
                 <slot name="prev-button" :disabled="isFirstPage">
                    <!-- Default Icon -->
                     <i class="fas fa-arrow-left mr-3 h-5 w-5 text-gray-400" aria-hidden="true"></i>
                     {{ prevText }}
                 </slot>
             </button>
         </div>

        <!-- Page Number Navigation (Right side for default/simple, Center for centered) -->
        <div>
          <nav :class="desktopNavClasses" aria-label="Pagination">
             <!-- Prev Button (Default/Simple Variants) -->
             <button 
                v-if="variant === 'default' || variant === 'simple'" 
                @click="goToPrevious" 
                :disabled="isFirstPage" 
                :class="desktopPrevButtonClasses"
                >
                 <slot name="prev-button" :disabled="isFirstPage">
                     <span class="sr-only">{{ prevText }}</span>
                     <!-- Default Icon (Chevron for default, Text for simple) -->
                     <i v-if="variant === 'default'" class="fas fa-chevron-left h-5 w-5" aria-hidden="true"></i>
                     <span v-else>{{ prevText }}</span>
                 </slot>
             </button>

            <!-- Page Numbers/Links -->
            <template v-for="page in visiblePages" :key="page">
              <span v-if="page === '...'" :class="ellipsisClasses">
                 <slot name="ellipsis">...</slot>
              </span>
              <button 
                v-else 
                @click="goToPage(page)" 
                :class="desktopPageButtonClasses(page, page === currentPage)"
                :aria-current="page === currentPage ? 'page' : undefined"
                >
                 <slot name="page-button" :page="page" :isCurrent="page === currentPage">
                     {{ page }}
                 </slot>
              </button>
            </template>

            <!-- Next Button (Default/Simple Variants) -->
            <button 
                v-if="variant === 'default' || variant === 'simple'" 
                @click="goToNext" 
                :disabled="isLastPage" 
                :class="desktopNextButtonClasses"
                >
                 <slot name="next-button" :disabled="isLastPage">
                     <span class="sr-only">{{ nextText }}</span>
                     <!-- Default Icon (Chevron for default, Text for simple) -->
                     <i v-if="variant === 'default'" class="fas fa-chevron-right h-5 w-5" aria-hidden="true"></i>
                      <span v-else>{{ nextText }}</span>
                 </slot>
            </button>
          </nav>
        </div>
        
        <!-- Prev/Next Text Buttons (Centered Variant - Right) -->
         <div v-if="variant === 'centered'" class="-mt-px flex w-0 flex-1 justify-end">
            <button @click="goToNext" :disabled="isLastPage" :class="desktopNextButtonClasses">
                 <slot name="next-button" :disabled="isLastPage">
                     {{ nextText }}
                     <!-- Default Icon -->
                     <i class="fas fa-arrow-right ml-3 h-5 w-5 text-gray-400" aria-hidden="true"></i>
                 </slot>
             </button>
         </div>
         
      </div>
    </div>
  `
}; 