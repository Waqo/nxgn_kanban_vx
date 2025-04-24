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
  computed: {
    sizeClasses() {
      switch (this.size) {
        case 'xs': return 'h-6 w-6 text-xs';
        case 'sm': return 'h-8 w-8 text-sm';
        case 'md': return 'h-10 w-10 text-base';
        case 'lg': return 'h-12 w-12 text-lg';
        case 'xl': return 'h-14 w-14 text-xl';
        default: return 'h-10 w-10 text-base';
      }
    },
    // Calculate display initials (e.g., first letter of first/last name)
    initialsDisplay() {
        const nameParts = this.initials?.trim().split(' ') || [];
        if (nameParts.length >= 2) {
            return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else if (this.initials?.length) {
            return this.initials.substring(0, 2).toUpperCase();
        }
        return '??'; // Fallback if no initials provided
    }
  },
  template: `
    <span :class="['inline-flex items-center justify-center overflow-hidden rounded-full', sizeClasses, bgColorClass]">
        <span class="font-medium leading-none text-white">{{ initialsDisplay }}</span>
    </span>
  `
}; 