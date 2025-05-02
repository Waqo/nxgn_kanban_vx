const { computed } = Vue;

export default {
  name: 'BaseStats',
  props: {
    // Array of stat objects with flexible structure
    stats: {
      type: Array,
      required: true,
      default: () => []
    },
    // Title for the stats section
    title: {
      type: String,
      default: ''
    },
    // Layout variant
    variant: {
      type: String,
      default: 'simple',
      validator: (value) => ['simple', 'dark', 'cards', 'brand-icon', 'shared-borders', 'trending'].includes(value)
    },
    // Column count at different breakpoints
    columns: {
      type: [Number, String],
      default: 3
    },
    smColumns: {
      type: [Number, String],
      default: 2
    },
    lgColumns: {
      type: [Number, String],
      default: null
    },
    // Card styling
    rounded: {
      type: Boolean,
      default: true
    },
    withShadow: {
      type: Boolean,
      default: true
    },
    bgColor: {
      type: String,
      default: 'white' // white, gray-100, etc. or dark variants
    },
    // Secondary text (previous values, units, etc.)
    showSecondary: {
      type: Boolean,
      default: true
    },
    // Trend indicators
    showTrend: {
      type: Boolean,
      default: true
    },
    // Borders and dividers
    withDividers: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    // Main container classes
    const containerClasses = computed(() => {
      const classes = [];
      
      // Base classes based on variant
      if (props.variant === 'dark') {
        classes.push('bg-gray-900');
      }
      
      return classes.join(' ');
    });
    
    // Grid container classes
    const gridClasses = computed(() => {
      const classes = ['grid grid-cols-1'];
      
      // Add column classes
      if (props.smColumns) {
        classes.push(`sm:grid-cols-${props.smColumns}`);
      }
      
      if (props.columns) {
        classes.push(`md:grid-cols-${props.columns}`);
      }
      
      if (props.lgColumns) {
        classes.push(`lg:grid-cols-${props.lgColumns}`);
      }
      
      // Add gap classes
      if (props.variant === 'cards' || props.variant === 'brand-icon') {
        classes.push('gap-5 mt-5');
      } else if (props.variant === 'trending') {
        classes.push('gap-px bg-gray-900/5');
      } else {
        classes.push('gap-4');
      }
      
      // Add border and rounding classes for shared-borders variant
      if (props.variant === 'shared-borders') {
        classes.push('divide-y divide-gray-200 md:divide-y-0 md:divide-x overflow-hidden');
        if (props.rounded) {
          classes.push('rounded-lg');
        }
        classes.push('bg-white');
        if (props.withShadow) {
          classes.push('shadow-sm');
        }
      }
      
      // For dark variant
      if (props.variant === 'dark') {
        classes.push('gap-px bg-white/5');
      }
      
      return classes.join(' ');
    });
    
    // Individual stat card/item classes
    const statItemClasses = computed(() => {
      const baseClasses = [];
      
      // Base padding
      if (props.variant === 'brand-icon') {
        baseClasses.push('relative px-4 pt-5 pb-12 sm:px-6 sm:pt-6');
      } else if (props.variant === 'shared-borders') {
        baseClasses.push('px-4 py-5 sm:p-6');
      } else if (props.variant === 'trending') {
        baseClasses.push('flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 px-4 py-10 sm:px-6 xl:px-8');
      } else if (props.variant === 'dark') {
        baseClasses.push('bg-gray-900 px-4 py-6 sm:px-6 lg:px-8');
      } else {
        baseClasses.push('px-4 py-5 sm:p-6');
      }
      
      // Background color
      if (props.variant === 'cards' || props.variant === 'brand-icon') {
        baseClasses.push(`bg-${props.bgColor}`);
      } else if (props.variant === 'trending') {
        baseClasses.push(`bg-${props.bgColor}`);
      }
      
      // Add rounding except for shared-borders which has it on the container
      if (props.rounded && props.variant !== 'shared-borders') {
        baseClasses.push('rounded-lg');
      }
      
      // Add shadow
      if (props.withShadow && (props.variant === 'cards' || props.variant === 'brand-icon')) {
        baseClasses.push('shadow-sm');
      }
      
      // Add overflow hidden for brand-icon
      if (props.variant === 'brand-icon') {
        baseClasses.push('overflow-hidden');
      }
      
      return baseClasses.join(' ');
    });
    
    // Title label classes
    const titleLabelClasses = computed(() => {
      if (!props.title) return '';
      
      return 'text-base font-semibold text-gray-900';
    });
    
    // Stat label (dt) classes
    const statLabelClasses = computed(() => {
      if (props.variant === 'trending') {
        return 'text-sm/6 font-medium text-gray-500';
      } else if (props.variant === 'dark') {
        return 'text-sm/6 font-medium text-gray-400';
      } else if (props.variant === 'brand-icon') {
        return 'ml-16 truncate text-sm font-medium text-gray-500';
      } else if (props.variant === 'shared-borders') {
        return 'text-base font-normal text-gray-900';
      } else {
        return 'truncate text-sm font-medium text-gray-500';
      }
    });
    
    // Stat value (dd) classes
    const statValueClasses = computed(() => {
      if (props.variant === 'trending') {
        return 'w-full flex-none text-3xl/10 font-medium tracking-tight text-gray-900';
      } else if (props.variant === 'dark') {
        return 'mt-2 text-4xl font-semibold tracking-tight text-white';
      } else if (props.variant === 'brand-icon') {
        return 'ml-16 text-2xl font-semibold text-gray-900';
      } else if (props.variant === 'shared-borders') {
        return 'mt-1 text-2xl font-semibold text-blue-600';
      } else {
        return 'mt-1 text-3xl font-semibold tracking-tight text-gray-900';
      }
    });
    
    // Helper to determine trend color classes
    const getTrendClasses = (changeType) => {
      if (changeType === 'increase' || changeType === 'positive') {
        if (props.variant === 'shared-borders') {
          return 'bg-green-100 text-green-800';
        } else if (props.variant === 'trending') {
          return 'text-gray-700';
        } else {
          return 'text-green-600';
        }
      } else {
        if (props.variant === 'shared-borders') {
          return 'bg-red-100 text-red-800';
        } else if (props.variant === 'trending') {
          return 'text-rose-600';
        } else {
          return 'text-red-600';
        }
      }
    };
    
    // Trend icon classes
    const getTrendIconClasses = (changeType) => {
      if (changeType === 'increase' || changeType === 'positive') {
        return 'fas fa-arrow-up text-green-500';
      } else {
        return 'fas fa-arrow-down text-red-500';
      }
    };
    
    // Secondary text classes
    const secondaryTextClasses = computed(() => {
      if (props.variant === 'shared-borders') {
        return 'ml-2 text-sm font-medium text-gray-500';
      } else if (props.variant === 'dark') {
        return 'text-sm text-gray-400';
      } else {
        return 'text-sm text-gray-500';
      }
    });
    
    return {
      containerClasses,
      gridClasses,
      statItemClasses,
      titleLabelClasses,
      statLabelClasses,
      statValueClasses,
      getTrendClasses,
      getTrendIconClasses,
      secondaryTextClasses
    };
  },
  template: `
    <div :class="containerClasses">
      <!-- Section title if provided -->
      <h3 v-if="title" :class="titleLabelClasses">{{ title }}</h3>
      
      <!-- Stats Grid -->
      <dl :class="[title ? 'mt-5' : '', gridClasses]">
        <!-- Loop through each stat -->
        <div
          v-for="(stat, index) in stats"
          :key="stat.id || stat.name || index"
          :class="statItemClasses"
        >
          <!-- Stat with Brand Icon -->
          <template v-if="variant === 'brand-icon'">
            <dt>
              <!-- Icon background -->
              <div v-if="stat.icon" class="absolute rounded-md bg-indigo-500 p-3">
                <i :class="[stat.icon, 'w-6 h-6 text-white']" aria-hidden="true"></i>
              </div>
              <p :class="statLabelClasses">{{ stat.name }}</p>
            </dt>
            <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p :class="statValueClasses">{{ stat.stat || stat.value }}</p>
              
              <!-- Trend indicator -->
              <p v-if="showTrend && stat.change" :class="['ml-2 flex items-baseline text-sm font-semibold', getTrendClasses(stat.changeType)]">
                <i :class="[getTrendIconClasses(stat.changeType), 'h-5 w-5 shrink-0 self-center mr-1']" aria-hidden="true"></i>
                <span class="sr-only">{{ stat.changeType === 'increase' || stat.changeType === 'positive' ? 'Increased' : 'Decreased' }} by</span>
                {{ stat.change }}
              </p>
              
              <!-- View More Link -->
              <div class="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                <div class="text-sm">
                  <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500">
                    View all<span class="sr-only"> {{ stat.name }} stats</span>
                  </a>
                </div>
              </div>
            </dd>
          </template>
          
          <!-- Shared Borders Variant -->
          <template v-else-if="variant === 'shared-borders'">
            <dt :class="statLabelClasses">{{ stat.name }}</dt>
            <dd class="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div class="flex items-baseline">
                <div :class="statValueClasses">{{ stat.stat || stat.value }}</div>
                <span v-if="showSecondary && stat.previousStat" :class="secondaryTextClasses">
                  from {{ stat.previousStat }}
                </span>
              </div>
              
              <!-- Trend pill -->
              <div v-if="showTrend && stat.change" :class="['inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0', getTrendClasses(stat.changeType)]">
                <i :class="[getTrendIconClasses(stat.changeType), 'mr-0.5 -ml-1 h-5 w-5 shrink-0 self-center']" aria-hidden="true"></i>
                <span class="sr-only">{{ stat.changeType === 'increase' || stat.changeType === 'positive' ? 'Increased' : 'Decreased' }} by</span>
                {{ stat.change }}
              </div>
            </dd>
          </template>
          
          <!-- Dark Variant -->
          <template v-else-if="variant === 'dark'">
            <p :class="statLabelClasses">{{ stat.name }}</p>
            <p class="mt-2 flex items-baseline gap-x-2">
              <span :class="statValueClasses">{{ stat.stat || stat.value }}</span>
              <span v-if="showSecondary && stat.unit" :class="secondaryTextClasses">{{ stat.unit }}</span>
            </p>
          </template>
          
          <!-- Trending Variant -->
          <template v-else-if="variant === 'trending'">
            <dt :class="statLabelClasses">{{ stat.name }}</dt>
            <dd v-if="showTrend && stat.change" :class="['text-xs font-medium', getTrendClasses(stat.changeType)]">{{ stat.change }}</dd>
            <dd :class="statValueClasses">{{ stat.stat || stat.value }}</dd>
          </template>
          
          <!-- Default Simple and Cards Variants -->
          <template v-else>
            <dt :class="statLabelClasses">{{ stat.name }}</dt>
            <dd :class="statValueClasses">{{ stat.stat || stat.value }}</dd>
          </template>
        </div>
      </dl>
    </div>
  `
}; 