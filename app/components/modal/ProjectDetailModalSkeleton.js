const ProjectDetailModalSkeleton = {
  name: 'ProjectDetailModalSkeleton',
  template: `
    <div class="animate-pulse">
      <!-- Skeleton Header -->
      <div class="bg-gray-300 p-6">
        <div class="space-y-4">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1 min-w-0 space-y-2">
              <div class="h-8 bg-gray-400 rounded w-3/4"></div> <!-- Contact Name -->
              <div class="flex items-center gap-2">
                <div class="h-6 bg-gray-400 rounded w-20"></div> <!-- Email Button -->
                <div class="h-6 bg-gray-400 rounded w-20"></div> <!-- Call Button -->
              </div>
            </div>
            <div class="flex flex-shrink-0 items-center gap-2">
               <div class="h-6 w-6 bg-gray-400 rounded-md"></div> <!-- Refresh -->
               <div class="h-6 w-6 bg-gray-400 rounded-md"></div> <!-- Close -->
            </div>
          </div>
          <div class="flex items-center flex-wrap gap-2">
              <div class="h-6 bg-gray-400 rounded w-32"></div> <!-- Stage -->
              <div class="h-6 bg-gray-400 rounded w-32"></div> <!-- Tranche -->
              <div class="h-6 bg-gray-400 rounded w-24"></div> <!-- Size -->
              <div class="h-6 bg-gray-400 rounded w-24"></div> <!-- Payment -->
              <div class="h-6 bg-gray-400 rounded w-28"></div> <!-- Install Date -->
              <div class="h-6 bg-gray-400 rounded w-28"></div> <!-- Sold Date -->
          </div>
           <div class="h-5 bg-gray-400 rounded w-1/2"></div> <!-- Address -->
          <hr class="border-gray-400/50">
           <div class="h-5 bg-gray-400 rounded w-3/5"></div> <!-- Tags Placeholder -->
        </div>
      </div>

      <!-- Skeleton Tabs -->
      <div class="bg-gray-100 px-6 pt-1 border-b border-gray-200">
           <div class="flex space-x-8 -mb-px">
                <div class="h-10 w-20 bg-gray-300 border-b-2 border-gray-400"></div>
                <div class="h-10 w-20 bg-gray-300 border-b-2 border-transparent"></div>
                <div class="h-10 w-20 bg-gray-300 border-b-2 border-transparent"></div>
                <div class="h-10 w-20 bg-gray-300 border-b-2 border-transparent"></div>
                <div class="h-10 w-20 bg-gray-300 border-b-2 border-transparent"></div>
           </div>
      </div>

      <!-- Skeleton Content Area -->
      <div class="p-6 space-y-4">
        <div class="h-40 bg-gray-200 rounded"></div>
        <div class="h-60 bg-gray-200 rounded"></div>
      </div>
    </div>
  `
};

export default ProjectDetailModalSkeleton; 