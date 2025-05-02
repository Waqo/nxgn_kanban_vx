const { computed } = Vue;

export default {
  name: 'BaseBreadcrumbs',
  props: {
    /**
     * Array of page objects.
     * Required shape: { name: string, href: string, current?: boolean }
     */
    pages: {
      type: Array,
      required: true,
      default: () => [],
      validator: (arr) => arr.every(p => typeof p === 'object' && p.name && p.href !== undefined)
    },
    /**
     * Visual style variant.
     * - 'chevrons': Simple text with chevron separators (default).
     * - 'slashes': Simple text with slash separators.
     * - 'contained': Rounded background, shadow, angled separators.
     * - 'full-width': Full-width bar, bottom border, angled separators.
     */
    variant: {
      type: String,
      default: 'chevrons',
      validator: (value) => ['chevrons', 'slashes', 'contained', 'full-width'].includes(value)
    },
    /**
     * Show the initial Home icon link.
     */
    showHomeIcon: {
      type: Boolean,
      default: true
    },
    /**
     * Font Awesome class for the home icon.
     */
    homeIconClass: {
      type: String,
      default: 'fas fa-home'
    },
    /**
     * Max width for the 'full-width' variant container (Tailwind class, e.g., '7xl').
     */
    maxWidth: {
        type: String,
        default: '7xl'
    },
    /**
     * Custom classes for the root <nav> element.
     */
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {

    const navClasses = computed(() => {
      const classes = ['flex'];
      if (props.variant === 'full-width') {
        classes.push('border-b border-gray-200 bg-white');
      } else if (props.variant === 'contained') {
         // Container styles are applied to the <ol>
      }
      if (props.className) classes.push(props.className);
      return classes.join(' ');
    });

    const listClasses = computed(() => {
      const classes = ['flex items-center space-x-4'];
       if (props.variant === 'contained') {
         classes.push('rounded-md bg-white px-6 shadow-sm');
       } else if (props.variant === 'full-width') {
           classes.push(`mx-auto w-full max-w-${props.maxWidth} px-4 sm:px-6 lg:px-8`);
       }
      return classes.join(' ');
    });

    const listItemClasses = (page) => {
        // 'flex' added directly to li for contained/full-width variant structure
        return props.variant === 'contained' || props.variant === 'full-width' ? 'flex' : '';
    };

    const linkClasses = computed(() => {
        const base = 'text-sm font-medium text-gray-500 hover:text-gray-700';
        // Add margin only for variants without angled separator container
        const margin = (props.variant === 'chevrons' || props.variant === 'slashes') ? 'ml-4' : ''; 
        return [base, margin].join(' ');
    });
    
    const homeLinkClasses = computed(() => {
        return 'text-gray-400 hover:text-gray-500';
    });

    const homeIconSizeClass = computed(() => {
        // Use size-5 for consistency with examples
        return 'size-5 shrink-0';
    });
    
    const separatorContainerClasses = computed(() => {
       return 'flex items-center';
    });

    // Conditionally render the correct separator based on variant
    const showAngledSeparator = computed(() => props.variant === 'contained' || props.variant === 'full-width');
    const showChevronSeparator = computed(() => props.variant === 'chevrons');
    const showSlashSeparator = computed(() => props.variant === 'slashes');

    const angledSeparatorClasses = computed(() => {
        return 'h-full w-6 shrink-0 text-gray-200'; // Adjusted for default svg size
    });

    const chevronSeparatorClasses = computed(() => {
        return 'size-5 shrink-0 text-gray-400';
    });
    
    const slashSeparatorClasses = computed(() => {
        return 'size-5 shrink-0 text-gray-300';
    });
    
     const angledSeparatorPath = "M.293 0l22 22-22 22h1.414l22-22-22-22H.293z";
     const slashSeparatorPath = "M5.555 17.776l8-16 .894.448-8 16-.894-.448z";

    return {
      navClasses,
      listClasses,
      listItemClasses,
      linkClasses,
      homeLinkClasses,
      homeIconSizeClass,
      separatorContainerClasses,
      showAngledSeparator,
      showChevronSeparator,
      showSlashSeparator,
      angledSeparatorClasses,
      chevronSeparatorClasses,
      slashSeparatorClasses,
      angledSeparatorPath,
      slashSeparatorPath
    };
  },
  template: `
    <nav :class="navClasses" aria-label="Breadcrumb">
      <ol role="list" :class="listClasses">
        <!-- Home Icon -->
        <li v-if="showHomeIcon" class="flex">
          <div class="flex items-center">
            <slot name="home-icon">
              <a href="/" :class="homeLinkClasses">
                <i :class="[homeIconClass, homeIconSizeClass]" aria-hidden="true"></i>
                <span class="sr-only">Home</span>
              </a>
            </slot>
          </div>
        </li>
        
        <!-- Page Links -->
        <li v-for="(page, index) in pages" :key="page.name" :class="listItemClasses(page)">
          <div :class="separatorContainerClasses">
            <!-- Separator -->
            <slot name="separator" :variant="variant" :index="index">
                 <!-- Angled Separator -->
                 <svg v-if="showAngledSeparator" :class="angledSeparatorClasses" viewBox="0 0 24 44" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
                    <path :d="angledSeparatorPath" />
                 </svg>
                 <!-- Chevron Separator -->
                 <i v-else-if="showChevronSeparator" :class="[chevronSeparatorClasses, 'fas fa-chevron-right']" aria-hidden="true"></i>
                 <!-- Slash Separator -->
                 <svg v-else-if="showSlashSeparator" :class="slashSeparatorClasses" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                     <path :d="slashSeparatorPath" />
                 </svg>
             </slot>
            
            <!-- Link/Current Page -->
            <slot name="page-link" :page="page">
              <a :href="page.href" 
                 :class="linkClasses" 
                 :aria-current="page.current ? 'page' : undefined">
                 {{ page.name }}
              </a>
             </slot>
          </div>
        </li>
      </ol>
    </nav>
  `
}; 