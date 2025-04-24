// app/components/common/BaseAlert.js
export default {
  name: 'BaseAlert',
  props: {
    color: {
      type: String,
      default: 'yellow', // yellow, red, green, blue
    },
    title: {
        type: String,
        default: ''
    },
    // Content is provided via the default slot
  },
  computed: {
    containerClasses() {
      switch (this.color?.toLowerCase()) {
        case 'red': return 'bg-red-50';
        case 'green': return 'bg-green-50';
        case 'blue': return 'bg-blue-50';
        case 'yellow':
        default: return 'bg-yellow-50';
      }
    },
    iconClasses() {
       switch (this.color?.toLowerCase()) {
        case 'red': return 'text-red-400';
        case 'green': return 'text-green-400';
        case 'blue': return 'text-blue-400';
        case 'yellow':
        default: return 'text-yellow-400';
      }
    },
     titleClasses() {
       switch (this.color?.toLowerCase()) {
        case 'red': return 'text-red-800';
        case 'green': return 'text-green-800';
        case 'blue': return 'text-blue-800';
        case 'yellow':
        default: return 'text-yellow-800';
      }
    },
    contentClasses() {
       switch (this.color?.toLowerCase()) {
        case 'red': return 'text-red-700';
        case 'green': return 'text-green-700';
        case 'blue': return 'text-blue-700';
        case 'yellow':
        default: return 'text-yellow-700';
      }
    }
  },
  // Template defined in widget.html
  template: '#base-alert-template'
};

