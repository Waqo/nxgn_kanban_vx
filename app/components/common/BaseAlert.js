// app/components/common/BaseAlert.js

const { computed } = Vue;

// Mapping from color prop to icon classes
const AlertIconMap = {
    red: 'fas fa-times-circle', // Using solid for consistency
    green: 'fas fa-check-circle',
    blue: 'fas fa-info-circle',
    yellow: 'fas fa-exclamation-triangle',
};

export default {
  name: 'BaseAlert',
  props: {
    color: {
      type: String,
      default: 'yellow', // yellow, red, green, blue
      validator: (value) => Object.keys(AlertIconMap).includes(value)
    },
    title: {
        type: String,
        default: ''
    },
    // Add dismissible prop
    dismissible: {
        type: Boolean,
        default: false
    },
    // Add variant prop
    variant: {
      type: String,
      default: 'default', // 'default', 'accent-border'
      validator: (value) => ['default', 'accent-border'].includes(value)
    }
    // Content is provided via the default slot
  },
  emits: ['dismiss'],
  setup(props, { emit, slots }) {

    const iconName = computed(() => AlertIconMap[props.color] || AlertIconMap.yellow);

    const containerClasses = computed(() => {
      const classes = ['rounded-md p-4'];
      if (props.variant === 'accent-border') {
        switch (props.color?.toLowerCase()) {
          case 'red': classes.push('border-l-4 border-red-400 bg-red-50'); break;
          case 'green': classes.push('border-l-4 border-green-400 bg-green-50'); break;
          case 'blue': classes.push('border-l-4 border-blue-400 bg-blue-50'); break;
          case 'yellow':
          default: classes.push('border-l-4 border-yellow-400 bg-yellow-50'); break;
        }
      } else { // Default variant
         switch (props.color?.toLowerCase()) {
          case 'red': classes.push('bg-red-50'); break;
          case 'green': classes.push('bg-green-50'); break;
          case 'blue': classes.push('bg-blue-50'); break;
          case 'yellow':
          default: classes.push('bg-yellow-50'); break;
        }
      }
      return classes.join(' ');
    });

    const iconClasses = computed(() => {
       switch (props.color?.toLowerCase()) {
        case 'red': return 'text-red-400';
        case 'green': return 'text-green-400';
        case 'blue': return 'text-blue-400';
        case 'yellow':
        default: return 'text-yellow-400';
      }
    });

     const titleClasses = computed(() => {
       const base = ['text-sm font-medium'];
       switch (props.color?.toLowerCase()) {
        case 'red': base.push('text-red-800'); break;
        case 'green': base.push('text-green-800'); break;
        case 'blue': base.push('text-blue-800'); break;
        case 'yellow':
        default: base.push('text-yellow-800'); break;
      }
       return base.join(' ');
    });

    const contentClasses = computed(() => {
       const base = ['text-sm'];
       switch (props.color?.toLowerCase()) {
        case 'red': base.push('text-red-700'); break;
        case 'green': base.push('text-green-700'); break;
        case 'blue': base.push('text-blue-700'); break;
        case 'yellow':
        default: base.push('text-yellow-700'); break;
      }
       if (props.title) base.push('mt-2');
       return base.join(' ');
    });

    const dismissButtonClasses = computed(() => {
        const base = ['inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2'];
        switch (props.color?.toLowerCase()) {
            case 'red': base.push('bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50'); break;
            case 'green': base.push('bg-green-50 text-green-500 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50'); break;
            case 'blue': base.push('bg-blue-50 text-blue-500 hover:bg-blue-100 focus:ring-blue-600 focus:ring-offset-blue-50'); break;
            case 'yellow':
            default: base.push('bg-yellow-50 text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600 focus:ring-offset-yellow-50'); break;
        }
        return base.join(' ');
    });

    // Classes for the main content area, adjusted if trailing slot exists
    const mainContentAreaClasses = computed(() => {
        const classes = ['ml-3'];
        if (slots.trailing) {
            classes.push('flex-1 md:flex md:justify-between');
        }
        return classes.join(' ');
    });
    
     // Classes for the container holding title, description, default slot, and actions slot
    const textAndActionsContainerClasses = computed(() => {
       // No specific classes needed by default, but useful for structure clarity
       return '';
    });

    // Classes for the trailing action/link slot
    const trailingActionContainerClasses = computed(() => {
      return 'mt-3 text-sm md:mt-0 md:ml-6';
    });

    const handleDismiss = () => {
      emit('dismiss');
    };

    return {
      iconName,
      containerClasses,
      iconClasses,
      titleClasses,
      contentClasses,
      dismissButtonClasses,
      mainContentAreaClasses,
      textAndActionsContainerClasses,
      trailingActionContainerClasses,
      handleDismiss
    };
  },
  template: `
    <div :class="containerClasses">
      <div class="flex">
        <div class="flex-shrink-0">
          <i :class="['h-5 w-5', iconClasses, iconName]" aria-hidden="true"></i>
        </div>
        <div :class="mainContentAreaClasses">
          <div :class="textAndActionsContainerClasses">
              <h3 v-if="title" :class="titleClasses">{{ title }}</h3>
              <div :class="contentClasses">
                <slot>Default alert message.</slot> <!-- Default Content slot -->
              </div>
              <!-- Actions Slot -->
              <div v-if="$slots.actions" class="mt-4">
                  <div class="-mx-2 -my-1.5 flex">
                     <slot name="actions"></slot>
                  </div>
              </div>
          </div>
          <!-- Trailing Action/Link Slot -->
          <div v-if="$slots.trailing" :class="trailingActionContainerClasses">
              <slot name="trailing"></slot>
          </div>
          
          <!-- Optional dismiss button (positioned separately if trailing slot exists) -->
          <div v-if="dismissible && !$slots.trailing" class="ml-auto pl-3">
            <div class="-mx-1.5 -my-1.5">
              <button 
                @click="handleDismiss" 
                type="button" 
                :class="dismissButtonClasses"
               >
                <span class="sr-only">Dismiss</span>
                <i class="fas fa-times h-5 w-5" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
         <!-- Optional dismiss button (positioned absolutely if trailing slot exists) -->
         <div v-if="dismissible && $slots.trailing" class="ml-auto pl-3">
            <div class="-mx-1.5 -my-1.5">
              <button 
                @click="handleDismiss" 
                type="button" 
                :class="dismissButtonClasses"
               >
                <span class="sr-only">Dismiss</span>
                <i class="fas fa-times h-5 w-5" aria-hidden="true"></i>
              </button>
            </div>
          </div>
      </div>
    </div>
  `
};

