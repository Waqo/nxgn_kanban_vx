// app/components/common/BaseGridList.js

const { computed } = Vue;

export default {
  name: 'BaseGridList',
  props: {
    // The HTML tag to use for the grid container
    tag: {
      type: String,
      default: 'ul', // Common use case is a list
      validator: (value) => ['ul', 'div'].includes(value)
    },
    // Base number of columns (mobile-first)
    cols: {
      type: [String, Number],
      default: 1
    },
    // Responsive columns
    smCols: { type: [String, Number], default: null },
    mdCols: { type: [String, Number], default: null },
    lgCols: { type: [String, Number], default: null },
    xlCols: { type: [String, Number], default: null },
    xxlCols: { type: [String, Number], default: null }, // For 2xl breakpoint
    // Gap sizes (applied uniformly)
    gap: { type: [String, Number], default: 6 },
    smGap: { type: [String, Number], default: null },
    mdGap: { type: [String, Number], default: null },
    lgGap: { type: [String, Number], default: null },
    xlGap: { type: [String, Number], default: null },
    xxlGap: { type: [String, Number], default: null },
    // Specific gap sizes (override uniform gap if provided)
    gapX: { type: [String, Number], default: null },
    smGapX: { type: [String, Number], default: null },
    mdGapX: { type: [String, Number], default: null },
    lgGapX: { type: [String, Number], default: null },
    xlGapX: { type: [String, Number], default: null },
    xxlGapX: { type: [String, Number], default: null },
    gapY: { type: [String, Number], default: null },
    smGapY: { type: [String, Number], default: null },
    mdGapY: { type: [String, Number], default: null },
    lgGapY: { type: [String, Number], default: null },
    xlGapY: { type: [String, Number], default: null },
    xxlGapY: { type: [String, Number], default: null },
  },
  setup(props) {
    /**
     * Dynamically generates the Tailwind CSS class string for the grid container.
     * @returns {string} The computed class string.
     */
    const gridClasses = computed(() => {
      const classes = ['grid'];

      // Column classes
      if (props.cols) classes.push(`grid-cols-${props.cols}`);
      if (props.smCols) classes.push(`sm:grid-cols-${props.smCols}`);
      if (props.mdCols) classes.push(`md:grid-cols-${props.mdCols}`);
      if (props.lgCols) classes.push(`lg:grid-cols-${props.lgCols}`);
      if (props.xlCols) classes.push(`xl:grid-cols-${props.xlCols}`);
      if (props.xxlCols) classes.push(`2xl:grid-cols-${props.xxlCols}`);

      // Gap classes (prefer specific gapX/gapY if provided)
      const hasSpecificX = props.gapX || props.smGapX || props.mdGapX || props.lgGapX || props.xlGapX || props.xxlGapX;
      const hasSpecificY = props.gapY || props.smGapY || props.mdGapY || props.lgGapY || props.xlGapY || props.xxlGapY;

      if (hasSpecificX) {
        if (props.gapX) classes.push(`gap-x-${props.gapX}`);
        if (props.smGapX) classes.push(`sm:gap-x-${props.smGapX}`);
        if (props.mdGapX) classes.push(`md:gap-x-${props.mdGapX}`);
        if (props.lgGapX) classes.push(`lg:gap-x-${props.lgGapX}`);
        if (props.xlGapX) classes.push(`xl:gap-x-${props.xlGapX}`);
        if (props.xxlGapX) classes.push(`2xl:gap-x-${props.xxlGapX}`);
      }
      if (hasSpecificY) {
        if (props.gapY) classes.push(`gap-y-${props.gapY}`);
        if (props.smGapY) classes.push(`sm:gap-y-${props.smGapY}`);
        if (props.mdGapY) classes.push(`md:gap-y-${props.mdGapY}`);
        if (props.lgGapY) classes.push(`lg:gap-y-${props.lgGapY}`);
        if (props.xlGapY) classes.push(`xl:gap-y-${props.xlGapY}`);
        if (props.xxlGapY) classes.push(`2xl:gap-y-${props.xxlGapY}`);
      }

      // Apply uniform gap only if specific gaps were NOT defined
      if (!hasSpecificX && !hasSpecificY) {
        if (props.gap) classes.push(`gap-${props.gap}`);
        if (props.smGap) classes.push(`sm:gap-${props.smGap}`);
        if (props.mdGap) classes.push(`md:gap-${props.mdGap}`);
        if (props.lgGap) classes.push(`lg:gap-${props.lgGap}`);
        if (props.xlGap) classes.push(`xl:gap-${props.xlGap}`);
        if (props.xxlGap) classes.push(`2xl:gap-${props.xxlGap}`);
      }

      return classes.join(' ');
    });
    
    return { gridClasses };
  },
  // Implement inline template
  template: `
    <component :is="tag" :class="gridClasses" role="list">
      <slot></slot>
    </component>
  `
};

// Expose globally (optional, depends on your setup)
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseGridList = BaseGridList; 