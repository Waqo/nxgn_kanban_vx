const { computed } = Vue;

export default {
  name: 'BaseFormLayouts',
  props: {
    /**
     * The main layout variant for the form sections.
     * - 'stacked': Default vertical stacking of sections.
     * - 'two-column': Section titles/descriptions on the left, content on the right.
     * - 'two-column-cards': Like 'two-column', but content area is wrapped in cards.
     * - 'labels-on-left': Field labels aligned to the left within section content (requires specific slot structure).
     */
    variant: {
      type: String,
      default: 'stacked',
      validator: (value) => [
        'stacked',
        'two-column',
        'two-column-cards',
        'labels-on-left'
        // Note: 'stacked-dark' is handled via parent context/theming
        // Note: 'two-column-sidebar' is a page layout, not handled here
      ].includes(value)
    },
    /**
     * The HTML tag for the root element.
     */
    tag: {
      type: String,
      default: 'div' // Use 'div' by default, place <form> outside if needed
    },
    /**
     * Whether to add dividing lines between sections or field groups within certain variants.
     */
    withDividers: {
      type: Boolean,
      default: true
    },
    /**
     * Base background color class for card variants.
     */
    cardBg: {
        type: String,
        default: 'bg-white'
    },
    /**
     * Shadow class for card variants.
     */
    cardShadow: {
        type: String,
        default: 'shadow-xs' // e.g., shadow-xs, shadow-sm, shadow-md
    },
    /**
     * Ring class for card variants.
     */
    cardRing: {
        type: String,
        default: 'ring-1 ring-gray-900/5'
    },
    /**
     * Rounding class for card variants.
     */
    cardRounded: {
        type: String,
        default: 'sm:rounded-xl'
    },
     /**
     * Custom CSS classes to apply to the root element.
     */
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const baseClasses = computed(() => {
      const classes = ['base-form-layout'];
      if (props.variant === 'two-column-cards' && props.withDividers) {
        classes.push('divide-y divide-gray-900/10');
      }
      if (props.className) {
        classes.push(props.className);
      }
      return classes.join(' ');
    });

    // Classes specific to a form section wrapper (used internally by slots potentially)
    const sectionWrapperClasses = computed(() => {
      switch (props.variant) {
        case 'stacked':
          return `space-y-12 ${props.withDividers ? 'divide-y divide-gray-900/10' : ''}`;
        case 'two-column':
        case 'labels-on-left': // labels-on-left handles grid internally per field
          return `space-y-10 ${props.withDividers ? 'sm:divide-y sm:divide-gray-900/10' : ''}`;
        case 'two-column-cards':
          return 'space-y-10'; // Spacing handled by grid gap, dividing lines on root
        default:
          return 'space-y-12';
      }
    });

    // Base class for the content area within a section (useful for slots)
    const sectionContentBaseClass = computed(() => {
        return 'mt-10'; // Common top margin for content
    });

    // Grid class for fields within a standard section (stacked, two-column)
    const defaultFieldGridClass = computed(() => {
        return 'grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6';
    });

    return {
      baseClasses,
      sectionWrapperClasses, // Expose for potential use within slots if needed
      sectionContentBaseClass,
      defaultFieldGridClass
    };
  },
  template: `
    <component :is="tag" :class="baseClasses">

      <!-- Default Slot: Expects structured content -->
      <!-- Structure for 'stacked' and 'labels-on-left' -->
      <div v-if="variant === 'stacked' || variant === 'labels-on-left'" :class="sectionWrapperClasses">
          <slot :sectionContentBaseClass="sectionContentBaseClass" :defaultFieldGridClass="defaultFieldGridClass">
              <!-- Example Section Structure (for parent implementation guide) -->
              <!-- 
              <div class="form-section border-b border-gray-900/10 pb-12"> // Or use sm:divide-y for labels-on-left
                  <h2 class="text-base/7 font-semibold text-gray-900">Section Title</h2>
                  <p class="mt-1 text-sm/6 text-gray-600">Section description.</p>
                  <div :class="sectionContentBaseClass"> // Use computed base class
                     // If 'stacked', use defaultFieldGridClass here:
                     <div :class="defaultFieldGridClass"> 
                        <div class="sm:col-span-4"> Field... </div> 
                        <div class="col-span-full"> Field... </div> 
                     </div>

                     // If 'labels-on-left', structure each field row like this:
                     <div class="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6"> // Field row wrapper
                       <label class="block text-sm/6 font-medium text-gray-900 sm:pt-1.5">Label</label>
                       <div class="mt-2 sm:col-span-2 sm:mt-0"> Input + Hint </div>
                     </div>
                  </div>
              </div> 
              -->
          </slot>
      </div>

      <!-- Structure for 'two-column' -->
      <div v-else-if="variant === 'two-column'" :class="sectionWrapperClasses">
         <slot :sectionContentBaseClass="sectionContentBaseClass" :defaultFieldGridClass="defaultFieldGridClass">
              <!-- Example Section Structure (for parent implementation guide) -->
              <!-- 
              <div class="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
                   // Left Side (Title/Description)
                   <div>
                       <h2 class="text-base/7 font-semibold text-gray-900">Section Title</h2>
                       <p class="mt-1 text-sm/6 text-gray-600">Section description.</p>
                   </div>
                   // Right Side (Fields)
                   <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
                      <div class="sm:col-span-3"> Field... </div>
                      <div class="sm:col-span-3"> Field... </div>
                      <div class="col-span-full"> Field... </div>
                   </div>
              </div> 
              -->
         </slot>
      </div>
      
       <!-- Structure for 'two-column-cards' -->
      <div v-else-if="variant === 'two-column-cards'" :class="sectionWrapperClasses">
         <slot :cardBg="cardBg" :cardShadow="cardShadow" :cardRing="cardRing" :cardRounded="cardRounded">
              <!-- Example Section Structure (for parent implementation guide) -->
              <!-- 
              <div class="grid grid-cols-1 gap-x-8 gap-y-8 py-10 md:grid-cols-3">
                   // Left Side (Title/Description) - Outside the card
                   <div class="px-4 sm:px-0">
                       <h2 class="text-base/7 font-semibold text-gray-900">Section Title</h2>
                       <p class="mt-1 text-sm/6 text-gray-600">Section description.</p>
                   </div>
                   
                   // Right Side (Card containing fields)
                   <div :class="[cardBg, cardShadow, cardRing, cardRounded, 'md:col-span-2']"> // Use props for card style
                        // Optionally add <form> tag here if each card is a separate form
                        <div class="px-4 py-6 sm:p-8">
                            <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                               <div class="sm:col-span-3"> Field... </div>
                               <div class="sm:col-span-3"> Field... </div>
                               <div class="col-span-full"> Field... </div>
                            </div>
                        </div>
                        // Optional Card Footer for Actions
                        <div v-if="$slots.cardActions" class="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
                           <slot name="cardActions"></slot>
                        </div>
                   </div>
              </div> 
              -->
         </slot>
      </div>
      
      <!-- Footer Actions Slot (Common for non-card layouts) -->
      <div v-if="variant !== 'two-column-cards' && $slots.actions" class="mt-6 flex items-center justify-end gap-x-6">
         <slot name="actions">
           <!-- Default Actions Example -->
           <!--
           <button type="button" class="text-sm/6 font-semibold text-gray-900">Cancel</button>
           <button type="submit" class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save</button>
           -->
         </slot>
      </div>
      
    </component>
  `
}; 