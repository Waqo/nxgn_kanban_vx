const { computed } = Vue;

export default {
  name: 'BaseSectionHeading',
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
    // Visual style
    variant: {
      type: String,
      default: 'default', // default, with-tabs, with-badge, with-action, with-dropdown, subtle
      validator: value => ['default', 'with-tabs', 'with-badge', 'with-action', 'with-dropdown', 'subtle'].includes(value)
    },
    // Use h2 instead of h3 for the heading
    useH2: {
      type: Boolean,
      default: false
    },
    // Whether to show a bottom border
    withBorder: {
      type: Boolean,
      default: true
    },
    // Badge text (for with-badge variant)
    badge: {
      type: String,
      default: ''
    },
    // Badge color (for with-badge variant)
    badgeColor: {
      type: String,
      default: 'gray', // gray, blue, green, red, yellow, indigo, purple
      validator: value => ['gray', 'blue', 'green', 'red', 'yellow', 'indigo', 'purple'].includes(value)
    },
    // Tabs data for with-tabs variant
    tabs: {
      type: Array,
      default: () => []
      // Expected shape: [{id: 'tab1', name: 'Tab 1', current: true, href: '#'}]
    },
    // Active tab id (required for with-tabs variant)
    activeTab: {
      type: String,
      default: ''
    },
    // Additional class names
    className: {
      type: String,
      default: ''
    }
  },
  emits: ['tab-click'],
  setup(props, { emit }) {
    // Container classes
    const containerClasses = computed(() => {
      const classes = ['pb-5'];
      if (props.withBorder && props.variant !== 'with-tabs') {
        classes.push('border-b', 'border-gray-200');
      }
      if (props.variant === 'subtle') {
        classes.push('mb-6');
      } else {
        classes.push('mb-8'); // Default or other variants
      }
      if (props.variant === 'with-tabs') {
        classes.push('border-b-0', 'pb-0'); // Remove bottom border/padding for tabs
      }
      if (props.className) {
        classes.push(props.className);
      }
      return classes.join(' ');
    });

    // Heading classes
    const headingClasses = computed(() => {
      const classes = [];
      if (props.variant === 'subtle') {
        classes.push('text-lg', 'font-medium', 'text-gray-900');
      } else {
        classes.push('text-lg', 'font-medium', 'leading-6', 'text-gray-900');
      }
      return classes.join(' ');
    });

    // Description classes
    const descriptionClasses = computed(() => {
      return 'mt-2 max-w-4xl text-sm text-gray-500';
    });

    // Tab container classes
    const tabClasses = computed(() => {
      return props.variant === 'with-tabs' ? 'border-b border-gray-200' : '';
    });

    // Tab list classes 
    const tabListClasses = computed(() => {
      return props.variant === 'with-tabs' ? '-mb-px flex space-x-8' : '';
    });

    // Badge classes based on color
    const badgeClasses = computed(() => {
      const classes = ['ml-2', 'inline-flex', 'items-center', 'rounded-full', 'px-2.5', 'py-0.5', 'text-xs', 'font-medium'];
      switch(props.badgeColor) {
        case 'blue': classes.push('bg-blue-100', 'text-blue-800'); break;
        case 'green': classes.push('bg-green-100', 'text-green-800'); break;
        case 'red': classes.push('bg-red-100', 'text-red-800'); break;
        case 'yellow': classes.push('bg-yellow-100', 'text-yellow-800'); break;
        case 'indigo': classes.push('bg-indigo-100', 'text-indigo-800'); break;
        case 'purple': classes.push('bg-purple-100', 'text-purple-800'); break;
        case 'gray': default: classes.push('bg-gray-100', 'text-gray-800'); break;
      }
      return classes.join(' ');
    });

    // Top row classes for actions/dropdown variants
    const topRowClasses = computed(() => {
      const classes = [];
      if (props.variant === 'with-action' || props.variant === 'with-dropdown') {
        classes.push('flex', 'items-center', 'justify-between');
      }
      return classes.join(' ');
    });

    const leftSectionClasses = computed(() => {
      return (props.variant === 'with-action' || props.variant === 'with-dropdown') ? 'flex-1' : '';
    });

    const rightSectionClasses = computed(() => {
      return (props.variant === 'with-action' || props.variant === 'with-dropdown') ? 'ml-4 flex shrink-0' : '';
    });

    const showBadge = computed(() => props.variant === 'with-badge' && props.badge);

    // Tab handling methods
    const handleTabClick = (tab, event) => {
      emit('tab-click', { tab, event });
    };

    const setAriaCurrent = (isCurrent) => {
      return isCurrent ? 'page' : undefined;
    };

    const getTabItemClasses = (isCurrent) => {
      const classes = ['whitespace-nowrap', 'border-b-2', 'py-4', 'px-1', 'text-sm', 'font-medium'];
      if (isCurrent) {
        classes.push('border-indigo-500', 'text-indigo-600');
      } else {
        classes.push('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700');
      }
      return classes.join(' ');
    };

    return {
      containerClasses,
      headingClasses,
      descriptionClasses,
      tabClasses,
      tabListClasses,
      badgeClasses,
      topRowClasses,
      leftSectionClasses,
      rightSectionClasses,
      showBadge,
      handleTabClick,
      setAriaCurrent,
      getTabItemClasses
    };
  },
  template: `
    <div :class="containerClasses">
      <!-- Top row with title, badge, and actions -->
      <div :class="topRowClasses">
        <div :class="leftSectionClasses">
          <component :is="useH2 ? 'h2' : 'h3'" :class="headingClasses">
            {{ title }}
            <span v-if="showBadge" :class="badgeClasses">{{ badge }}</span>
          </component>
          <p v-if="description" :class="descriptionClasses">{{ description }}</p>
        </div>
        
        <!-- Action buttons or dropdown for respective variants -->
        <div v-if="variant === 'with-action' || variant === 'with-dropdown'" :class="rightSectionClasses">
          <slot name="actions"></slot>
        </div>
      </div>
      
      <!-- Tabs section for with-tabs variant -->
      <div v-if="variant === 'with-tabs'" :class="tabClasses">
        <nav :class="tabListClasses" aria-label="Tabs">
          <a 
            v-for="tab in tabs" 
            :key="tab.id || tab.name" 
            :href="tab.href || '#'" 
            :class="getTabItemClasses(tab.id === activeTab)"
            :aria-current="setAriaCurrent(tab.id === activeTab)"
            @click.prevent="handleTabClick(tab, $event)"
          >
            {{ tab.name }}
            <span 
              v-if="tab.count != null" 
              :class="[
                (tab.id === activeTab) ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900',
                'ml-2 hidden rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block'
              ]"
            >
              {{ tab.count }}
            </span>
          </a>
        </nav>
      </div>
    </div>
  `
}; 