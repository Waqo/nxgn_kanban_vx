// app/components/kanban/KanbanBoardSkeleton.js

const KanbanBoardSkeleton = {
  name: 'KanbanBoardSkeleton',
  // No props needed for a static skeleton
  template: `
    <div class="kanban-board-skeleton flex-grow flex space-x-4 overflow-x-auto p-4 bg-gray-100 h-full items-start animate-pulse">
      
      <!-- Repeat skeleton columns (5 times) -->
      <div v-for="n in 10" :key="n" class="skeleton-column w-72 flex-shrink-0 bg-gray-200 rounded-lg shadow space-y-3 p-3 h-full">
        <!-- Skeleton Column Header -->
        <div class="h-8 bg-gray-300 rounded w-3/4"></div>
        
        <!-- Skeleton Cards (10 per column) -->
        <div class="space-y-2">
          <div class="h-20 bg-gray-300 rounded"></div>
<div class="h-18 bg-gray-300 rounded"></div>
<div class="h-22 bg-gray-300 rounded w-5/6"></div>
<div class="h-16 bg-gray-300 rounded"></div>
<div class="h-24 bg-gray-300 rounded"></div>
<div class="h-19 bg-gray-300 rounded"></div>
<div class="h-21 bg-gray-300 rounded w-11/12"></div>
<div class="h-17 bg-gray-300 rounded"></div>
<div class="h-23 bg-gray-300 rounded"></div>
<div class="h-20 bg-gray-300 rounded w-full"></div>
<div class="h-16 bg-gray-300 rounded"></div>
<div class="h-22 bg-gray-300 rounded w-5/6"></div>
<div class="h-24 bg-gray-300 rounded"></div>
<div class="h-18 bg-gray-300 rounded"></div>
<div class="h-20 bg-gray-300 rounded w-5/6"></div>
<div class="h-17 bg-gray-300 rounded"></div>
<div class="h-23 bg-gray-300 rounded"></div>
        </div>
      </div>

    </div>
  `
};

export default KanbanBoardSkeleton; 