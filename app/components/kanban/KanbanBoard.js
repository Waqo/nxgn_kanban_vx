// app/components/kanban/KanbanBoard.js

import KanbanColumn from './KanbanColumn.js';
// Import Local Storage utility
import { loadSetting, saveSetting, LS_KEYS } from '../../utils/localStorage.js';

// --- Pinia Store Imports ---
import { useUiStore } from '../../store/uiStore.js';
import { useLookupsStore } from '../../store/lookupsStore.js'; // Import lookups store
import { useProjectsStore } from '../../store/projectsStore.js'; // Import projects store

// --- Pinia Helper Import ---
const { mapState, mapActions } = Pinia;

// Vuex no longer needed here unless modal module is used directly
// if (typeof Vuex === 'undefined') {
//   console.warn('Vuex might not be loaded yet for mapState helper in KanbanBoard.');
// }

const KanbanBoard = {
  name: 'KanbanBoard',
  components: {
    KanbanColumn,
  },
  // Props are removed as data will come from the store
  data() {
    return {
      // Local state for the board, e.g., drag/drop state
      draggedCardId: null,
      sourceColumnId: null, // Renamed from sourceStageId
      // Load initial collapsed state from local storage, default to empty object
      collapsedColumns: loadSetting(LS_KEYS.COLLAPSED_COLUMNS, {}),
    };
  },
  computed: {
    // --- Map Pinia State/Getters ---
    ...mapState(useUiStore, ['currentStageView', 'boardViewMode']),
    ...mapState(useLookupsStore, {
        stages: 'stages', 
        tranches: 'tranches', 
        isLoadingLookups: 'isLoading', 
        lookupsError: 'error' 
    }),
    // Map projects state/getters
    ...mapState(useProjectsStore, {
        isLoadingProjects: 'isLoading',
        projectError: 'error',
        displayProjects: 'filteredSortedProjects' // Use the main filtered/sorted getter
    }),

    // --- Map Remaining Vuex State --- (None needed)
    // ...(typeof Vuex !== 'undefined' ? Vuex.mapState({ ... }) : { ... }),

    // --- Map Remaining Vuex Getters --- (None needed)
    // ...(typeof Vuex !== 'undefined' ? Vuex.mapGetters({ ... }) : { ... }),

    // Combined loading state (now uses Pinia isLoadingLookups and isLoadingProjects)
    isLoading() {
        return this.isLoadingProjects || this.isLoadingLookups;
    },
    // Combined error state (now uses Pinia lookupsError and projectError)
    error() {
        // Prioritize project error? Or combine messages?
        return this.projectError || this.lookupsError;
    },

    // New getter to filter stages based on current view
    displayedStages() {
        console.log(`[Board] displayedStages computed. currentStageView = ${this.currentStageView}`); // Log evaluation
        if (!Array.isArray(this.stages)) return [];
        if (this.currentStageView === 'all') {
            console.log("[Board] displayedStages returning all.");
            return this.stages; // Show all if 'all' is selected
        }
        // Filter stages based on the view property (case-insensitive comparison)
        const filtered = this.stages.filter(stage => 
            stage.view?.toLowerCase() === this.currentStageView || stage.view?.toLowerCase() === 'both'
        );
        console.log(`[Board] displayedStages returning ${filtered.length} stages.`);
        return filtered;
    },

    // Group projects by stage using the filtered/sorted list and DISPLAYED stages
    projectsByStage() {
      const grouped = {};
      const stagesToGroup = this.displayedStages || []; 
      if (!Array.isArray(stagesToGroup)) {
          return grouped;
      }
      const projectsToFilter = this.displayProjects || [];
      
      stagesToGroup.forEach(stage => {
        if (stage && stage.id) {
            grouped[stage.id] = projectsToFilter.filter(p => p.New_Stage && p.New_Stage.ID === stage.id);
        } else {
             console.warn("KanbanBoard: Skipping stage due to missing id:", stage);
        }
      });
      return grouped;
    },
    // Group projects by tranche
    projectsByTranche() {
        const grouped = {};
        if (!Array.isArray(this.tranches)) return grouped;
        
        const projectsToGroup = this.displayProjects || []; 
        const assignedProjectIds = new Set(); // Keep track of assigned projects

        // Group projects into existing tranches
        this.tranches.forEach(tranche => {
            if (tranche && tranche.id) {
                const trancheProjects = projectsToGroup.filter(p => {
                    const isMatch = p.Tranche?.ID === tranche.id;
                    if (isMatch) {
                        assignedProjectIds.add(p.ID); // Mark project as assigned using ID
                    }
                    return isMatch;
                });
                grouped[tranche.id] = trancheProjects;
            } else {
                 console.warn("KanbanBoard: Skipping tranche due to missing id:", tranche);
            }
        });
        
        // Group unassigned projects
        grouped['unassigned'] = projectsToGroup.filter(p => !assignedProjectIds.has(p.ID)); // Check using ID
        
        console.log('KanbanBoard: Projects grouped by tranche (with unassigned):', grouped);
        return grouped;
    },
  },
  watch: {
      // Watch displayedStages (covers stage view changes)
      displayedStages: {
          handler(newStages) {
              console.log("[Board Watcher] displayedStages updated."); // Keep log for debugging if needed
          },
          immediate: true 
      },
      // Watch projectsByStage (covers filtering changes)
      projectsByStage: {
          handler(newGroups) {
              console.log("[Board Watcher] projectsByStage updated."); // Keep log for debugging if needed
          },
          deep: true 
      },
       // ADD Watcher specifically for projectsByTranche
       projectsByTranche: {
            handler(newGroups) {
                console.log("[Board Watcher] projectsByTranche updated.");
                // Use this.tranches for initialization key matching if in tranche mode
                 if (this.boardViewMode === 'tranches') {
                     const columnList = [{id: 'unassigned'}, ...(this.tranches || [])]; // Include unassigned
                     // REMOVED: this.initializeCollapsedState(columnList, newGroups);
                 }
            },
            deep: true
       }
  },
  methods: {
    // --- Map Pinia Actions ---
    ...mapActions(useProjectsStore, [
        'updateProjectStage', 
        'updateProjectTranche'
    ]),

    // Drag and Drop Handlers
    handleDragStart(cardId, columnId) { // Use generic columnId
      console.log(`KanbanBoard: Drag started - Card: ${cardId}, Source Column: ${columnId}`);
      this.draggedCardId = cardId;
      this.sourceColumnId = columnId; // Store source column ID
    },
    handleDragEnd() {
      console.log('KanbanBoard: Drag ended');
      this.resetDragState(); 
    },
    handleDrop(targetColumnId) { // Use generic targetColumnId
      console.log(`KanbanBoard: Drop detected - Card: ${this.draggedCardId}, Target Column: ${targetColumnId}`);
      if (!this.draggedCardId || this.sourceColumnId === targetColumnId) {
        console.log('KanbanBoard: Drop ignored (no card dragged or same column).');
        this.resetDragState(); 
        return;
      }

      const cardIdToMove = this.draggedCardId;
      const sourceColId = this.sourceColumnId; // Use renamed var
      const targetColId = targetColumnId;
      this.resetDragState(); // Reset state before dispatching

      // Ensure IDs are valid before proceeding
      if (!cardIdToMove) {
        console.error("KanbanBoard: Invalid cardIdToMove during drop");
        this.resetDragState();
        return;
      }

      // --- Call mapped Pinia actions directly --- 
      if (this.boardViewMode === 'tranches') {
          console.log(`KanbanBoard: Calling Pinia updateProjectTranche...`);
          // Call mapped action
          this.updateProjectTranche({ projectId: cardIdToMove, newTrancheId: targetColId })
              .catch(error => console.error("KanbanBoard: Error calling updateProjectTranche:", error));
      } else { // Default to stage view
          console.log(`KanbanBoard: Calling Pinia updateProjectStage...`);
          // Call mapped action
          this.updateProjectStage({ projectId: cardIdToMove, newStageId: targetColId })
              .catch(error => console.error("KanbanBoard: Error calling updateProjectStage:", error));
      }
    },
    resetDragState() {
       this.draggedCardId = null;
       this.sourceColumnId = null; // Use renamed var
    },
    // Method to handle the toggle event from KanbanColumn
    handleToggleCollapse(columnId) { // Use generic columnId
        console.log(`KanbanBoard: Toggling collapse for column ${columnId}`);
        const newCollapsedState = { ...this.collapsedColumns };
        newCollapsedState[columnId] = !newCollapsedState[columnId];
        this.collapsedColumns = newCollapsedState;
        saveSetting(LS_KEYS.COLLAPSED_COLUMNS, this.collapsedColumns);
    },
    // Method to set initial/updated collapsed state (NOW CALLED ONLY ONCE during setup)
    initializeCollapsedState() { // Removed parameters as they are no longer needed here
         console.log('KanbanBoard: Initializing collapsed state from localStorage...');
         // Directly load from local storage. No need to merge with defaults based on current columns here.
         // The KanbanColumn component will simply read its state from collapsedColumns.
         // If a column ID isn't in the loaded object, it will default to not collapsed.
         const loadedState = loadSetting(LS_KEYS.COLLAPSED_COLUMNS, {});
         this.collapsedColumns = loadedState;
         console.log('KanbanBoard: Collapsed state initialized:', this.collapsedColumns);
    }
    // Other methods like handling card clicks/double-clicks for modal
  },
  mounted() {
      // Call initializeCollapsedState explicitly here ONCE when the component is mounted.
      this.initializeCollapsedState(); 
  },
  // Reference the template defined in widget.html
  template: `
      <div class="kanban-board-content flex flex-col h-full">
        <!-- Error Message -->
        <div v-if="error" class="p-4 m-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong class="font-bold">Error loading data:</strong>
          <span class="block sm:inline">{{ error }}</span>
        </div>
        
        <!-- Loading State -->
        <div v-else-if="isLoading && ((boardViewMode === 'stages' && (!displayedStages || displayedStages.length === 0)) || (boardViewMode === 'tranches' && (!tranches || tranches.length === 0)))" class="flex-grow flex items-center justify-center">
            Loading Columns and Projects...
        </div>

        <!-- Stage View -->
        <div v-else-if="boardViewMode === 'stages'" class="flex-grow flex space-x-4 overflow-x-auto p-4 bg-gray-200 h-full items-start">
          <kanban-column 
            v-for="stage in displayedStages" 
            :key="stage.id" 
            :stage="stage" 
            :projects="projectsByStage[stage.id] || []"
            :is-collapsed="collapsedColumns[stage.id] || false" 
            :dragged-card-id="draggedCardId"
            @card-drag-start="handleDragStart"  
            @card-drag-end="handleDragEnd"
            @column-drop="handleDrop(stage.id)" 
            @toggle-collapse="handleToggleCollapse(stage.id)" 
            >
          </kanban-column>
           <div v-if="!isLoading && (!displayedStages || displayedStages.length === 0)" class="text-gray-500">
               No stages found for the selected view.
           </div>
        </div>

        <!-- Tranche View -->
        <div v-else-if="boardViewMode === 'tranches'" class="flex-grow flex space-x-4 overflow-x-auto p-4 bg-gray-200 h-full items-start"> 
            <!-- Unassigned Column -->
            <kanban-column 
              key="tranche-unassigned"
              :stage="{ id: 'unassigned', title: 'Unassigned' }" 
              :projects="projectsByTranche['unassigned'] || []"
              :is-collapsed="collapsedColumns['unassigned'] || false" 
              :dragged-card-id="draggedCardId"
              @card-drag-start="handleDragStart" 
              @card-drag-end="handleDragEnd"
              @column-drop="handleDrop('unassigned')"  
              @toggle-collapse="handleToggleCollapse('unassigned')" 
            /> 
            <!-- Existing Tranche Columns -->
            <kanban-column 
              v-for="tranche in tranches" 
              :key="'tranche-' + tranche.id" 
              :stage="{ id: tranche.id, title: 'Tranche ' + tranche.number }" 
              :projects="projectsByTranche[tranche.id] || []"
              :is-collapsed="collapsedColumns[tranche.id] || false" 
              :dragged-card-id="draggedCardId"
              @card-drag-start="handleDragStart" 
              @card-drag-end="handleDragEnd"
              @column-drop="handleDrop(tranche.id)"
              @toggle-collapse="handleToggleCollapse(tranche.id)"
            /> 
            <div v-if="!isLoading && (!tranches || tranches.length === 0) && (!projectsByTranche['unassigned'] || projectsByTranche['unassigned'].length === 0)" class="text-gray-500">
                No tranches or unassigned projects found.
            </div>
        </div> 

      </div>
    `
};

// Expose the component definition globally within the AppComponents object
// window.AppComponents = window.AppComponents || {};
// window.AppComponents.KanbanBoard = KanbanBoard; 
export default KanbanBoard; 