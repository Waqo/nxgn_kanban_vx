// app/components/common/BaseFeed.js

export default {
  name: 'BaseFeed',
  props: {
    items: {
      type: Array,
      default: () => [],
      // Expected item shape: { id, content, target?, href?, date, datetime, icon?, iconBackground? }
      // icon and iconBackground are simplified for now
    }
  },
  methods: {
      // We might need methods later to determine icon/styling based on item type
      getIconBackgroundClass(item) {
          // Basic default, can be expanded
          return item.iconBackground || 'bg-gray-400';
      },
      // Placeholder for icon rendering - use slot or simple text/FA icon later
      renderIcon(item) { 
          // Example: if item.icon is a FontAwesome class name
          // return `<i class="${item.icon} h-5 w-5 text-white" aria-hidden="true"></i>`;
          // For now, just a placeholder character
          return '?'; 
      }
  },
  // Template defined in widget.html
  template: '#base-feed-template'
};

// Expose globally
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.BaseFeed = BaseFeed; 