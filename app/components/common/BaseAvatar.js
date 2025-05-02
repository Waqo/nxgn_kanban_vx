const { computed } = Vue;

export default {
  name: 'BaseAvatar',
  props: {
    // Initials to display
    initials: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'md', // xs, sm, md, lg, xl
      validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
    },
    // Optional background color class for initials fallback
    bgColorClass: {
      type: String,
      default: 'bg-gray-500' // Default grey, can be overridden
    }
  },
  setup(props) {
      const sizeClasses = computed(() => {
        switch (props.size) {
          case 'xs': return 'h-6 w-6 text-xs';
          case 'sm': return 'h-8 w-8 text-sm';
          case 'md': return 'h-10 w-10 text-base';
          case 'lg': return 'h-12 w-12 text-lg';
          case 'xl': return 'h-14 w-14 text-xl';
          default: return 'h-10 w-10 text-base';
        }
      });
      
      // Calculate display initials (e.g., first letter of first/last name)
      const initialsDisplay = computed(() => {
          const nameParts = props.initials?.trim().split(' ') || [];
          if (nameParts.length >= 2) {
              return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
          } else if (props.initials?.length) {
              return props.initials.substring(0, 2).toUpperCase();
          }
          return '??'; // Fallback if no initials provided
      });

      const containerClasses = computed(() => {
          return [
              'inline-flex items-center justify-center overflow-hidden rounded-full',
              sizeClasses.value,
              props.bgColorClass
          ].join(' ');
      });

      return {
          initialsDisplay,
          containerClasses
      };
  },
  template: `
    <span :class="containerClasses">
        <span class="font-medium leading-none text-white">{{ initialsDisplay }}</span>
    </span>
  `
}; 