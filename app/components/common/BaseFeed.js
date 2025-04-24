export default {
  name: 'BaseFeed',
  props: {
    // Expects array of objects like:
    // { id: 1, content: 'Applied to', target: 'Front End Developer', href: '#', date: 'Sep 20', datetime: '2020-09-20', icon: 'UserIcon', iconBackground: 'bg-gray-400' }
    // We'll map icon string names to classes for simplicity without heroicons library
    items: {
      type: Array,
      required: true
    }
  },
  methods: {
    getIconClass(iconName) {
        // Map simple names or Font Awesome names to CSS classes
        // Add more mappings as needed
        const iconMap = {
            UserIcon: 'fas fa-user',
            HandThumbUpIcon: 'fas fa-thumbs-up',
            CheckIcon: 'fas fa-check',
            // Add more... default to a calendar or info icon?
            default: 'fas fa-info-circle'
        };
        return iconMap[iconName] || iconMap.default;
    }
  },
  template: `
    <div class="flow-root">
      <ul role="list" class="-mb-8">
        <li v-for="(item, itemIdx) in items" :key="item.id">
          <div class="relative pb-8">
            <!-- Connecting line (except for last item) -->
            <span v-if="itemIdx !== items.length - 1" class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
            <div class="relative flex space-x-3">
              <!-- Icon -->
              <div>
                <span :class="[item.iconBackground || 'bg-gray-400', 'flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white']">
                  <!-- Use <i> with Font Awesome classes (ensure Font Awesome is loaded) -->
                  <i :class="[getIconClass(item.icon), 'h-5 w-5 text-white']" aria-hidden="true"></i>
                  <!-- Or use SVG paths if preferred -->
                </span>
              </div>
              <!-- Content -->
              <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                <div>
                  <p class="text-sm text-gray-500">
                    {{ item.content }} 
                    <a v-if="item.href && item.target" :href="item.href" class="font-medium text-gray-900">{{ item.target }}</a>
                    <span v-else-if="item.target" class="font-medium text-gray-900">{{ item.target }}</span>
                  </p>
                </div>
                <div class="text-right text-sm whitespace-nowrap text-gray-500">
                  <time :datetime="item.datetime">{{ item.date }}</time>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  `
}; 