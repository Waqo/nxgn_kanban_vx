const { ref, computed, watch } = Vue;

export default {
  name: 'BaseCalendar',
  props: {
    // Core data
    date: {
      type: [Date, String],
      default: () => new Date()
    },
    events: {
      type: Array,
      default: () => []
    },
    // View configuration
    view: {
      type: String, 
      default: 'month',
      validator: value => ['day', 'week', 'month', 'year', 'mini'].includes(value)
    },
    // Display variants
    variant: {
      type: String,
      default: 'default',
      validator: value => [
        'default',          // Standard calendar
        'card',             // Card-style with shadow and rounded corners
        'borderless',       // No borders between days
        'mini',             // Compact mini calendar
        'double',           // Two months side by side
        'stacked',          // Calendar with events stacked below
        'side-by-side',     // Calendar and events side by side
        'dark'              // Dark theme calendar
      ].includes(value)
    },
    // Feature flags
    showHeader: {
      type: Boolean,
      default: true
    },
    showNavigation: {
      type: Boolean,
      default: true
    },
    showViewSelector: {
      type: Boolean,
      default: false
    },
    showEvents: {
      type: Boolean,
      default: true
    },
    // Styling options
    showWeekends: {
      type: Boolean,
      default: true
    },
    firstDayMonday: {
      type: Boolean,
      default: true
    },
    rounded: {
      type: Boolean,
      default: true
    },
    withShadow: {
      type: Boolean,
      default: false
    },
    bgColor: {
      type: String,
      default: 'white'
    },
    maxEventsToShow: {
      type: Number,
      default: 2
    },
    // Custom classes
    className: {
      type: String,
      default: ''
    }
  },
  emits: [
    'date-change',
    'view-change',
    'day-click', 
    'event-click', 
    'add-event',
    'today-click'
  ],
  setup(props, { emit }) {
    // --- Reactive State --- 
    const currentDate = ref(parseDate(props.date));
    const selectedDate = ref(null);
    const currentView = ref(props.view);
    const dropdownOpen = ref(false);

    // --- Utility Methods --- 
    function parseDate(dateInput) {
      if (dateInput instanceof Date) {
        return new Date(dateInput);
      }
      if (typeof dateInput === 'string') {
        return new Date(dateInput);
      }
      return new Date();
    }

    function formatDateString(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    function getEventsForDate(dateString) {
      return props.events.filter(event => {
        return event.date === dateString || 
               (event.datetime && event.datetime.startsWith(dateString));
      });
    }

    // --- Computed Properties --- 

    const formattedMonth = computed(() => currentDate.value.toLocaleString('default', { month: 'long' }));
    const formattedYear = computed(() => currentDate.value.getFullYear());
    const formattedCurrentDate = computed(() => {
        return currentDate.value.toLocaleString('default', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric'
        });
    });
    const currentDay = computed(() => currentDate.value.getDate());
    const currentDayOfWeek = computed(() => currentDate.value.toLocaleString('default', { weekday: 'long' }));

    const monthDays = computed(() => {
      const year = currentDate.value.getFullYear();
      const month = currentDate.value.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      let firstDayOffset = firstDay.getDay();
      if (props.firstDayMonday) {
        firstDayOffset = firstDayOffset === 0 ? 6 : firstDayOffset - 1;
      }
      const days = [];
      const prevMonth = new Date(year, month, 0);
      const prevMonthDays = prevMonth.getDate();
      for (let i = prevMonthDays - firstDayOffset + 1; i <= prevMonthDays; i++) {
        days.push({ date: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`, day: i, isCurrentMonth: false, isToday: false, isSelected: false, events: [] });
      }
      const today = new Date();
      const isCurrentMonthView = today.getFullYear() === year && today.getMonth() === month;
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isSelectedDay = selectedDate.value && selectedDate.value.getDate() === i && 
                            selectedDate.value.getMonth() === month && 
                            selectedDate.value.getFullYear() === year;
        days.push({
          date: dateString, day: i, isCurrentMonth: true,
          isToday: isCurrentMonthView && today.getDate() === i,
          isSelected: isSelectedDay,
          events: getEventsForDate(dateString)
        });
      }
      const daysNeeded = 42 - days.length;
      for (let i = 1; i <= daysNeeded; i++) {
        days.push({ date: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`, day: i, isCurrentMonth: false, isToday: false, isSelected: false, events: [] });
      }
      return days;
    });

    const weekDays = computed(() => {
      const days = props.firstDayMonday ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      return days.map((day, index) => {
        let longName = props.firstDayMonday ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index];
        return { short: day, long: longName };
      });
    });

    // (Keep other computed properties like weekDates, hourlyGrid, is*View, is*Variant, eventsForSelectedDate - they depend on reactive refs)
    const weekDates = computed(() => {
      const curr = new Date(currentDate.value);
      const week = [];
      let day = curr.getDay() || 7; 
      if (props.firstDayMonday) {
        day = day === 0 ? 7 : day;
        curr.setDate(curr.getDate() - (day - 1));
      } else {
        curr.setDate(curr.getDate() - day);
      }
      for (let i = 0; i < 7; i++) {
        const date = new Date(curr);
        date.setDate(curr.getDate() + i);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const isSelectedDay = selectedDate.value && date.toDateString() === selectedDate.value.toDateString();
        const dateString = formatDateString(date);
        week.push({
          date: dateString, day: date.getDate(), weekday: date.toLocaleString('default', { weekday: 'short' }),
          isToday, isSelected: isSelectedDay, events: getEventsForDate(dateString)
        });
      }
      return week;
    });

    const hourlyGrid = computed(() => {
      const hours = [];
      for (let i = 0; i < 24; i++) {
        hours.push({ hour: i, label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`, events: [] });
      }
      return hours;
    });

    const containerClasses = computed(() => {
      const classes = [];
      if (props.variant === 'card') classes.push('border border-gray-200 rounded-lg shadow');
      if (props.variant === 'dark') classes.push('bg-gray-800 text-white');
      else classes.push(`bg-${props.bgColor}`);
      if (props.className) classes.push(props.className);
      return classes.join(' ');
    });

    const gridClasses = computed(() => {
      const classes = ['grid grid-cols-7'];
      if (props.variant === 'borderless') classes.push('gap-1');
      else {
        if (props.variant === 'dark') classes.push('divide-gray-700 gap-px bg-gray-700');
        else classes.push('divide-gray-200 gap-px bg-gray-200');
      }
      if (props.rounded) classes.push('rounded-lg');
      if (props.withShadow) classes.push('shadow-sm');
      return classes.join(' ');
    });

    const dayHeaderClasses = computed(() => props.variant === 'dark' ? 'py-2 text-center text-xs text-gray-400' : 'py-2 text-center text-xs text-gray-500');

    const isDayView = computed(() => currentView.value === 'day');
    const isWeekView = computed(() => currentView.value === 'week');
    const isMonthView = computed(() => currentView.value === 'month' || currentView.value === 'mini');
    const isYearView = computed(() => currentView.value === 'year');
    const isMiniView = computed(() => currentView.value === 'mini' || props.variant === 'mini');
    const isDoubleView = computed(() => props.variant === 'double');

    const eventsForSelectedDate = computed(() => {
      if (!selectedDate.value) return [];
      const dateString = formatDateString(selectedDate.value);
      return getEventsForDate(dateString);
    });

    // --- Watchers --- 
    watch(() => props.date, (newDate) => { currentDate.value = parseDate(newDate); });
    watch(() => props.view, (newView) => { currentView.value = newView; });

    // --- Methods --- 
    const goToPreviousPeriod = () => {
      const date = new Date(currentDate.value);
      if (isYearView.value) date.setFullYear(date.getFullYear() - 1);
      else if (isMonthView.value) date.setMonth(date.getMonth() - 1);
      else if (isWeekView.value) date.setDate(date.getDate() - 7);
      else if (isDayView.value) date.setDate(date.getDate() - 1);
      currentDate.value = date;
      emit('date-change', date);
    };

    const goToNextPeriod = () => {
      const date = new Date(currentDate.value);
      if (isYearView.value) date.setFullYear(date.getFullYear() + 1);
      else if (isMonthView.value) date.setMonth(date.getMonth() + 1);
      else if (isWeekView.value) date.setDate(date.getDate() + 7);
      else if (isDayView.value) date.setDate(date.getDate() + 1);
      currentDate.value = date;
      emit('date-change', date);
    };

    const goToToday = () => {
      const today = new Date();
      currentDate.value = today;
      emit('date-change', today);
      emit('today-click');
    };

    const handleDayClick = (day) => {
      const clickedDate = parseDate(day.date);
      selectedDate.value = clickedDate;
      if (!day.isCurrentMonth) {
        currentDate.value = clickedDate;
        emit('date-change', clickedDate);
      }
      emit('day-click', clickedDate, day);
    };

    const handleEventClick = (event) => { emit('event-click', event); };

    const handleViewChange = (view) => {
      currentView.value = view;
      dropdownOpen.value = false;
      emit('view-change', view);
    };

    const handleAddEvent = () => { emit('add-event', selectedDate.value || currentDate.value); };

    const toggleDropdown = () => { dropdownOpen.value = !dropdownOpen.value; };

    // --- Return values for template --- 
    return {
      currentDate,
      selectedDate,
      currentView,
      dropdownOpen,
      // Computed
      formattedMonth,
      formattedYear,
      formattedCurrentDate,
      currentDay,
      currentDayOfWeek,
      monthDays,
      weekDays,
      weekDates,
      hourlyGrid,
      containerClasses,
      gridClasses,
      dayHeaderClasses,
      isDayView,
      isWeekView,
      isMonthView,
      isYearView,
      isMiniView,
      isDoubleView,
      eventsForSelectedDate,
      // Methods
      goToPreviousPeriod,
      goToNextPeriod,
      goToToday,
      handleDayClick,
      handleEventClick,
      handleViewChange,
      handleAddEvent,
      toggleDropdown,
      // Utilities needed in template
      formatDateString 
    };
  },
  template: `
    <div :class="containerClasses">
      <!-- Calendar Header -->
      <header v-if="showHeader" class="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <h2 class="text-base font-semibold" :class="variant === 'dark' ? 'text-white' : 'text-gray-900'">
          <span v-if="isMonthView">{{ formattedMonth }} {{ formattedYear }}</span>
          <span v-else-if="isDayView">
            <time :datetime="formatDateString(currentDate)">{{ formattedCurrentDate }}</time>
            <p class="mt-1 text-sm text-gray-500">{{ currentDayOfWeek }}</p>
          </span>
          <span v-else-if="isWeekView">{{ formattedMonth }} {{ formattedYear }}</span>
          <span v-else-if="isYearView">{{ formattedYear }}</span>
        </h2>
        
        <!-- Navigation Controls -->
        <div v-if="showNavigation" class="flex items-center space-x-2">
          <!-- Navigation Buttons -->
          <div class="flex items-center rounded-md bg-white shadow-xs">
            <button 
              type="button" 
              @click="goToPreviousPeriod"
              class="flex h-8 w-8 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500"
            >
              <span class="sr-only">Previous {{ currentView }}</span>
              <i class="fas fa-chevron-left w-5 h-5"></i> <!-- Using Font Awesome -->
            </button>
            <button 
              type="button" 
              @click="goToToday"
              class="hidden border-y border-gray-300 px-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 sm:block"
            >
              Today
            </button>
            <button 
              type="button" 
              @click="goToNextPeriod"
              class="flex h-8 w-8 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500"
            >
              <span class="sr-only">Next {{ currentView }}</span>
              <i class="fas fa-chevron-right w-5 h-5"></i> <!-- Using Font Awesome -->
            </button>
          </div>
          
          <!-- View Selector -->
          <div v-if="showViewSelector" class="relative">
            <button 
              type="button" 
              @click="toggleDropdown"
              class="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
            >
              {{ currentView.charAt(0).toUpperCase() + currentView.slice(1) }} view
              <i class="fas fa-chevron-down w-5 h-5 text-gray-400"></i> <!-- Using Font Awesome -->
            </button>
            
            <!-- Dropdown Menu -->
            <div 
              v-if="dropdownOpen"
              class="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
            >
              <div class="py-1">
                <a 
                  href="#" 
                  @click.prevent="handleViewChange('day')"
                  :class="['block px-4 py-2 text-sm', currentView === 'day' ? 'bg-gray-100 text-gray-900' : 'text-gray-700']"
                >
                  Day view
                </a>
                <a 
                  href="#" 
                  @click.prevent="handleViewChange('week')"
                  :class="['block px-4 py-2 text-sm', currentView === 'week' ? 'bg-gray-100 text-gray-900' : 'text-gray-700']"
                >
                  Week view
                </a>
                <a 
                  href="#" 
                  @click.prevent="handleViewChange('month')"
                  :class="['block px-4 py-2 text-sm', currentView === 'month' ? 'bg-gray-100 text-gray-900' : 'text-gray-700']"
                >
                  Month view
                </a>
                <a 
                  href="#" 
                  @click.prevent="handleViewChange('year')"
                  :class="['block px-4 py-2 text-sm', currentView === 'year' ? 'bg-gray-100 text-gray-900' : 'text-gray-700']"
                >
                  Year view
                </a>
              </div>
            </div>
          </div>
          
          <!-- Add Event Button -->
          <button 
            type="button" 
            @click="handleAddEvent"
            class="ml-2 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add event
          </button>
        </div>
      </header>
      
      <!-- Month View Calendar -->
      <div v-if="isMonthView" class="calendar-body">
        <!-- Day Headers -->
        <div class="grid grid-cols-7 text-xs/6 text-gray-500">
          <div v-for="day in weekDays" :key="day.short" :class="dayHeaderClasses">
            {{ day.short }}<span class="sr-only sm:not-sr-only">{{ day.long.substring(1) }}</span>
          </div>
        </div>
        
        <!-- Calendar Grid -->
        <div :class="gridClasses">
          <div
            v-for="(day, index) in monthDays"
            :key="day.date"
            :class="[
              variant === 'dark' ? (day.isCurrentMonth ? 'bg-gray-800' : 'bg-gray-900 text-gray-400') : (day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'),
              'py-2 px-3 relative',
              variant !== 'borderless' ? 'min-h-[60px]' : '',
              variant === 'borderless' && index > 6 ? 'border-t border-gray-200' : ''
            ]"
          >
            <!-- Day Number -->
            <time
              :datetime="day.date"
              :class="[
                day.isToday ? 'flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white' : '',
                day.isSelected && !day.isToday ? 'flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 font-semibold text-white' : '',
                !day.isSelected && !day.isToday ? 'text-sm' : '',
                isMiniView ? 'mx-auto flex h-6 w-6 items-center justify-center' : ''
              ]"
              @click="handleDayClick(day)"
            >
              {{ day.day }}
            </time>
            
            <!-- Events for the day -->
            <ol v-if="showEvents && day.events.length > 0 && !isMiniView" class="mt-2">
              <li v-for="(event, eventIndex) in day.events.slice(0, maxEventsToShow)" :key="event.id || eventIndex">
                <a
                  href="#"
                  @click.prevent="handleEventClick(event)"
                  class="group flex"
                >
                  <p class="flex-auto truncate text-xs font-medium text-gray-900 group-hover:text-indigo-600">
                    {{ event.name }}
                  </p>
                  <time
                    v-if="event.time"
                    :datetime="event.datetime"
                    class="ml-3 hidden flex-none text-xs text-gray-500 group-hover:text-indigo-600 xl:block"
                  >
                    {{ event.time }}
                  </time>
                </a>
              </li>
              <li v-if="day.events.length > maxEventsToShow" class="text-xs text-gray-500">
                + {{ day.events.length - maxEventsToShow }} more
              </li>
            </ol>
            
            <!-- Dots for mini calendar with events -->
            <div v-if="isMiniView && day.events.length > 0" class="mt-auto flex flex-wrap-reverse justify-center">
              <span 
                v-for="event in day.events.slice(0, 3)" 
                :key="event.id"
                class="mx-0.5 mb-1 h-1.5 w-1.5 rounded-full bg-gray-400"
              ></span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stacked Events List -->
      <div v-if="(variant === 'stacked' || variant === 'side-by-side') && selectedDate" class="event-list mt-4 px-4">
        <h2 class="text-base font-semibold text-gray-900">
          Schedule for <time :datetime="formatDateString(selectedDate)">{{ selectedDate.toLocaleDateString() }}</time>
        </h2>
        
        <ol v-if="eventsForSelectedDate.length > 0" class="mt-4 space-y-1 text-sm">
          <li 
            v-for="event in eventsForSelectedDate" 
            :key="event.id"
            class="group relative flex items-center space-x-4 rounded-md px-4 py-2 hover:bg-gray-100"
          >
            <!-- Event with avatar if available -->
            <img 
              v-if="event.imageUrl"
              :src="event.imageUrl" 
              alt="" 
              class="h-10 w-10 flex-none rounded-full"
            />
            <div class="flex-auto min-w-0">
              <p class="text-gray-900 font-medium">{{ event.name }}</p>
              <p v-if="event.time || event.datetime" class="text-gray-500">
                <time :datetime="event.datetime">{{ event.time || event.datetime }}</time>
              </p>
            </div>
            <div class="flex-shrink-0">
              <slot name="event-actions" :event="event"></slot>
            </div>
          </li>
        </ol>
        
        <p v-else class="mt-4 text-gray-500 text-sm py-4">No events scheduled for this day.</p>
      </div>
    </div>
  `
}; 