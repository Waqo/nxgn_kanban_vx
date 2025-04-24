// app/components/common/BaseAvatar.js

export default {
  name: 'BaseAvatar',
  props: {
    src: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: ''
    },
    size: {
        type: String,
        default: 'md' // xs, sm, md, lg, xl
    },
    bgColorClass: { // Allow overriding background color
        type: String,
        default: 'bg-gray-500' 
    }
  },
  data() {
    return {
        imageError: false
    };
  },
  computed: {
    initials() {
      if (!this.name) return '?';
      const nameParts = this.name.trim().split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else if (this.name.length) {
        return this.name.substring(0, 2).toUpperCase();
      }
      return '?';
    },
    showImage() {
        return this.src && !this.imageError;
    },
    avatarClasses() {
        let sizeClasses = '';
        switch(this.size) {
            case 'xs': sizeClasses = 'h-6 w-6'; break;
            case 'sm': sizeClasses = 'h-8 w-8'; break;
            case 'lg': sizeClasses = 'h-12 w-12'; break;
            case 'xl': sizeClasses = 'h-14 w-14'; break;
            case 'md':
            default: sizeClasses = 'h-10 w-10'; break;
        }
        return `inline-flex items-center justify-center rounded-full ${this.bgColorClass} ${sizeClasses}`;
    },
    initialsClasses() {
        let sizeClasses = '';
        switch(this.size) {
            case 'xs': sizeClasses = 'text-xs'; break;
            case 'sm': sizeClasses = 'text-sm'; break;
            case 'lg': sizeClasses = 'text-lg'; break;
            case 'xl': sizeClasses = 'text-xl'; break;
            case 'md':
            default: sizeClasses = 'text-base'; break; // text-base is default font-size
        }
        return `font-medium leading-none text-white ${sizeClasses}`;
    }
  },
  methods: {
    handleImageError() {
      this.imageError = true;
    }
  },
  // Template defined in widget.html
  template: '#base-avatar-template'
};

