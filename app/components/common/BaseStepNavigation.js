const { computed } = Vue;

export default {
  name: 'BaseStepNavigation',
  props: {
    /**
     * Array of step objects.
     * Required shape: { id: string|number, name: string, status: 'complete'|'current'|'upcoming' }
     * Optional: { href?: string, description?: string, icon?: string }
     */
    steps: {
      type: Array,
      required: true,
      default: () => [],
      validator: (arr) => arr.every(s => typeof s === 'object' && s.id !== undefined && s.name && s.status)
    },
    /**
     * Visual style variant.
     * - 'simple': Minimal text and line separators.
     * - 'panels': Each step is a distinct panel, often with icons/numbers.
     * - 'panels-bordered': Like panels, but with different border/layout for responsiveness.
     * - 'bullets': Small circular indicators.
     * - 'bullets-text': Bullets with text labels beside them.
     * - 'circles': Larger circles with icons/numbers, connected by lines.
     * - 'circles-text': Like circles, but with text descriptions.
     */
    variant: {
      type: String,
      default: 'simple',
      validator: (value) => [
        'simple', 'panels', 'bullets',
        'panels-bordered', 'circles', 'circles-text'
      ].includes(value)
    },
    /**
     * Make steps clickable (wraps in <a> if href exists, otherwise uses non-interactive spans).
     */
    clickable: {
      type: Boolean,
      default: true
    },
    /**
     * Custom CSS classes for the root <nav> element.
     */
    className: {
        type: String,
        default: ''
    }
  },
  emits: ['step-click'],
  setup(props, { emit }) {

    const navClasses = computed(() => {
      const classes = ['base-step-navigation'];
      if (props.variant === 'bullets' || props.variant === 'bullets-text') {
          classes.push('flex items-center justify-center');
      }
       if (props.variant === 'panels-bordered') {
           classes.push('lg:border-t lg:border-b lg:border-gray-200');
       }
      if (props.className) classes.push(props.className);
      return classes.join(' ');
    });

    const listClasses = computed(() => {
      const classes = ['flex items-center']; // Most variants use flex
      switch (props.variant) {
        case 'simple':
          classes.push('space-y-4 md:flex md:space-y-0 md:space-x-8');
          break;
        case 'panels':
          classes.push('divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0');
          break;
        case 'bullets':
          classes.push('ml-8 space-x-5');
          break;
         case 'panels-bordered':
             classes.push('overflow-hidden rounded-md lg:flex lg:rounded-none lg:border-l lg:border-r lg:border-gray-200');
             break;
        case 'circles':
            // No extra classes needed for ol itself
            break;
        case 'circles-text':
            classes.push('overflow-hidden flex-col'); // Vertical layout for circles-text
            break;
         case 'bullets-text':
             classes.push('flex-col space-y-6 items-start'); // Vertical, align start
             break;
        default:
          break;
      }
      return classes.join(' ');
    });

    // --- Methods to get classes based on step status and variant --- 
    
    const getStepElement = (step) => {
        return (props.clickable && step.href) ? 'a' : 'div'; // Use div if not clickable/no href
    };
    
    const getStepClasses = (step, index) => {
         const base = [];
         const status = step.status;
         const isLast = index === props.steps.length - 1;
         
         switch (props.variant) {
             case 'simple':
                 base.push('group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pt-4 md:pb-0 md:pl-0');
                 if (status === 'complete') base.push('border-indigo-600 hover:border-indigo-800');
                 else if (status === 'current') base.push('border-indigo-600');
                 else base.push('border-gray-200 hover:border-gray-300');
                 break;
            case 'panels':
            case 'panels-bordered':
                base.push('group relative flex items-start');
                if (props.variant === 'panels') base.push('md:flex-1');
                if (props.variant === 'panels-bordered') base.push('lg:flex-1');
                if (status === 'complete') base.push('group'); // Add group for hover effect on completed
                break;
            case 'bullets':
                if (status === 'complete') base.push('block size-2.5 rounded-full bg-indigo-600 hover:bg-indigo-900');
                else if (status === 'current') base.push('relative flex items-center justify-center');
                else base.push('block size-2.5 rounded-full bg-gray-200 hover:bg-gray-400');
                break;
             case 'circles':
             case 'circles-text':
                 base.push('group relative flex items-start');
                 if (!isLast && props.variant === 'circles-text') base.push('pb-10'); // Vertical padding for circles-text
                 break;
             case 'bullets-text':
                  base.push('group flex items-start');
                  break;
         }
         return base.join(' ');
    };
    
    const getTextClasses = (step, part) => {
        const status = step.status;
        const baseText = part === 'id' ? 'text-sm font-medium' : 'text-sm';
        let color = '';
        
        switch (props.variant) {
             case 'simple':
                 if (part === 'id') {
                    color = status === 'complete' ? 'text-indigo-600 group-hover:text-indigo-800' : (status === 'current' ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700');
                 } else { // name
                    color = status === 'complete' ? 'text-gray-900' : (status === 'current' ? 'text-indigo-600' : 'text-gray-500');
                 }
                 break;
            case 'panels':
            case 'panels-bordered':
                 if (part === 'id') {
                     color = status === 'current' ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-900';
                 } else { // name or description
                      color = (status === 'current' || status === 'complete') ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900';
                      if (part === 'description') color += ' text-gray-500'; // Override description color
                 }
                 break;
            case 'circles':
            case 'circles-text':
                 if (part === 'name') {
                     color = status === 'current' ? 'font-medium text-indigo-600' : 'font-medium text-gray-900';
                 } else { // description
                     color = 'text-gray-500';
                 }
                 break;
             case 'bullets-text':
                 if (status === 'complete') color = 'text-gray-500 group-hover:text-gray-900';
                 else if (status === 'current') color = 'font-medium text-indigo-600';
                 else color = 'text-gray-500 group-hover:text-gray-900';
                 break;
             // 'bullets' variant has no text by default
        }
        return [baseText, color].join(' ');
    };
    
    // --- Event Handling ---
    const handleStepClick = (step, event) => {
       if (!props.clickable) {
           event.preventDefault();
           return;
       }
       if (!step.href || step.href === '#') {
           event.preventDefault(); // Prevent navigation for placeholder hrefs
       }
       // Allow default browser navigation if it's a real link
       emit('step-click', step);
    };

    return {
      navClasses,
      listClasses,
      getStepElement,
      getStepClasses,
      getTextClasses,
      handleStepClick
    };
  },
  template: `
    <nav :class="navClasses" aria-label="Progress">
      <!-- Bullets variant has preceding text -->
      <p v-if="variant === 'bullets'" class="text-sm font-medium">
         Step {{ steps.findIndex((step) => step.status === 'current') + 1 }} of {{ steps.length }}
      </p>
      
      <ol role="list" :class="listClasses">
        <li v-for="(step, stepIdx) in steps" :key="step.id || step.name" 
            :class="{
               'md:flex-1': variant === 'simple' || variant === 'panels',
               'relative': variant !== 'simple',
               'overflow-hidden lg:flex-1': variant === 'panels-bordered',
               'relative': variant === 'circles' || variant === 'circles-text' || variant === 'bullets-text',
               'pb-10': (variant === 'circles-text' || variant === 'bullets-text') && stepIdx !== steps.length - 1,
               'pr-8 sm:pr-20': variant === 'circles' && stepIdx !== steps.length - 1 
            }"
        >
            <component :is="getStepElement(step)" :href="step.href" :class="getStepClasses(step, stepIdx)" @click="handleStepClick(step, $event)" :aria-current="step.status === 'current' ? 'step' : undefined">
            
                <!-- Simple Variant Content -->
                <template v-if="variant === 'simple'">
                   <span :class="getTextClasses(step, 'id')">{{ step.id }}</span>
                   <span :class="getTextClasses(step, 'name')">{{ step.name }}</span>
                </template>
                
                <!-- Panels & Panels-Bordered Variants Content -->
                <template v-if="variant === 'panels' || variant === 'panels-bordered'">
                    <span class="flex items-center px-6 py-4 text-sm font-medium">
                        <span class="flex shrink-0 items-center justify-center rounded-full" 
                              :class="step.status === 'complete' ? 'size-10 bg-indigo-600 group-hover:bg-indigo-800' : (step.status === 'current' ? 'size-10 border-2 border-indigo-600' : 'size-10 border-2 border-gray-300 group-hover:border-gray-400')">
                           <i v-if="step.status === 'complete'" class="fas fa-check size-6 text-white" aria-hidden="true"></i>
                           <span v-else :class="getTextClasses(step, 'id')">{{ step.id }}</span>
                        </span>
                        <span class="ml-4 flex min-w-0 flex-col">
                           <span :class="getTextClasses(step, 'name')">{{ step.name }}</span>
                           <span v-if="step.description" :class="getTextClasses(step, 'description')">{{ step.description }}</span>
                        </span>
                    </span>
                    <!-- Bordered variant hover/active indicator -->
                    <span v-if="variant === 'panels-bordered' && step.status !== 'upcoming'" class="absolute top-0 left-0 h-full w-1 lg:top-auto lg:bottom-0 lg:h-1 lg:w-full" :class="step.status === 'complete' ? 'bg-transparent group-hover:bg-gray-200' : 'bg-indigo-600'" aria-hidden="true"></span>
                </template>
                
                <!-- Bullets Variant Content -->
                 <template v-if="variant === 'bullets'">
                      <span class="sr-only">{{ step.name }}</span>
                      <template v-if="step.status === 'current'">
                          <span class="absolute flex size-5 p-px" aria-hidden="true"><span class="size-full rounded-full bg-indigo-200" /></span>
                          <span class="relative block size-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                      </template>
                 </template>
                 
                 <!-- Circles & Circles-Text Variants Content -->
                 <template v-if="variant === 'circles' || variant === 'circles-text'">
                     <!-- Connecting Line -->
                     <div v-if="stepIdx !== steps.length - 1" 
                          class="absolute mt-0.5 w-0.5 bg-gray-300" 
                          :class="variant === 'circles' ? 'top-4 left-4 -ml-px h-full' : 'top-4 left-4 -ml-px h-full'" 
                          aria-hidden="true">
                     </div>
                     <span class="flex h-9 items-center" aria-hidden="true">
                         <span class="relative z-10 flex size-8 items-center justify-center rounded-full" 
                               :class="step.status === 'complete' ? 'bg-indigo-600 group-hover:bg-indigo-800' : (step.status === 'current' ? 'border-2 border-indigo-600 bg-white' : 'border-2 border-gray-300 bg-white group-hover:border-gray-400')">
                            <i v-if="step.status === 'complete'" class="fas fa-check size-5 text-white"></i>
                            <span v-else-if="step.status === 'current'" class="size-2.5 rounded-full bg-indigo-600"></span>
                            <span v-else class="size-2.5 rounded-full bg-transparent group-hover:bg-gray-300"></span>
                         </span>
                     </span>
                     <span v-if="variant === 'circles-text'" class="ml-4 flex min-w-0 flex-col">
                         <span :class="getTextClasses(step, 'name')">{{ step.name }}</span>
                         <span v-if="step.description" :class="getTextClasses(step, 'description')">{{ step.description }}</span>
                     </span>
                     <span v-else class="sr-only">{{ step.name }}</span> <!-- sr-only for circles variant -->
                 </template>
                 
                 <!-- Bullets-Text Variant Content -->
                  <template v-if="variant === 'bullets-text'">
                       <span class="relative flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
                            <i v-if="step.status === 'complete'" class="fas fa-check-circle size-full text-indigo-600 group-hover:text-indigo-800"></i>
                            <template v-else-if="step.status === 'current'">
                               <span class="absolute size-4 rounded-full bg-indigo-200"></span>
                               <span class="relative block size-2 rounded-full bg-indigo-600"></span>
                            </template>
                            <div v-else class="size-2 rounded-full bg-gray-300 group-hover:bg-gray-400"></div>
                       </span>
                       <span :class="[getTextClasses(step, 'name'), 'ml-3']">{{ step.name }}</span>
                  </template>
                
            </component>
            
             <!-- Panel Separator -->
             <template v-if="(variant === 'panels' || variant === 'panels-bordered') && stepIdx !== steps.length - 1">
                 <div class="absolute top-0 right-0 hidden h-full w-5 md:block" aria-hidden="true">
                     <svg class="size-full text-gray-300" viewBox="0 0 22 80" fill="none" preserveAspectRatio="none">
                         <path d="M0 -2L20 40L0 82" vector-effect="non-scaling-stroke" stroke="currentcolor" stroke-linejoin="round" />
                     </svg>
                 </div>
             </template>
             <!-- Bordered Panel Separator -->
             <template v-if="variant === 'panels-bordered' && stepIdx !== 0">
                 <div class="absolute inset-0 top-0 left-0 hidden w-3 lg:block" aria-hidden="true">
                     <svg class="size-full text-gray-300" viewBox="0 0 12 82" fill="none" preserveAspectRatio="none">
                       <path d="M0.5 0V31L10.5 41L0.5 51V82" stroke="currentcolor" vector-effect="non-scaling-stroke" />
                     </svg>
                 </div>
             </template>
        </li>
      </ol>
    </nav>
  `
}; 