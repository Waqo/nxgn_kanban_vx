// app/components/common/BaseBadge.js

const { computed } = Vue;

export default {
  name: 'BaseBadge',
  props: {
    color: {
      type: String,
      default: 'gray', // gray, red, yellow, green, blue, indigo, purple, pink
    },
    align: {
      type: String,
      default: 'left', // 'left' or 'center'
      validator: (value) => ['left', 'center'].includes(value)
    },
    // Add props for size (sm, md), dot, removable later if needed
  },
  setup(props) {
    const badgeClasses = computed(() => {
      // Add justify-start for left align, justify-center for center align
      const alignmentClasses = props.align === 'center' 
          ? 'justify-center text-center' 
          : 'justify-start text-left';

      const baseClasses = `inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${alignmentClasses}`;
      let colorClasses = '';

      // Determine color classes based on color prop
      switch (props.color?.toLowerCase()) {
        case 'red': colorClasses = 'bg-red-50 text-red-700 ring-red-600/10'; break;
        case 'yellow': colorClasses = 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'; break;
        case 'green': colorClasses = 'bg-green-50 text-green-700 ring-green-600/20'; break;
        case 'blue': colorClasses = 'bg-blue-50 text-blue-700 ring-blue-700/10'; break;
        case 'indigo': colorClasses = 'bg-indigo-50 text-indigo-700 ring-indigo-700/10'; break;
        case 'purple': colorClasses = 'bg-purple-50 text-purple-700 ring-purple-700/10'; break;
        case 'pink': colorClasses = 'bg-pink-50 text-pink-700 ring-pink-700/10'; break;
        case 'gray':
        default:
          colorClasses = 'bg-gray-50 text-gray-600 ring-gray-500/10';
          break;
      }
      
      return `${baseClasses} ${colorClasses}`;
    });

    return {
      badgeClasses
    };
  },
  // Define template inline
  template: `
    <span :class="badgeClasses">
      <slot></slot>
    </span>
  `
};

