const { computed } = Vue;

export default {
  name: 'BasePageHeading',
  props: {
    // Main heading text
    title: {
      type: String,
      required: true
    },
    // Visual style variant
    variant: {
      type: String,
      default: 'default', // default, with-meta, with-avatar, with-breadcrumbs, with-meta-action, dark
      validator: value => ['default', 'with-meta', 'with-avatar', 'with-breadcrumbs', 'with-meta-action', 'dark'].includes(value)
    },
    // Optional description text
    description: {
      type: String,
      default: ''
    },
    // Optional meta information (string or array of strings)
    meta: {
      type: [String, Array],
      default: ''
    },
    // Breadcrumbs data array
    breadcrumbs: {
      type: Array,
      default: () => [],
      // Expected shape: [{name, href, current}]
    },
    // Avatar data for with-avatar variant
    avatar: {
      type: Object,
      default: () => ({}),
      // Expected shape: {src, alt, initials, size}
    },
    // Whether to add a bottom border
    withBorder: {
      type: Boolean,
      default: true
    },
    // Additional custom class names
    className: {
      type: String,
      default: ''
    },
    // Whether to add the actions slot
    withActions: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    // Container classes for the heading
    const containerClasses = computed(() => {
      const classes = [];
      
      if (props.variant === 'dark') {
        classes.push('bg-gray-900', 'py-6');
      } else {
        classes.push('bg-white');
        
        if (props.variant === 'with-breadcrumbs') {
          classes.push('pt-4');
        } else {
          classes.push('py-6');
        }
      }
      
      if (props.withBorder && props.variant !== 'dark') {
        classes.push('border-b', 'border-gray-200');
      }
      
      if (props.className) {
        classes.push(props.className);
      }
      
      return classes.join(' ');
    });
    
    // Content container classes
    const contentClasses = computed(() => {
      return 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';
    });
    
    // Flex container classes
    const flexContainerClasses = computed(() => {
      let classes = 'md:flex md:items-center md:justify-between';
      
      if (props.variant === 'with-avatar') {
        classes += ' space-y-1 min-w-0';
      }
      
      return classes;
    });
    
    // Left section classes (for title and meta)
    const leftSectionClasses = computed(() => {
      const classes = ['min-w-0 flex-1'];
      
      if (props.variant === 'with-avatar') {
        classes.push('flex', 'items-center');
      }
      
      return classes.join(' ');
    });
    
    // Heading classes based on variant
    const headingClasses = computed(() => {
      const classes = ['text-2xl', 'font-bold', 'tracking-tight'];
      
      if (props.variant === 'dark') {
        classes.push('text-white');
      } else {
        classes.push('text-gray-900');
      }
      
      if (props.variant === 'with-meta' || props.variant === 'with-meta-action') {
        classes.push('sm:truncate');
      }
      
      return classes.join(' ');
    });
    
    // Description classes
    const descriptionClasses = computed(() => {
      const classes = ['mt-2', 'text-sm'];
      
      if (props.variant === 'dark') {
        classes.push('text-gray-300');
      } else {
        classes.push('text-gray-500');
      }
      
      return classes.join(' ');
    });
    
    // Meta text classes
    const metaClasses = computed(() => {
      return 'mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6';
    });
    
    // Individual meta item classes
    const metaItemClasses = computed(() => {
      const classes = ['mt-2', 'flex', 'items-center', 'text-sm'];
      
      if (props.variant === 'dark') {
        classes.push('text-gray-300');
      } else {
        classes.push('text-gray-500');
      }
      
      return classes.join(' ');
    });
    
    // Right section classes (for actions)
    const rightSectionClasses = computed(() => {
      return 'mt-4 flex md:ml-4 md:mt-0';
    });
    
    // Avatar container classes
    const avatarContainerClasses = computed(() => {
      return 'flex-shrink-0 mr-4';
    });
    
    // Avatar classes
    const avatarClasses = computed(() => {
      const size = props.avatar.size || 'medium';
      const sizeClass = size === 'large' ? 'size-16' : (size === 'small' ? 'size-10' : 'size-12');
      return `bg-gray-100 rounded-full ${sizeClass}`;
    });
    
    // Avatar image classes
    const avatarImageClasses = computed(() => {
      return 'size-full rounded-full';
    });
    
    // Avatar initials container classes
    const avatarInitialsClasses = computed(() => {
      const size = props.avatar.size || 'medium';
      const sizeClass = size === 'large' ? 'size-16' : (size === 'small' ? 'size-10' : 'size-12');
      return `flex items-center justify-center rounded-full bg-gray-100 ${sizeClass}`;
    });
    
    // Avatar initials text classes
    const avatarInitialsTextClasses = computed(() => {
      const size = props.avatar.size || 'medium';
      const textClass = size === 'large' ? 'text-xl' : (size === 'small' ? 'text-sm' : 'text-lg');
      return `font-medium text-gray-600 ${textClass}`;
    });
    
    // Breadcrumbs container classes
    const breadcrumbsClasses = computed(() => {
      return 'mb-4 flex items-center space-x-2 text-sm font-medium';
    });
    
    // Breadcrumb item classes
    const breadcrumbLinkClasses = computed(() => {
      return 'text-gray-500 hover:text-gray-700';
    });
    
    // Current breadcrumb classes
    const currentBreadcrumbClasses = computed(() => {
      return 'text-gray-900';
    });
    
    // Breadcrumb separator classes
    const breadcrumbSeparatorClasses = computed(() => {
      return 'text-gray-400';
    });
    
    // Process meta items into array
    const processedMeta = computed(() => {
      if (!props.meta) return [];
      if (Array.isArray(props.meta)) return props.meta;
      return [props.meta];
    });
    
    // Check if avatar is provided
    const hasAvatar = computed(() => {
      return props.variant === 'with-avatar' && 
             (props.avatar?.src || props.avatar?.initials);
    });
    
    // Check if breadcrumbs are provided
    const hasBreadcrumbs = computed(() => {
      return props.variant === 'with-breadcrumbs' && props.breadcrumbs.length > 0;
    });

    return {
      containerClasses,
      contentClasses,
      flexContainerClasses,
      leftSectionClasses,
      headingClasses,
      descriptionClasses,
      metaClasses,
      metaItemClasses,
      rightSectionClasses,
      avatarContainerClasses,
      avatarClasses,
      avatarImageClasses,
      avatarInitialsClasses,
      avatarInitialsTextClasses,
      breadcrumbsClasses,
      breadcrumbLinkClasses,
      currentBreadcrumbClasses,
      breadcrumbSeparatorClasses,
      processedMeta,
      hasAvatar,
      hasBreadcrumbs
    };
  },
  template: `
    <div :class="containerClasses">
      <div :class="contentClasses">
        <!-- Breadcrumbs (if provided) -->
        <nav v-if="hasBreadcrumbs" :class="breadcrumbsClasses">
          <template v-for="(crumb, index) in breadcrumbs">
            <div v-if="index > 0" :class="breadcrumbSeparatorClasses">
              <i class="fas fa-chevron-right size-4" aria-hidden="true"></i>
            </div>
            <a 
              v-if="!crumb.current" 
              :href="crumb.href" 
              :class="breadcrumbLinkClasses"
            >{{ crumb.name }}</a>
            <span 
              v-else 
              :class="currentBreadcrumbClasses" 
              aria-current="page"
            >{{ crumb.name }}</span>
          </template>
        </nav>
        
        <div :class="flexContainerClasses">
          <!-- Left section with title and meta -->
          <div :class="leftSectionClasses">
            <!-- Avatar (if provided) -->
            <div v-if="hasAvatar" :class="avatarContainerClasses">
              <img v-if="avatar.src" :src="avatar.src" :alt="avatar.alt || ''" :class="avatarImageClasses" />
              <div v-else-if="avatar.initials" :class="avatarInitialsClasses">
                <span :class="avatarInitialsTextClasses">{{ avatar.initials }}</span>
              </div>
            </div>
            
            <div>
              <h1 :class="headingClasses">{{ title }}</h1>
              
              <!-- Description (if provided) -->
              <p v-if="description" :class="descriptionClasses">{{ description }}</p>
              
              <!-- Meta information (if provided) -->
              <div v-if="processedMeta.length > 0 && (variant === 'with-meta' || variant === 'with-meta-action')" :class="metaClasses">
                <div v-for="(item, index) in processedMeta" :key="index" :class="metaItemClasses">
                  <span>{{ item }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right section with actions -->
          <div v-if="withActions" :class="rightSectionClasses">
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    </div>
  `
}; 