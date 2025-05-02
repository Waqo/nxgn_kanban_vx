const { computed } = Vue;

export default {
  name: 'BaseCardHeading',
  props: {
    // Main heading text
    title: {
      type: String,
      required: true
    },
    // Optional description text
    description: {
      type: String,
      default: ''
    },
    // Visual style variant
    variant: {
      type: String,
      default: 'default', // default, with-avatar, with-icon, subtle
      validator: value => ['default', 'with-avatar', 'with-icon', 'subtle'].includes(value)
    },
    // Optional avatar image URL (for with-avatar variant)
    avatar: {
      type: Object,
      default: () => ({}),
      // Expected shape: {src, alt, initials}
    },
    // Icon name (for with-icon variant)
    icon: {
      type: String,
      default: '' // Expect Font Awesome class, e.g., 'fas fa-info-circle'
    },
    // Icon color (for with-icon variant)
    iconColor: {
      type: String,
      default: 'gray', // gray, blue, green, red, yellow, indigo, purple
      validator: value => ['gray', 'blue', 'green', 'red', 'yellow', 'indigo', 'purple'].includes(value)
    },
    // Whether to show a bottom border
    withBorder: {
      type: Boolean,
      default: true
    },
    // Whether to show the actions slot
    withActions: {
      type: Boolean,
      default: false
    },
    // Optional heading size (small, medium, large)
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    },
    // Additional class names
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
     // Container classes
    const containerClasses = computed(() => {
      const classes = ['flex', 'items-center', 'justify-between'];
      if (props.withBorder) {
        classes.push('border-b', 'border-gray-200', 'pb-4');
      } else {
        classes.push('pb-2');
      }
      if (props.className) {
        classes.push(props.className);
      }
      return classes.join(' ');
    });

    // Left section classes
    const leftSectionClasses = computed(() => {
      const classes = ['flex', 'items-center', 'min-w-0'];
      if (props.variant === 'with-avatar' || props.variant === 'with-icon') {
        classes.push('gap-x-4');
      }
      return classes.join(' ');
    });

    // Title container classes
    const titleContainerClasses = computed(() => 'min-w-0 flex-1');

    // Heading classes based on size
    const headingClasses = computed(() => {
      const classes = ['truncate', 'font-medium', 'text-gray-900'];
      switch(props.size) {
        case 'small': classes.push('text-sm'); break;
        case 'large': classes.push('text-lg'); break;
        case 'medium': default: classes.push('text-base'); break;
      }
      if (props.variant === 'subtle') {
        classes.push('text-gray-700');
      }
      return classes.join(' ');
    });

    // Description classes
    const descriptionClasses = computed(() => {
      const classes = ['truncate', 'text-sm', 'text-gray-500'];
      if (props.size === 'small') {
        classes.push('text-xs');
      }
      return classes.join(' ');
    });

    // Avatar classes
    const avatarSizeClass = computed(() => {
      switch(props.size) {
        case 'small': return 'size-8';
        case 'large': return 'size-12';
        case 'medium': default: return 'size-10';
      }
    });
    
    const avatarContainerClasses = computed(() => {
        return ['shrink-0', avatarSizeClass.value].join(' ');
    });

    // Avatar image classes
    const avatarImageClasses = computed(() => {
      return 'size-full rounded-full';
    });

    // Avatar initials container classes
    const avatarInitialsContainerClasses = computed(() => {
      return ['flex items-center justify-center rounded-full bg-gray-100', avatarSizeClass.value].join(' ');
    });

    // Avatar initials text classes
    const avatarInitialsTextClasses = computed(() => {
      const classes = ['font-medium', 'text-gray-600'];
      switch(props.size) {
        case 'small': classes.push('text-xs'); break;
        case 'large': classes.push('text-lg'); break;
        case 'medium': default: classes.push('text-sm'); break;
      }
      return classes.join(' ');
    });

    // Icon container classes
    const iconContainerClasses = computed(() => {
      const classes = ['flex items-center justify-center rounded-lg'];
       switch(props.size) {
        case 'small': classes.push('size-8'); break;
        case 'large': classes.push('size-12'); break;
        case 'medium': default: classes.push('size-10'); break;
      }
      switch(props.iconColor) {
        case 'blue': classes.push('bg-blue-50'); break;
        case 'green': classes.push('bg-green-50'); break;
        case 'red': classes.push('bg-red-50'); break;
        case 'yellow': classes.push('bg-yellow-50'); break;
        case 'indigo': classes.push('bg-indigo-50'); break;
        case 'purple': classes.push('bg-purple-50'); break;
        case 'gray': default: classes.push('bg-gray-50'); break;
      }
      return classes.join(' ');
    });

    // Icon classes
    const iconClasses = computed(() => {
      const classes = [props.icon]; // Expect full FA class
      switch(props.size) {
        case 'small': classes.push('size-4'); break;
        case 'large': classes.push('size-7'); break;
        case 'medium': default: classes.push('size-6'); break;
      }
      switch(props.iconColor) {
        case 'blue': classes.push('text-blue-600'); break;
        case 'green': classes.push('text-green-600'); break;
        case 'red': classes.push('text-red-600'); break;
        case 'yellow': classes.push('text-yellow-600'); break;
        case 'indigo': classes.push('text-indigo-600'); break;
        case 'purple': classes.push('text-purple-600'); break;
        case 'gray': default: classes.push('text-gray-600'); break;
      }
      return classes.join(' ');
    });

    // Right section classes
    const rightSectionClasses = computed(() => 'ml-4 shrink-0');

    // Has avatar or initials
    const hasAvatar = computed(() => {
      return props.variant === 'with-avatar' && (props.avatar?.src || props.avatar?.initials);
    });

    // Has icon
    const hasIcon = computed(() => props.variant === 'with-icon' && props.icon);

    return {
        containerClasses,
        leftSectionClasses,
        titleContainerClasses,
        headingClasses,
        descriptionClasses,
        avatarContainerClasses,
        avatarImageClasses,
        avatarInitialsContainerClasses,
        avatarInitialsTextClasses,
        iconContainerClasses,
        iconClasses,
        rightSectionClasses,
        hasAvatar,
        hasIcon
    };
  },
  template: `
    <div :class="containerClasses">
      <!-- Left section with avatar/icon and title -->
      <div :class="leftSectionClasses">
        <!-- Avatar Slot -->
        <slot name="media">
            <div v-if="hasAvatar" :class="avatarContainerClasses">
              <img v-if="avatar.src" :src="avatar.src" :alt="avatar.alt || ''" :class="avatarImageClasses" />
              <div v-else-if="avatar.initials" :class="avatarInitialsContainerClasses">
                <span :class="avatarInitialsTextClasses">{{ avatar.initials }}</span>
              </div>
            </div>
            
            <!-- Icon (if provided) -->
            <div v-if="hasIcon" :class="iconContainerClasses">
              <i :class="iconClasses" aria-hidden="true"></i>
            </div>
        </slot>
        
        <!-- Title and description -->
        <div :class="titleContainerClasses">
           <slot name="title">
              <h3 :class="headingClasses">{{ title }}</h3>
           </slot>
           <slot name="description">
              <p v-if="description" :class="descriptionClasses">{{ description }}</p>
            </slot>
        </div>
      </div>
      
      <!-- Right section with actions -->
      <div v-if="withActions" :class="rightSectionClasses">
        <slot name="actions"></slot>
      </div>
    </div>
  `
}; 
 