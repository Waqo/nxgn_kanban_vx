const ProjectDetailModalSkeleton = {
  name: 'ProjectDetailModalSkeleton',
  template: `
    <div class="animate-pulse space-y-0">
      <!-- Skeleton Header -->
      <div class="modal-header-content flex-none border-b border-gray-200">
        <div class="bg-gray-300 p-4 sm:p-6">
          <div class="space-y-4">
            <!-- Top Row: Name, Contact Buttons, Action Buttons -->
            <div class="flex flex-wrap justify-between items-start gap-3">
              <div class="flex-1 min-w-0 space-y-2">
                <div class="h-8 bg-gray-400 rounded w-3/4 mb-2"></div> <!-- Contact Name -->
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="h-8 w-24 bg-gray-400 rounded-md"></div> <!-- Email Button -->
                  <div class="h-8 w-24 bg-gray-400 rounded-md"></div> <!-- Call Button -->
                </div>
              </div>
              <div class="flex flex-shrink-0 items-center gap-1 sm:gap-2">
                <div class="h-7 w-7 bg-gray-400 rounded-md"></div> <!-- Ellipsis -->
                <div class="h-7 w-7 bg-gray-400 rounded-md"></div> <!-- Edit -->
                <div class="h-7 w-7 bg-gray-400 rounded-md"></div> <!-- Refresh -->
                <div class="h-7 w-7 bg-gray-400 rounded-md"></div> <!-- Close -->
              </div>
            </div>

            <!-- Mid Row: Selects, Badges/Info -->
            <div class="mt-4 flex items-center flex-wrap justify-start gap-x-3 gap-y-2">
              <div class="h-8 w-40 bg-gray-400 rounded-md"></div> <!-- Stage Select -->
              <div class="h-8 w-36 bg-gray-400 rounded-md"></div> <!-- Tranche Select -->
              <div class="h-8 w-36 bg-gray-400 rounded-md"></div> <!-- Funded Checkbox -->
              <div class="h-8 w-24 bg-gray-400 rounded-md"></div> <!-- Size -->
              <div class="h-8 w-24 bg-gray-400 rounded-md"></div> <!-- Payment -->
              <div class="h-8 w-32 bg-gray-400 rounded-md"></div> <!-- Install Date -->
              <div class="h-8 w-32 bg-gray-400 rounded-md"></div> <!-- Sold Date -->
              <div class="h-8 w-16 bg-gray-400 rounded-md"></div> <!-- Type Badge -->
            </div>

            <!-- Address and Sales Rep Row -->
            <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-1 pt-1">
              <div class="h-5 bg-gray-400 rounded w-1/2 md:w-1/3"></div> <!-- Address -->
              <div class="h-5 bg-gray-400 rounded w-1/2 md:w-1/3"></div> <!-- Sales Rep Info -->
            </div>

            <hr class="border-gray-400/50 my-3">

            <!-- Tags Row -->
            <div class="flex flex-wrap justify-between items-center gap-x-4 gap-y-2">
              <div class="flex items-center gap-2 flex-wrap flex-1 min-w-[200px]">
                <div class="h-5 w-10 bg-gray-400 rounded"></div> <!-- "Tags:" Label -->
                <div class="h-6 w-16 bg-gray-400 rounded-full"></div> <!-- Tag 1 -->
                <div class="h-6 w-20 bg-gray-400 rounded-full"></div> <!-- Tag 2 -->
                <div class="h-6 w-24 bg-gray-400 rounded-full"></div> <!-- Tag 3 -->
                <div class="h-6 w-6 bg-gray-400 rounded-full"></div> <!-- Add Tag Btn -->
              </div>
              <!-- External Links (implicitly part of header structure but not explicitly skeletonized here) -->
            </div>
          </div>
        </div>

        <!-- Skeleton Counters -->
        <div class="bg-gray-200 p-3 border-y border-gray-300">
          <div class="flex items-center justify-start gap-3 flex-wrap">
             <div class="h-7 w-48 bg-gray-400 rounded-md"></div> <!-- Counter 1 -->
             <div class="h-5 w-px bg-gray-400"></div> <!-- Divider -->
             <div class="h-7 w-52 bg-gray-400 rounded-md"></div> <!-- Counter 2 -->
             <div class="h-5 w-px bg-gray-400"></div> <!-- Divider -->
             <div class="h-7 w-44 bg-gray-400 rounded-md"></div> <!-- Counter 3 -->
          </div>
        </div>
      </div>


      <!-- Skeleton Tabs -->
      <div class="bg-gray-100 px-6 border-b border-gray-200 sticky top-0 z-10">
           <div class="flex space-x-8 -mb-px h-12 items-end">
                <div class="w-20 border-b-2 border-blue-500"><div class="h-5 bg-gray-400 rounded w-16 mb-2"></div></div> <!-- Active Tab -->
                <div class="w-24 border-b-2 border-transparent"><div class="h-5 bg-gray-300 rounded w-20 mb-2"></div></div> <!-- Inactive Tab -->
                <div class="w-24 border-b-2 border-transparent"><div class="h-5 bg-gray-300 rounded w-20 mb-2"></div></div> <!-- Inactive Tab -->
                <div class="w-20 border-b-2 border-transparent"><div class="h-5 bg-gray-300 rounded w-16 mb-2"></div></div> <!-- Inactive Tab -->
                <!-- Add more tabs as needed -->
           </div>
      </div>

      <!-- Skeleton Content Area -->
      <div class="p-6 space-y-6 modal-content-area tab-content">
        <!-- Example Content Placeholder (like OverviewTab) -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <!-- Left Column -->
          <div class="lg:col-span-3 space-y-6">
            <div class="h-64 bg-gray-200 rounded-lg"></div> <!-- Card 1 -->
          </div>
          <!-- Right Column -->
          <div class="lg:col-span-2 space-y-6">
             <div class="h-48 bg-gray-200 rounded-lg"></div> <!-- Card 2 -->
             <div class="h-40 bg-gray-200 rounded-lg"></div> <!-- Card 3 -->
          </div>
        </div>
         <div class="h-80 bg-gray-200 rounded-lg mt-6"></div> <!-- Full Width Card (like Notes) -->
      </div>
    </div>
  `
};

export default ProjectDetailModalSkeleton; 